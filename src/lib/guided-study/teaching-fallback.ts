import { z } from "zod";
import { generateTextWithFallback } from "@/lib/ai/generate-text-with-fallback";
import { GUIDED_STUDY_SYSTEM_ROLE } from "@/lib/guided-study/prompts";
import {
  cleanPageTextForStudy,
  extractMainBodyBlock,
  hasSubstantiveStudyText,
} from "@/lib/guided-study/prepare-study-page-text";
import type { PageProfessorAnalysis } from "@/types/guided-legal-study";

const TeachingFallbackSchema = z.object({
  pageFocus: z.string(),
  conceptCards: z
    .array(
      z.object({
        concept: z.string(),
        explanation: z.string(),
        example: z.string().default(""),
        examImportance: z.string().default(""),
      }),
    )
    .min(1)
    .max(6),
});

export async function generateTeachingFallback(input: {
  pageText: string;
  pageNumber: number;
  documentTitle: string;
  chapterTitle?: string;
}): Promise<PageProfessorAnalysis | null> {
  const body =
    cleanPageTextForStudy(input.pageText) ||
    cleanPageTextForStudy(extractMainBodyBlock(input.pageText)) ||
    extractMainBodyBlock(input.pageText);

  if (!body || body.length < 80) {
    return null;
  }

  const prompt = `${GUIDED_STUDY_SYSTEM_ROLE}

Explica esta página como clase magistral para estudiar Derecho peruano.
NO copies bibliografía, notas al pie, autores ni referencias editoriales.
Enseña definiciones, clasificaciones, efectos y distinciones en lenguaje claro.

DOCUMENTO: ${input.documentTitle}
${input.chapterTitle ? `CAPÍTULO: ${input.chapterTitle}` : ""}
PÁGINA: ${input.pageNumber}

TEXTO DE ESTUDIO (solo contenido doctrinal):
${body.slice(0, 9000)}

Responde SOLO JSON válido:
{
  "pageFocus": "2-3 oraciones sobre qué debe dominar el estudiante",
  "conceptCards": [
    {
      "concept": "Nombre del instituto jurídico",
      "explanation": "4-8 oraciones didácticas",
      "example": "Caso o hipótesis peruana concreta",
      "examImportance": "Por qué cae en examen"
    }
  ]
}`;

  try {
    const { text: raw } = await generateTextWithFallback({
      prompt,
      temperature: 0.35,
      json: true,
    });

    const parsed = TeachingFallbackSchema.parse(JSON.parse(raw));
    return {
      pageFocus: parsed.pageFocus,
      secondaryMentions: [],
      keyLearning: parsed.conceptCards.slice(0, 4).map((card, index) => ({
        id: `kl-${index + 1}`,
        label: card.concept,
        essential: true,
      })),
      highlights: [],
      conceptCards: parsed.conceptCards.map((card, index) => ({
        id: `tf-${index + 1}`,
        concept: card.concept,
        explanation: card.explanation,
        example: card.example,
        examImportance: card.examImportance,
        essential: true,
      })),
      examMode: {
        oral: [],
        desarrollo: [],
        test: [],
        memorableConcepts: [],
        commonErrors: [],
      },
      citations: [],
    };
  } catch (error) {
    console.error("[guided-study/teaching-fallback]", error);
    return null;
  }
}

export function needsTeachingFallback(pageText: string, analysis?: PageProfessorAnalysis | null): boolean {
  if (!analysis?.conceptCards.length) return true;

  const combined = analysis.conceptCards
    .map((card) => `${card.concept} ${card.explanation}`)
    .join(" ");

  if (!hasSubstantiveStudyText(combined) && !hasSubstantiveStudyText(pageText)) {
    return true;
  }

  return analysis.conceptCards.every(
    (card) =>
      card.explanation.length < 120 ||
      /Tecnos|Madrid|GALGANO|GAZZONI|Giuffr[eè]|Revista de Derecho|Contenido jurídico — página/i.test(
        `${card.concept} ${card.explanation}`,
      ),
  );
}
