import { z } from "zod";
import { generateGeminiText } from "@/lib/ai/gemini-text";
import {
  GUIDED_STUDY_SYSTEM_ROLE,
  buildAnalyzeDocumentPrompt,
  buildTutorUserPrompt,
} from "@/lib/guided-study/prompts";
import {
  formatLegalBaseForPrompt,
  searchLegalBase,
  toLegalCitation,
} from "@/lib/guided-study/legal-base";
import type {
  DocumentStudyIndex,
  GuidedStudyTutorAction,
  PageProfessorAnalysis,
  TutorResponse,
} from "@/types/guided-legal-study";
import type { PdfPageContent } from "@/types/guided-legal-study";

const DocumentIndexSchema = z.object({
  title: z.string(),
  totalPages: z.number(),
  summary: z.string(),
  topics: z.array(z.string()),
  chapters: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      startPage: z.number(),
      endPage: z.number(),
      subtopics: z.array(z.string()).optional(),
    }),
  ),
});

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

const PageAnalysisSchema = z.object({
  pageFocus: z.string(),
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
        example: z.string(),
        examImportance: z.string(),
        peruLaw: z.string().optional(),
        highlightId: z.string().optional(),
        essential: z.boolean().optional(),
      }),
    )
    .default([]),
  examMode: z.object({
    oral: z.array(z.string()).default([]),
    desarrollo: z.array(z.string()).default([]),
    test: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()),
          answerIndex: z.number(),
          explanation: z.string(),
        }),
      )
      .default([]),
    memorableConcepts: z.array(z.string()).default([]),
    commonErrors: z.array(z.string()).default([]),
  }),
  citations: z
    .array(
      z.object({
        norm: z.string(),
        article: z.string(),
        text: z.string(),
        updatedAt: z.string(),
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

function samplePagesForAnalysis(pages: PdfPageContent[], totalPages: number) {
  const indices = new Set<number>([1, 2, 3, Math.ceil(totalPages / 2), totalPages - 1, totalPages]);

  return [...indices]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b)
    .map((n) => pages.find((p) => p.pageNumber === n) ?? { pageNumber: n, text: "" })
    .filter((p) => p.text.length > 0)
    .slice(0, 8);
}

function fallbackIndex(title: string, totalPages: number): DocumentStudyIndex {
  const chunkSize = Math.max(5, Math.ceil(totalPages / 6));
  const chapters = [];
  let id = 1;

  for (let start = 1; start <= totalPages; start += chunkSize) {
    chapters.push({
      id: `ch${id}`,
      title: `Bloque ${id}`,
      startPage: start,
      endPage: Math.min(start + chunkSize - 1, totalPages),
      subtopics: [],
    });
    id++;
  }

  return {
    title,
    totalPages,
    summary: "Documento jurídico para estudio progresivo.",
    topics: ["Contenido jurídico"],
    chapters,
  };
}

function validateCitations(
  citations: PageProfessorAnalysis["citations"],
  relevantArticles: ReturnType<typeof searchLegalBase>,
) {
  const validated = citations.filter((c) =>
    relevantArticles.some((a) => a.norm === c.norm && a.article === c.article),
  );
  if (validated.length) return validated;
  return relevantArticles.slice(0, 3).map(toLegalCitation);
}

function filterEssentials(analysis: PageProfessorAnalysis): PageProfessorAnalysis {
  return {
    ...analysis,
    keyLearning: analysis.keyLearning.filter((k) => k.essential),
    highlights: analysis.highlights.filter((h) => h.essential),
    conceptCards: analysis.conceptCards.filter((c) => c.essential),
    secondaryMentions: analysis.secondaryMentions.slice(0, 2),
    pageFocus: `Lo esencial para examen: ${analysis.pageFocus}`,
  };
}

export async function analyzeDocumentForStudy(input: {
  title: string;
  pages: PdfPageContent[];
}): Promise<DocumentStudyIndex> {
  const totalPages = input.pages.length || 1;
  const samplePages = samplePagesForAnalysis(input.pages, totalPages);

  if (!samplePages.length) {
    return fallbackIndex(input.title, totalPages);
  }

  try {
    const raw = await generateGeminiText({
      prompt: `${GUIDED_STUDY_SYSTEM_ROLE}\n\n${buildAnalyzeDocumentPrompt({
        title: input.title,
        totalPages,
        samplePages,
      })}`,
      temperature: 0.2,
      json: true,
    });

    const parsed = DocumentIndexSchema.parse(JSON.parse(raw));
    return { ...parsed, totalPages, title: parsed.title || input.title };
  } catch {
    return fallbackIndex(input.title, totalPages);
  }
}

function usesStructuredResponse(action: GuidedStudyTutorAction): boolean {
  return action !== "custom";
}

export async function askLegalStudyTutor(input: {
  action: GuidedStudyTutorAction;
  customPrompt?: string;
  pageNumber: number;
  totalPages: number;
  pageText: string;
  documentTitle: string;
  courseName?: string;
  chapterTitle?: string;
}): Promise<TutorResponse> {
  const relevantArticles = searchLegalBase(
    `${input.pageText} ${input.chapterTitle ?? ""} ${input.customPrompt ?? ""}`,
    8,
  );
  const legalBaseBlock = formatLegalBaseForPrompt(relevantArticles);
  const structured = usesStructuredResponse(input.action) || input.action === "custom";

  const raw = await generateGeminiText({
    prompt: `${GUIDED_STUDY_SYSTEM_ROLE}\n\n${buildTutorUserPrompt({
      ...input,
      legalBaseBlock,
      structured,
    })}`,
    temperature: input.action === "exam_mode" ? 0.45 : 0.3,
    json: true,
  });

  try {
    const parsed = TutorResponseSchema.parse(JSON.parse(raw));

    if (parsed.customReply && !parsed.analysis) {
      return { customReply: parsed.customReply };
    }

    if (parsed.analysis) {
      let analysis: PageProfessorAnalysis = {
        ...parsed.analysis,
        citations: validateCitations(parsed.analysis.citations, relevantArticles),
      };

      if (input.action === "exam_essentials") {
        analysis = filterEssentials(analysis);
      }

      return {
        analysis,
        customReply: parsed.customReply,
      };
    }
  } catch {
    // fallback below
  }

  return {
    answer: raw,
    customReply: "No se pudo estructurar la respuesta. Intenta de nuevo.",
  };
}

export function findChapterForPage(
  index: DocumentStudyIndex,
  pageNumber: number,
): string | undefined {
  return index.chapters.find(
    (ch) => pageNumber >= ch.startPage && pageNumber <= ch.endPage,
  )?.title;
}

export function filterAnalysisForExamMode(
  analysis: PageProfessorAnalysis,
  examOnly: boolean,
): PageProfessorAnalysis {
  if (!examOnly) return analysis;
  return filterEssentials(analysis);
}
