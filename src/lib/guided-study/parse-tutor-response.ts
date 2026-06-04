import { z } from "zod";
import type { PageProfessorAnalysis, TutorResponse } from "@/types/guided-legal-study";

const HighlightCategorySchema = z.enum([
  "concepto",
  "definicion",
  "teoria",
  "principio",
  "clasificacion",
  "excepcion",
  "examen",
  "norma",
]);

export const PageAnalysisSchema = z.object({
  pageFocus: z.string().default("Contenido jurídico de la página."),
  secondaryMentions: z
    .array(z.object({ mention: z.string(), briefNote: z.string() }))
    .default([]),
  keyLearning: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        highlightId: z.string().optional(),
        essential: z.boolean().optional(),
      }),
    )
    .default([]),
  highlights: z
    .array(
      z.object({
        id: z.string(),
        phrase: z.string(),
        category: HighlightCategorySchema,
        essential: z.boolean().optional(),
      }),
    )
    .default([]),
  conceptCards: z
    .array(
      z.object({
        id: z.string(),
        concept: z.string(),
        explanation: z.string(),
        example: z.string().default(""),
        examImportance: z.string().default(""),
        peruLaw: z.string().optional(),
        highlightId: z.string().optional(),
        essential: z.boolean().optional(),
      }),
    )
    .default([]),
  examMode: z
    .object({
      oral: z.array(z.string()).default([]),
      desarrollo: z.array(z.string()).default([]),
      test: z
        .array(
          z.object({
            question: z.string(),
            options: z.array(z.string()).min(1),
            answerIndex: z.number(),
            explanation: z.string().default(""),
          }),
        )
        .default([]),
      memorableConcepts: z.array(z.string()).default([]),
      commonErrors: z.array(z.string()).default([]),
    })
    .default({
      oral: [],
      desarrollo: [],
      test: [],
      memorableConcepts: [],
      commonErrors: [],
    }),
  citations: z
    .array(
      z.object({
        norm: z.string().default(""),
        article: z.string().default(""),
        text: z.string().default(""),
        updatedAt: z.string().default(""),
        sourceId: z.string().optional(),
        sourceTitle: z.string().optional(),
        page: z.string().optional(),
        author: z.string().optional(),
        fragment: z.string().optional(),
      }),
    )
    .default([]),
  comprehensionQuestion: z.string().optional(),
});

const TutorResponseSchema = z.object({
  analysis: PageAnalysisSchema.optional(),
  customReply: z.string().optional(),
  answer: z.string().optional(),
});

export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // continue to slice extraction
    }
  }

  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  throw new Error("No se encontró JSON válido en la respuesta.");
}

function isPageAnalysisShape(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && "pageFocus" in value;
}

function normalizeHighlightCategory(value: unknown): z.infer<typeof HighlightCategorySchema> {
  const str = String(value ?? "concepto").toLowerCase();
  const result = HighlightCategorySchema.safeParse(str);
  return result.success ? result.data : "concepto";
}

function coercePageAnalysis(raw: Record<string, unknown>): PageProfessorAnalysis {
  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights.map((h, i) => {
        const item = h as Record<string, unknown>;
        return {
          id: String(item.id ?? `h${i + 1}`),
          phrase: String(item.phrase ?? ""),
          category: normalizeHighlightCategory(item.category),
          essential: Boolean(item.essential),
        };
      })
    : [];

  const conceptCards = Array.isArray(raw.conceptCards)
    ? raw.conceptCards.map((c, i) => {
        const item = c as Record<string, unknown>;
        return {
          id: String(item.id ?? `cc${i + 1}`),
          concept: String(item.concept ?? "Concepto jurídico"),
          explanation: String(item.explanation ?? item.explicacion ?? ""),
          example: String(item.example ?? item.ejemplo ?? ""),
          examImportance: String(
            item.examImportance ?? item.importancia ?? item.exam_importance ?? "",
          ),
          peruLaw: item.peruLaw ? String(item.peruLaw) : undefined,
          highlightId: item.highlightId ? String(item.highlightId) : undefined,
          essential: Boolean(item.essential),
        };
      })
    : [];

  const parsed = PageAnalysisSchema.parse({
    ...raw,
    highlights,
    conceptCards,
  });

  return parsed;
}

export function parseTutorResponse(raw: string): TutorResponse {
  const json = extractJsonObject(raw);

  if (typeof json !== "object" || json === null) {
    throw new Error("Respuesta JSON inválida.");
  }

  const record = json as Record<string, unknown>;

  if (isPageAnalysisShape(record)) {
    return { analysis: coercePageAnalysis(record) };
  }

  const wrapped = TutorResponseSchema.safeParse(record);
  if (wrapped.success) {
    if (wrapped.data.analysis) {
      return {
        analysis: coercePageAnalysis(wrapped.data.analysis as Record<string, unknown>),
        customReply: wrapped.data.customReply,
      };
    }
    if (wrapped.data.customReply) {
      return { customReply: wrapped.data.customReply };
    }
    if (wrapped.data.answer) {
      return { customReply: wrapped.data.answer };
    }
  }

  const loose = json as Record<string, unknown>;
  if (typeof loose.customReply === "string") {
    return { customReply: loose.customReply };
  }

  if (typeof loose.answer === "string") {
    return { customReply: loose.answer };
  }

  throw new Error("La respuesta no contiene análisis de página.");
}

export function buildFallbackAnalysis(pageText: string, pageNumber: number): PageProfessorAnalysis {
  const excerpt = pageText.trim().slice(0, 400);
  return {
    pageFocus: excerpt
      ? `Estudia el contenido jurídico de la página ${pageNumber}.`
      : `Revisa visualmente la página ${pageNumber} del PDF.`,
    secondaryMentions: [],
    keyLearning: [],
    highlights: [],
    conceptCards: excerpt
      ? [
          {
            id: "fallback-1",
            concept: `Contenido de la página ${pageNumber}`,
            explanation: excerpt,
            example: "Relaciona este fragmento con tu curso y con un caso práctico.",
            examImportance: "Identifica definiciones y conceptos que el profesor pueda evaluar.",
            essential: true,
          },
        ]
      : [],
    examMode: {
      oral: [],
      desarrollo: [],
      test: [],
      memorableConcepts: [],
      commonErrors: [],
    },
    citations: [],
  };
}
