import type { VisualMindMap } from "@/lib/organizers/visual-mind-map-types";
import type { AcademicInfographic } from "@/lib/organizers/academic-infographic-types";
import type { VisualPremiumPrompt } from "@/lib/organizers/visual-prompt-types";
import { enrichOrganizerStudySurfaces } from "@/lib/organizers/enrich-study-content";

export type OrganizerFlashcard = {
  question?: string;
  answer?: string;
  difficulty?: "basico" | "intermedio" | "avanzado";
};

export type OrganizerContent = {
  summary?: string;
  conceptMap?: {
    title?: string;
    nodes?: string[];
  };
  hierarchy?: {
    root?: string;
    branches?: string[];
  };
  timeline?: {
    events?: Array<{ date?: string; label?: string }>;
  };
  flowChart?: {
    start?: string;
    end?: string;
    steps?: string[];
  };
  flowProcess?: {
    title?: string;
    nodes?: Array<{
      id: string;
      label: string;
      group?: string;
      explanation?: string;
      legalBasis?: string;
      example?: string;
      relatedConcepts?: string[];
    }>;
    edges?: Array<{ from: string; to: string; label?: string }>;
  };
  visualSummary?: {
    conceptCards?: Array<{ title: string; description: string }>;
    comparisons?: Array<{ title: string; left: string; right: string }>;
    legalTables?: Array<{ title: string; headers: string[]; rows: string[][] }>;
  };
  reviewBundle?: {
    keyConcepts?: string[];
    questions?: Array<{
      question: string;
      answer: string;
      difficulty?: "basico" | "intermedio" | "avanzado";
      type?: "abierta" | "opcion_multiple" | "verdadero_falso" | "caso_practico";
      options?: string[];
    }>;
    examQuestions?: Array<{
      question: string;
      type: "opcion_multiple" | "verdadero_falso" | "caso_practico";
      options?: string[];
      answer: string;
      explanation?: string;
    }>;
  };
  aiAnalysis?: {
    conceptsDetected?: string[];
    relationsFound?: string[];
    difficulty?: "basico" | "intermedio" | "avanzado";
    recommendations?: string[];
    studyFocus?: string;
  };
  flashcards?: OrganizerFlashcard[];
  reviewQuestions?: string[];
  simplifiedExplanation?: string;
  visualMindMap?: VisualMindMap;
  academicInfographic?: AcademicInfographic;
  visualPremiumPrompt?: VisualPremiumPrompt;
};

export function parseOrganizerContent(content: unknown): OrganizerContent {
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return enrichOrganizerStudySurfaces(parsed as OrganizerContent);
  } catch {
    return {};
  }
}

export function hasOrganizerSections(content: OrganizerContent) {
  return Boolean(
    content.summary ||
      content.conceptMap?.nodes?.length ||
      content.conceptMap?.title ||
      content.hierarchy?.root ||
      content.hierarchy?.branches?.length ||
      content.timeline?.events?.length ||
      content.flowChart?.start ||
      content.flowChart?.end ||
      content.flowChart?.steps?.length ||
      content.flowProcess?.nodes?.length ||
      content.visualSummary?.conceptCards?.length ||
      content.visualSummary?.comparisons?.length ||
      content.visualSummary?.legalTables?.length ||
      content.reviewBundle?.keyConcepts?.length ||
      content.reviewBundle?.questions?.length ||
      content.reviewBundle?.examQuestions?.length ||
      content.flashcards?.length ||
      content.reviewQuestions?.length ||
      content.simplifiedExplanation ||
      content.aiAnalysis?.conceptsDetected?.length ||
      content.visualMindMap?.nodes?.length,
  );
}
