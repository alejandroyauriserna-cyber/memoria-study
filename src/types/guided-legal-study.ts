import type { LegalSourceAttribution } from "@/types/legal-sources";

export type GuidedStudyTutorAction =
  | "analyze_page"
  | "exam_essentials"
  | "exam_mode"
  | "explain_page"
  | "explain_chapter"
  | "examples"
  | "peru_law"
  | "detect_concepts"
  | "exam_questions"
  | "verify_comprehension"
  | "simpler"
  | "first_cycle"
  | "another_example"
  | "real_case"
  | "jurisprudence"
  | "civil_code"
  | "custom";

export type HighlightCategory =
  | "concepto"
  | "definicion"
  | "teoria"
  | "principio"
  | "clasificacion"
  | "excepcion"
  | "examen"
  | "norma";

export type LegalConceptType =
  | "definicion"
  | "principio"
  | "requisito"
  | "elemento"
  | "excepcion"
  | "clasificacion"
  | "teoria";

export type TextHighlight = {
  id: string;
  phrase: string;
  category: HighlightCategory;
  essential?: boolean;
};

export type KeyLearningItem = {
  id: string;
  label: string;
  highlightId?: string;
  essential?: boolean;
};

export type SecondaryMention = {
  mention: string;
  briefNote: string;
};

export type ProfessorConceptCard = {
  id: string;
  concept: string;
  explanation: string;
  example: string;
  examImportance: string;
  peruLaw?: string;
  highlightId?: string;
  essential?: boolean;
};

export type DetectedLegalConcept = {
  id: string;
  term: string;
  type: LegalConceptType;
  summary: string;
  essential?: boolean;
};

export type DocumentChapter = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  subtopics?: string[];
  learningOverview?: string;
};

export type DocumentStudyIndex = {
  title: string;
  totalPages: number;
  summary: string;
  topics: string[];
  chapters: DocumentChapter[];
};

export type ExamTestQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type ExamStructuredQuestion = {
  question: string;
  gradingPoints: string[];
  modelAnswer?: string;
};

export type ExamQuestionSet = {
  oral: ExamStructuredQuestion[];
  desarrollo: ExamStructuredQuestion[];
  test: ExamTestQuestion[];
};

export type ExamModeContent = {
  oral: ExamStructuredQuestion[];
  desarrollo: ExamStructuredQuestion[];
  test: ExamTestQuestion[];
  memorableConcepts: string[];
  commonErrors: string[];
};

export type LegalCitation = {
  norm: string;
  article: string;
  text: string;
  updatedAt: string;
  sourceId?: string;
  sourceTitle?: string;
  page?: string;
  author?: string;
  fragment?: string;
  /** Solo artículos validados contra la base jurídica indexada. */
  confidence?: "verified" | "conceptual";
  legalBaseId?: string;
};

export type ConceptualNormLink = {
  label: string;
  note: string;
  confidence: "conceptual";
};

export type PageProfessorAnalysis = {
  pageFocus: string;
  secondaryMentions: SecondaryMention[];
  keyLearning: KeyLearningItem[];
  highlights: TextHighlight[];
  conceptCards: ProfessorConceptCard[];
  examMode: ExamModeContent;
  citations: LegalCitation[];
  detectedConcepts?: DetectedLegalConcept[];
  conceptualNormLinks?: ConceptualNormLink[];
  normativeNotice?: string;
  comprehensionQuestion?: string;
};

export type TutorResponse = {
  analysis?: PageProfessorAnalysis;
  customReply?: string;
  activeSources?: LegalSourceAttribution[];
  /** @deprecated — solo fallback si falla el JSON */
  answer?: string;
};

export type TutorChatMessage = {
  id: string;
  question: string;
  answer: string;
  questionHash: string;
  createdAt: string;
  fromCache?: boolean;
};

export type GuidedStudySession = {
  materialId: string;
  currentPage: number;
  understoodPages: number[];
  analysisVersion?: number;
  lastUpdated: string;
};

export type PdfPageContent = {
  pageNumber: number;
  text: string;
};

export const HIGHLIGHT_COLORS: Record<
  HighlightCategory,
  { bg: string; border: string; label: string; text: string }
> = {
  concepto: {
    bg: "rgba(0,255,213,0.18)",
    border: "rgba(0,255,213,0.45)",
    label: "Concepto",
    text: "#00FFD5",
  },
  definicion: {
    bg: "rgba(255,214,0,0.18)",
    border: "rgba(255,214,0,0.45)",
    label: "Definición",
    text: "#FFD600",
  },
  teoria: {
    bg: "rgba(168,85,247,0.18)",
    border: "rgba(168,85,247,0.45)",
    label: "Teoría",
    text: "#C084FC",
  },
  principio: {
    bg: "rgba(0,255,213,0.12)",
    border: "rgba(0,255,213,0.35)",
    label: "Principio",
    text: "#5EEAD4",
  },
  clasificacion: {
    bg: "rgba(59,130,246,0.15)",
    border: "rgba(59,130,246,0.4)",
    label: "Clasificación",
    text: "#93C5FD",
  },
  excepcion: {
    bg: "rgba(251,146,60,0.15)",
    border: "rgba(251,146,60,0.4)",
    label: "Excepción",
    text: "#FDBA74",
  },
  examen: {
    bg: "rgba(248,113,113,0.15)",
    border: "rgba(248,113,113,0.4)",
    label: "Posible examen",
    text: "#FCA5A5",
  },
  norma: {
    bg: "rgba(74,222,128,0.15)",
    border: "rgba(74,222,128,0.4)",
    label: "Norma",
    text: "#86EFAC",
  },
};
