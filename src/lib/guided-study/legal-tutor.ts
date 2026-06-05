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
} from "@/lib/guided-study/legal-base";
import { processNormativeAnalysis } from "@/lib/guided-study/validate-citations";
import { buildLegalSourcesPromptBlock } from "@/lib/legal-sources/prompt";
import { buildNormativeIndexForUser } from "@/lib/legal-sources/server";
import { getEnabledSources } from "@/lib/legal-sources/storage";
import type { LegalSourceAttribution, LegalSourcesSettings } from "@/types/legal-sources";
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
      learningOverview: z.string().optional(),
    }),
  ),
});

import {
  buildFallbackAnalysis,
  parseTutorResponse,
} from "@/lib/guided-study/parse-tutor-response";

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

function filterEssentials(analysis: PageProfessorAnalysis): PageProfessorAnalysis {
  const filtered = {
    ...analysis,
    keyLearning: analysis.keyLearning.filter((k) => k.essential),
    highlights: analysis.highlights.filter((h) => h.essential),
    conceptCards: analysis.conceptCards.filter((c) => c.essential),
    secondaryMentions: analysis.secondaryMentions.slice(0, 2),
    pageFocus: `Lo esencial para examen: ${analysis.pageFocus}`,
  };

  if (!filtered.conceptCards.length && analysis.conceptCards.length) {
    filtered.conceptCards = analysis.conceptCards.slice(0, 2);
  }
  if (!filtered.keyLearning.length && analysis.keyLearning.length) {
    filtered.keyLearning = analysis.keyLearning.slice(0, 3);
  }

  return filtered;
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
  chapterOverview?: string;
  chapterMode?: boolean;
  sourceSettings?: LegalSourcesSettings;
  userId?: string;
}): Promise<TutorResponse> {
  const enabledSources = input.sourceSettings
    ? getEnabledSources(input.sourceSettings)
    : [];
  const strictMode = input.sourceSettings?.strictMode ?? false;
  const strictNormativeMode = input.sourceSettings?.strictNormativeMode !== false;
  const sourcesBlock = buildLegalSourcesPromptBlock(enabledSources, strictMode);
  const normativeIndex = await buildNormativeIndexForUser(input.userId, input.sourceSettings);

  const relevantArticles = searchLegalBase(
    `${input.pageText} ${input.chapterTitle ?? ""} ${input.chapterOverview ?? ""} ${input.customPrompt ?? ""}`,
    12,
    normativeIndex,
  );
  const indexedNormativeBlock = formatLegalBaseForPrompt(relevantArticles);
  const structured = usesStructuredResponse(input.action) || input.action === "custom";
  const teachingActions: GuidedStudyTutorAction[] = [
    "analyze_page",
    "explain_page",
    "explain_chapter",
    "first_cycle",
  ];
  const temperature = input.action === "exam_mode" ? 0.45 : teachingActions.includes(input.action) ? 0.38 : 0.32;

  const raw = await generateGeminiText({
    prompt: `${GUIDED_STUDY_SYSTEM_ROLE}\n\n${buildTutorUserPrompt({
      ...input,
      legalBaseBlock: indexedNormativeBlock,
      sourcesBlock: sourcesBlock || undefined,
      strictNormativeMode,
      structured,
    })}`,
    temperature,
    json: true,
  });

  const activeSources: LegalSourceAttribution[] = enabledSources.map((s) => ({
    sourceId: s.id,
    title: s.title,
    category: s.category,
  }));

  try {
    const parsed = parseTutorResponse(raw);

    if (parsed.customReply && !parsed.analysis) {
      return { customReply: parsed.customReply, activeSources };
    }

    if (parsed.analysis) {
      let analysis: PageProfessorAnalysis = processNormativeAnalysis(
        parsed.analysis,
        input.pageText,
        { strictNormativeMode, normativeIndex },
      );

      if (!analysis.conceptCards.length && analysis.pageFocus) {
        analysis = {
          ...analysis,
          conceptCards: [
            {
              id: "auto-1",
              concept: "Idea central de la página",
              explanation: analysis.pageFocus,
              example: "Consulta el PDF y relaciona con tu curso.",
              examImportance: "Comprende los conceptos antes de avanzar.",
              essential: true,
            },
          ],
        };
      }

      if (input.action === "exam_essentials") {
        analysis = filterEssentials(analysis);
      }

      return {
        analysis,
        customReply: parsed.customReply,
        activeSources,
      };
    }
  } catch (error) {
    console.error("[guided-study/tutor] parse error:", error, raw.slice(0, 500));
  }

  if (strictMode && !input.pageText.trim()) {
    return {
      customReply: "No encontré esta información dentro de las fuentes autorizadas por el usuario.",
      activeSources,
    };
  }

  return {
    analysis: buildFallbackAnalysis(input.pageText, input.pageNumber),
    customReply: input.pageText.trim()
      ? undefined
      : "No se pudo extraer texto de esta página. Revisa el PDF visualmente mientras el profesor te guía.",
    activeSources,
  };
}

export function findChapterForPage(
  index: DocumentStudyIndex,
  pageNumber: number,
): DocumentStudyIndex["chapters"][number] | undefined {
  return index.chapters.find(
    (ch) => pageNumber >= ch.startPage && pageNumber <= ch.endPage,
  );
}


export function filterAnalysisForExamMode(
  analysis: PageProfessorAnalysis,
  examOnly: boolean,
): PageProfessorAnalysis {
  if (!examOnly) return analysis;
  return filterEssentials(analysis);
}
