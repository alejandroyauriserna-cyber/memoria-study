import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { generateStudyDeck } from "@/lib/ai/generate-study-deck";
import { parseGenerationCounts } from "@/lib/ai/generation-counts";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import { MAX_FILE_SIZE } from "@/lib/pdf/constants";
import { extractPdfText, prepareTextForGeneration } from "@/lib/pdf/extract";
import type { AcademicSelection } from "@/types/academic";

export const runtime = "nodejs";
export const maxDuration = 300;

function parseJsonField<T>(raw: FormDataEntryValue | null): T | undefined {
  if (typeof raw !== "string" || !raw.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

type GenerateJsonBody = {
  sourceName: string;
  text: string;
  audience?: string;
  academic?: AcademicSelection;
  counts?: unknown;
  ocrUsed?: boolean;
};

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request, { rateLimit: { limit: 20, windowMs: 60_000 } });
    if (auth instanceof NextResponse) return auth;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as GenerateJsonBody;

      if (typeof body.text !== "string" || !body.text.trim() || !body.sourceName) {
        return NextResponse.json(
          { error: "Faltan el texto del PDF o el nombre del archivo." },
          { status: 400 },
        );
      }

      if (!body.academic) {
        return NextResponse.json(
          { error: "Selecciona año, ciclo, curso y semana." },
          { status: 400 },
        );
      }

      const counts = parseGenerationCounts(body.counts);
      const prepared = prepareTextForGeneration(body.text);

      const deck = await generateStudyDeck({
        sourceName: body.sourceName,
        text: prepared.text,
        audience: body.audience ?? UNT_DERECHO_AUDIENCE,
        academic: body.academic,
        counts,
        ocrUsed: Boolean(body.ocrUsed),
      });

      return NextResponse.json({
        deck: { ...deck, academic: body.academic },
        pdfText: prepared.text,
        truncated: prepared.truncated,
      });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const audience = formData.get("audience");
    const academic = parseJsonField<AcademicSelection>(formData.get("academic"));
    const counts = parseGenerationCounts(
      parseJsonField(formData.get("counts")),
    );
    const forceScanned = formData.get("forceScanned") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Debes subir un PDF." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El PDF supera el límite de 150 MB." },
        { status: 400 },
      );
    }

    if (!academic) {
      return NextResponse.json(
        { error: "Selecciona año, ciclo, curso y semana." },
        { status: 400 },
      );
    }

    const { text, method } = await extractPdfText(file, { forceScanned });
    const prepared = prepareTextForGeneration(text);

    const deck = await generateStudyDeck({
      sourceName: file.name,
      text: prepared.text,
      audience:
        typeof audience === "string" ? audience : UNT_DERECHO_AUDIENCE,
      academic,
      counts,
      ocrUsed: method === "gemini-ocr",
    });

    return NextResponse.json({
      deck: { ...deck, academic },
      pdfText: prepared.text,
      extractionMethod: method,
      truncated: prepared.truncated,
    });
  } catch (caught) {
    console.error(caught);

    return NextResponse.json(
      {
        error:
          caught instanceof Error
            ? caught.message
            : "No se pudo generar el material de estudio.",
      },
      { status: 500 },
    );
  }
}
