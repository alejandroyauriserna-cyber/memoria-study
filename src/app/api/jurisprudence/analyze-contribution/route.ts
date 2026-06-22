import { NextResponse } from "next/server";
import { z } from "zod";
import { humanizeAiError, isAiCatalogBlockedError } from "@/lib/ai/humanize-ai-error";
import { getTextAiProviderStatus } from "@/lib/ai/server-ai-env";
import { isTextAiProvidersFailedError } from "@/lib/ai/text-ai-providers-failed";
import {
  computeOverallConfidence,
  extractJurisprudenceMetadataWithAi,
  itemNeedsReview,
} from "@/lib/jurisprudence/ai-extract-metadata";
import { isAllowedDocumentWebUrl, normalizeWebUrlInput } from "@/lib/legal-sources/allowed-url-domains";
import {
  getUntAccessDenialMessage,
  isUntInstitutionalEmail,
} from "@/lib/jurisprudence/unt-access";
import {
  getEmailConfirmationMessage,
  isEmailConfirmed,
} from "@/lib/jurisprudence/require-confirmed-email";
import { requireAuth } from "@/lib/api/require-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { extractPdfFromBuffer, prepareTextForGeneration } from "@/lib/pdf/extract";

export const runtime = "nodejs";
export const maxDuration = 120;

import { JURISPRUDENCE_MAX_FILE_SIZE, jurisprudenceMaxFileSizeLabel } from "@/lib/jurisprudence/upload-limits";
const MIN_TEXT_CHARS = 80;

const analyzeJsonSchema = z.object({
  fileName: z.string().min(1),
  text: z.string().min(1),
  extractionMethod: z.string().optional(),
});

async function analyzeFromExtractedText(fileName: string, text: string) {
  const prepared = prepareTextForGeneration(text, 120_000);

  if (prepared.text.length < MIN_TEXT_CHARS) {
    return NextResponse.json(
      {
        error:
          "No se extrajo suficiente texto. Si es un PDF escaneado, prueba con una versión con texto seleccionable.",
      },
      { status: 422 },
    );
  }

  console.info("[jurisprudence/analyze-contribution] AI providers", getTextAiProviderStatus());

  const { suggested, confidence, catalogProvider, catalogModel } =
    await extractJurisprudenceMetadataWithAi({
      extractedText: prepared.text,
      fileName,
    });

  const overallConfidence = computeOverallConfidence(confidence);

  return NextResponse.json({
    ok: true,
    suggested,
    confidence,
    overallConfidence,
    needsReview: itemNeedsReview(confidence),
    asuntoPrincipal: suggested.asuntoPrincipal ?? null,
    catalogProvider,
    catalogModel,
  });
}

async function extractTextFromPdfSource(input: {
  file?: File;
  pdfUrl?: string;
}): Promise<{ text: string; fileName: string }> {
  if (input.file) {
    const buffer = Buffer.from(await input.file.arrayBuffer());
    const { text } = await extractPdfFromBuffer(buffer, input.file.name);
    return {
      text: prepareTextForGeneration(text, 120_000).text,
      fileName: input.file.name,
    };
  }

  if (!input.pdfUrl) {
    throw new Error("Sube un PDF o pega un enlace oficial.");
  }

  const normalizedUrl = normalizeWebUrlInput(input.pdfUrl);
  if (!isAllowedDocumentWebUrl(normalizedUrl)) {
    throw new Error(
      "Solo se admiten enlaces oficiales (PJ, TC, SUNAT, SPIJ o LP Pasión por el Derecho).",
    );
  }

  const response = await fetch(normalizedUrl, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    throw new Error("No se pudo descargar el PDF desde el enlace.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const fileName = normalizedUrl.split("/").pop() || "documento.pdf";
  const { text } = await extractPdfFromBuffer(buffer, fileName);

  return {
    text: prepareTextForGeneration(text, 120_000).text,
    fileName,
  };
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const auth = await requireAuth(request, { rateLimit: { limit: 20, windowMs: 3_600_000 } });
    if (auth instanceof NextResponse) return auth;
    const user = auth.user;

    if (!isUntInstitutionalEmail(user.email)) {
      return NextResponse.json({ error: getUntAccessDenialMessage() }, { status: 403 });
    }

    if (!isEmailConfirmed(user)) {
      return NextResponse.json({ error: getEmailConfirmationMessage() }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const parsed = analyzeJsonSchema.parse(await request.json());
      return analyzeFromExtractedText(parsed.fileName, parsed.text);
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const pdfUrl = String(formData.get("pdfUrl") ?? "").trim() || undefined;

    const hasFile = file instanceof File;
    if (!hasFile && !pdfUrl) {
      return NextResponse.json(
        { error: "Sube un PDF o pega el enlace oficial al documento." },
        { status: 400 },
      );
    }

    if (hasFile) {
      const pdfFile = file as File;
      if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Solo se admiten archivos PDF." }, { status: 400 });
      }
      if (pdfFile.size > JURISPRUDENCE_MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `El PDF no puede superar ${jurisprudenceMaxFileSizeLabel()}.` },
          { status: 400 },
        );
      }
    }

    const { text, fileName } = await extractTextFromPdfSource({
      file: hasFile ? (file as File) : undefined,
      pdfUrl,
    });

    return analyzeFromExtractedText(fileName, text);
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Solicitud de análisis inválida." }, { status: 400 });
    }

    console.error("[jurisprudence/analyze-contribution]", caught);

    const providerStatus = getTextAiProviderStatus();
    if (isTextAiProvidersFailedError(caught)) {
      console.error("[jurisprudence/analyze-contribution] AI providers", {
        configured: caught.providersConfigured,
        attempted: caught.providersAttempted,
      });
    }

    const raw = caught instanceof Error ? caught.message : "No se pudo analizar el documento.";
    const openRouterAttempted = isTextAiProvidersFailedError(caught)
      ? caught.providersAttempted.includes("openrouter")
      : /openrouter:/i.test(raw);

    const error = humanizeAiError(raw, {
      openRouterConfigured: providerStatus.openrouter,
      openRouterAttempted,
    });
    const status = isAiCatalogBlockedError(raw) || isTextAiProvidersFailedError(caught) ? 503 : 500;

    return NextResponse.json(
      {
        error,
        manualEntryAllowed: true,
        aiProviders: {
          ...providerStatus,
          openRouterAttempted,
        },
      },
      { status },
    );
  }
}
