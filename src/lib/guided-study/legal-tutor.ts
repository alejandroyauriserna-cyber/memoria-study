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

const TutorResponseSchema = z.object({
  answer: z.string(),
  citations: z
    .array(
      z.object({
        norm: z.string(),
        article: z.string(),
        text: z.string(),
        updatedAt: z.string(),
      }),
    )
    .optional(),
  concepts: z
    .array(
      z.object({
        id: z.string(),
        term: z.string(),
        type: z.enum([
          "definicion",
          "principio",
          "requisito",
          "elemento",
          "excepcion",
          "clasificacion",
        ]),
        summary: z.string(),
      }),
    )
    .optional(),
  questions: z
    .object({
      oral: z.array(z.string()),
      desarrollo: z.array(z.string()),
      test: z.array(
        z.object({
          question: z.string(),
          options: z.array(z.string()),
          answerIndex: z.number(),
          explanation: z.string(),
        }),
      ),
    })
    .optional(),
  comprehensionCheck: z.string().optional(),
});

function samplePagesForAnalysis(pages: PdfPageContent[], totalPages: number) {
  const indices = new Set<number>();

  indices.add(1);
  if (totalPages > 1) indices.add(2);
  if (totalPages > 2) indices.add(3);
  indices.add(Math.ceil(totalPages / 2));
  indices.add(Math.max(1, totalPages - 1));
  indices.add(totalPages);

  return [...indices]
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
    const end = Math.min(start + chunkSize - 1, totalPages);
    chapters.push({
      id: `ch${id}`,
      title: `Bloque ${id} (págs. ${start}-${end})`,
      startPage: start,
      endPage: end,
      subtopics: [],
    });
    id++;
  }

  return {
    title,
    totalPages,
    summary: "Documento jurídico para estudio progresivo página por página.",
    topics: ["Contenido del documento"],
    chapters,
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

  const prompt = buildAnalyzeDocumentPrompt({
    title: input.title,
    totalPages,
    samplePages,
  });

  try {
    const raw = await generateGeminiText({
      prompt: `${GUIDED_STUDY_SYSTEM_ROLE}\n\n${prompt}`,
      temperature: 0.2,
      json: true,
    });

    const parsed = DocumentIndexSchema.parse(JSON.parse(raw));
    return {
      ...parsed,
      totalPages,
      title: parsed.title || input.title,
    };
  } catch {
    return fallbackIndex(input.title, totalPages);
  }
}

function needsJsonResponse(action: GuidedStudyTutorAction): boolean {
  return action === "detect_concepts" || action === "exam_questions";
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
  const jsonMode = needsJsonResponse(input.action);

  const userPrompt = buildTutorUserPrompt({
    ...input,
    legalBaseBlock,
    jsonMode,
  });

  const raw = await generateGeminiText({
    prompt: `${GUIDED_STUDY_SYSTEM_ROLE}\n\n${userPrompt}`,
    temperature: input.action === "exam_questions" ? 0.45 : 0.35,
    json: jsonMode,
  });

  if (jsonMode) {
    try {
      const parsed = TutorResponseSchema.parse(JSON.parse(raw));
      const validatedCitations =
        parsed.citations?.filter((c) =>
          relevantArticles.some(
            (a) => a.norm === c.norm && a.article === c.article,
          ),
        ) ?? relevantArticles.slice(0, 3).map(toLegalCitation);

      return {
        ...parsed,
        citations: validatedCitations.length ? validatedCitations : undefined,
      };
    } catch {
      return { answer: raw };
    }
  }

  const citations =
    input.action === "peru_law" ||
    input.action === "civil_code" ||
    input.action === "jurisprudence"
      ? relevantArticles.slice(0, 4).map(toLegalCitation)
      : undefined;

  return { answer: raw, citations };
}

export function findChapterForPage(
  index: DocumentStudyIndex,
  pageNumber: number,
): string | undefined {
  const chapter = index.chapters.find(
    (ch) => pageNumber >= ch.startPage && pageNumber <= ch.endPage,
  );
  return chapter?.title;
}
