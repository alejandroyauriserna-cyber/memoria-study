import { NextResponse } from "next/server";
import { generateStudyDeck } from "@/lib/ai/generate-study-deck";
import { parseGenerationCounts } from "@/lib/ai/generation-counts";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import { extractPdfText } from "@/lib/pdf/extract";
import type { AcademicSelection } from "@/types/academic";

export const runtime = "nodejs";
export const maxDuration = 180;

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

export async function POST(request: Request) {
  try {
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

    if (!academic) {
      return NextResponse.json(
        { error: "Selecciona año, ciclo, curso y semana." },
        { status: 400 },
      );
    }

    const { text, method } = await extractPdfText(file, { forceScanned });

    const deck = await generateStudyDeck({
      sourceName: file.name,
      text,
      audience:
        typeof audience === "string" ? audience : UNT_DERECHO_AUDIENCE,
      academic,
      counts,
      ocrUsed: method === "gemini-ocr",
    });

    return NextResponse.json({
      deck: { ...deck, academic },
      pdfText: text,
      extractionMethod: method,
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
