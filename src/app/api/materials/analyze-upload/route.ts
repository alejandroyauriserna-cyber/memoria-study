import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { extractMaterialUploadMetadata } from "@/lib/materials/extract-material-metadata";
import { hasSupabaseEnv } from "@/lib/env";
import { extractDocumentFromBuffer } from "@/lib/documents/extract";
import { sniffStudyDocumentKind } from "@/lib/documents/sniff";
import { detectStudyDocumentKind } from "@/lib/documents/kinds";
import { prepareTextForGeneration } from "@/lib/pdf/extract";
import { MAX_FILE_SIZE } from "@/lib/pdf/constants";

export const runtime = "nodejs";
export const maxDuration = 300;

const MIN_TEXT_CHARS = 80;
const METADATA_AI_TIMEOUT_MS = 20_000;

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const auth = await requireAuth(request, { rateLimit: { limit: 25, windowMs: 3_600_000 } });
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Debes subir un PDF o una presentación PowerPoint (.pptx)." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo supera el límite permitido." }, { status: 400 });
    }

    if (!detectStudyDocumentKind(file.name, file.type)) {
      return NextResponse.json(
        { error: "Solo se admiten archivos PDF o PowerPoint (.pptx)." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const kind =
      (await sniffStudyDocumentKind(buffer, file.name, file.type)) ??
      detectStudyDocumentKind(file.name, file.type);

    if (!kind) {
      return NextResponse.json(
        {
          error:
            "Formato no reconocido. Sube el .pptx original de PowerPoint (no un PDF renombrado ni .ppt antiguo).",
        },
        { status: 400 },
      );
    }

    const { text, method } = await extractDocumentFromBuffer(buffer, file.name, {
      skipOcr: true,
    });
    const prepared = prepareTextForGeneration(text, 120_000);

    console.log("[materials/analyze-upload]", {
      fileName: file.name,
      mimeType: file.type,
      kind,
      method,
      textChars: prepared.text.length,
    });

    if (prepared.text.length < MIN_TEXT_CHARS) {
      return NextResponse.json(
        {
          error:
            "No se extrajo suficiente texto. Si subiste un PDF escaneado o una presentación hecha solo con imágenes, usa el .pptx original con texto editable.",
        },
        { status: 422 },
      );
    }

    const { suggested, confidence } = await extractMaterialUploadMetadata({
      extractedText: prepared.text,
      fileName: file.name,
      aiTimeoutMs: METADATA_AI_TIMEOUT_MS,
    });

    const confidenceValues = [
      confidence.title,
      confidence.description,
      confidence.materialType,
      confidence.course,
    ].filter((v): v is number => typeof v === "number" && v > 0);

    const overallConfidence = confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : 0;

    return NextResponse.json({
      ok: true,
      suggested: {
        title: suggested.title,
        description: suggested.description,
        materialType: suggested.materialType,
        academic: suggested.academic,
        detection: suggested.detection,
        conceptsDetected: suggested.conceptsDetected,
      },
      confidence,
      overallConfidence,
      needsReview: overallConfidence < 0.65 || !suggested.academic,
      extractionMethod: method,
    });
  } catch (caught) {
    console.error("[materials/analyze-upload]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo analizar el material." },
      { status: 500 },
    );
  }
}
