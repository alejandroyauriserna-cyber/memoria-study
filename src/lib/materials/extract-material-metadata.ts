import { z } from "zod";
import { detectionToSelection, detectCourseFromText } from "@/lib/academic/detect-course";
import { generateTextWithFallback } from "@/lib/ai/generate-text-with-fallback";
import { prepareTextForGeneration } from "@/lib/pdf/extract";
import type { AcademicSelection } from "@/types/academic";
import type { CourseDetectionResult } from "@/types/course-detection";

export const MATERIAL_UPLOAD_TYPES = ["apunte", "resumen", "pdf", "caso", "guia", "otro"] as const;
export type MaterialUploadType = (typeof MATERIAL_UPLOAD_TYPES)[number];

const AiMaterialSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  materialType: z.enum(MATERIAL_UPLOAD_TYPES),
  confidence: z.object({
    title: z.number().min(0).max(1).optional(),
    description: z.number().min(0).max(1).optional(),
    materialType: z.number().min(0).max(1).optional(),
  }),
});

export type MaterialUploadSuggestion = {
  title: string;
  description: string;
  materialType: MaterialUploadType;
  academic: AcademicSelection | null;
  detection: CourseDetectionResult | null;
  conceptsDetected: string[];
};

export type MaterialUploadConfidence = {
  title?: number;
  description?: number;
  materialType?: number;
  course?: number;
};

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.(pdf|pptx|pptm)$/i, "").replace(/[_-]+/g, " ").trim();
  if (base.length >= 3) return base;
  return "Material jurídico UNT";
}

function guessTypeFromFileName(fileName: string): MaterialUploadType {
  const n = fileName.toLowerCase();
  if (n.endsWith(".pptx") || n.endsWith(".pptm") || n.includes("present")) return "guia";
  if (n.includes("resumen")) return "resumen";
  if (n.includes("caso")) return "caso";
  if (n.includes("guia") || n.includes("guía")) return "guia";
  if (n.includes("apunte")) return "apunte";
  return "apunte";
}

function pickHeaderSample(fullText: string, fileName: string): string {
  const prepared = prepareTextForGeneration(fullText, 14_000);
  const head = prepared.text.slice(0, 10_000);
  return `ARCHIVO: ${fileName}\n\nTEXTO (prioriza título, tema, sumilla, índice, primeras páginas):\n${head}`;
}

export async function extractMaterialUploadMetadata(input: {
  extractedText: string;
  fileName: string;
  aiTimeoutMs?: number;
}): Promise<{ suggested: MaterialUploadSuggestion; confidence: MaterialUploadConfidence }> {
  const sample = input.extractedText.slice(0, 120_000);
  const detection = detectCourseFromText(sample);
  const academic = detection ? detectionToSelection(detection) : null;
  const aiTimeoutMs = input.aiTimeoutMs ?? 20_000;

  const prompt = `Eres un asistente de biblioteca jurídica universitaria (UNT — Derecho).

Analiza el documento y propone metadatos para publicarlo en la biblioteca colaborativa de materiales de estudio.
Si es una presentación PowerPoint (.pptx), resume el tema de las diapositivas y notas del presentador.

TIPOS PERMITIDOS (materialType, valor exacto):
apunte, resumen, pdf, caso, guia, otro

INSTRUCCIONES:
- title: título claro para estudiantes (no copies solo el nombre del archivo)
- description: 2-4 oraciones sobre qué temas cubre y para qué sirve en el curso (mínimo 40 caracteres)
- materialType: el tipo más adecuado según el contenido
- NO inventes datos que no aparezcan en el texto
- confidence: probabilidad 0-1 de cada campo

Responde SOLO JSON válido:
{
  "title": "...",
  "description": "...",
  "materialType": "apunte",
  "confidence": { "title": 0.9, "description": 0.85, "materialType": 0.8 }
}

${pickHeaderSample(sample, input.fileName)}`;

  try {
    const { text: raw } = await generateTextWithFallback({
      prompt,
      temperature: 0.15,
      json: true,
      timeoutMs: aiTimeoutMs,
    });

    const parsed = AiMaterialSchema.parse(JSON.parse(raw));

    return {
      suggested: {
        title: parsed.title.trim(),
        description: parsed.description.trim(),
        materialType: parsed.materialType,
        academic,
        detection,
        conceptsDetected: detection?.conceptsDetected ?? [],
      },
      confidence: {
        ...parsed.confidence,
        course: detection?.confidence,
      },
    };
  } catch {
    const fallbackTitle = titleFromFileName(input.fileName);
    const snippet = prepareTextForGeneration(sample, 400).text.replace(/\s+/g, " ").trim();
    const fallbackDescription =
      snippet.length >= 10
        ? `Material de estudio jurídico. ${snippet.slice(0, 220)}${snippet.length > 220 ? "…" : ""}`
        : "Material de estudio jurídico compartido por la comunidad UNT.";

    return {
      suggested: {
        title: fallbackTitle,
        description: fallbackDescription,
        materialType: guessTypeFromFileName(input.fileName),
        academic,
        detection,
        conceptsDetected: detection?.conceptsDetected ?? [],
      },
      confidence: {
        title: 0.35,
        description: 0.3,
        materialType: 0.4,
        course: detection?.confidence,
      },
    };
  }
}
