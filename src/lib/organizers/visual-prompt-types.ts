export type VisualPromptMode =
  | "infographic"
  | "memorization"
  | "exam"
  | "legal_premium"
  | "jurisprudence"
  | "professor";

export type DocumentVisualAnalysis = {
  centralTopic: string;
  subtopics: string[];
  concepts: string[];
  definitions: string[];
  principles: string[];
  norms: string[];
  articles: string[];
  jurisprudence: string[];
  authors: string[];
  doctrine: string[];
  comparisons: string[];
  exceptions: string[];
  practicalCases: string[];
  conceptualRelations: string[];
  examPriorities: string[];
  visualScenes: Array<{ concept: string; visualMetaphor: string }>;
};

export type RubricAnalysis = {
  fileName?: string;
  requestedFormat?: string;
  evaluationCriteria: string[];
  scoringLevels: string[];
  visualRequirements: string[];
  structureRequirements: string[];
  conceptCountHint?: string;
  depthRequired?: string;
  creativityRequired: boolean;
  examplesRequired: boolean;
  imagesRequired: boolean;
  hierarchyRequired: boolean;
  clarityRequired: boolean;
  comparisonsRequired: boolean;
};

export type VisualPremiumPrompt = {
  title: string;
  mode: VisualPromptMode;
  prompt: string;
  analysis?: DocumentVisualAnalysis;
  rubricAnalysis?: RubricAnalysis;
  explanation: string[];
  hasRubric: boolean;
  generatedAt: string;
};

export const VISUAL_PROMPT_MODES: Array<{
  id: VisualPromptMode;
  label: string;
  emoji: string;
  description: string;
}> = [
  {
    id: "infographic",
    label: "Infografía",
    emoji: "🎨",
    description: "Enciclopedia visual premium, colorida y de alta densidad informativa.",
  },
  {
    id: "memorization",
    label: "Memorización",
    emoji: "🧠",
    description: "Metáforas visuales, asociaciones memorables y colores intensos.",
  },
  {
    id: "exam",
    label: "Examen",
    emoji: "🎓",
    description: "Prioriza lo más preguntable: definiciones, artículos y excepciones.",
  },
  {
    id: "legal_premium",
    label: "Jurídico Premium",
    emoji: "⚖️",
    description: "Diseño formal con tribunales, expedientes y códigos.",
  },
  {
    id: "jurisprudence",
    label: "Jurisprudencia",
    emoji: "🏛️",
    description: "Casos, precedentes, sentencias y líneas jurisprudenciales.",
  },
  {
    id: "professor",
    label: "Profesor",
    emoji: "📚",
    description: "Alineado a la rúbrica del docente: formato, criterios y puntajes.",
  },
];

export const RUBRIC_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/jpg";

export const GEMINI_APP_URL = "https://gemini.google.com/app";

const RUBRIC_MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function rubricMimeForFile(fileName: string, declared?: string) {
  if (declared && declared !== "application/octet-stream") return declared;
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  return RUBRIC_MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function isSupportedRubricFile(file: File) {
  const mime = rubricMimeForFile(file.name, file.type);
  return (
    mime === "application/pdf" ||
    mime.startsWith("image/") ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  );
}
