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

export type VisualCreativityLevel = "conservative" | "balanced" | "creative" | "extreme";

export type VisualPremiumPrompt = {
  title: string;
  mode: VisualPromptMode;
  /** Prompt generado por IA a partir del PDF, modo y rúbrica */
  basePrompt: string;
  /** Instrucciones opcionales del estudiante */
  studentPersonalization?: string;
  creativityLevel?: VisualCreativityLevel;
  /** Prompt final listo para Gemini (base + creatividad + personalización) */
  prompt: string;
  analysis?: DocumentVisualAnalysis;
  rubricAnalysis?: RubricAnalysis;
  explanation: string[];
  hasRubric: boolean;
  generatedAt: string;
};

export const VISUAL_IMAGE_FEATURE_NAME = "Crear Imagen Educativa IA";

export const VISUAL_PROMPT_MODES: Array<{
  id: VisualPromptMode;
  label: string;
  emoji: string;
  description: string;
  expectedResult: string;
}> = [
  {
    id: "infographic",
    label: "Infografía",
    emoji: "🎨",
    description: "Enciclopedia visual premium, colorida y de alta densidad informativa.",
    expectedResult: "Infografía educativa colorida.",
  },
  {
    id: "memorization",
    label: "Memorización",
    emoji: "🧠",
    description: "Metáforas visuales exageradas e imágenes imposibles de olvidar.",
    expectedResult: "Mapa visual para memorizar.",
  },
  {
    id: "exam",
    label: "Examen",
    emoji: "🎓",
    description: "Lámina de repaso: definiciones, artículos y excepciones sin decoración.",
    expectedResult: "Lámina de repaso para examen.",
  },
  {
    id: "legal_premium",
    label: "Jurídico Premium",
    emoji: "⚖️",
    description: "Manual jurídico formal con tribunales, expedientes y códigos.",
    expectedResult: "Representación jurídica profesional.",
  },
  {
    id: "jurisprudence",
    label: "Jurisprudencia",
    emoji: "🏛️",
    description: "Línea de tiempo con precedentes, sentencias y evolución doctrinal.",
    expectedResult: "Mapa jurisprudencial.",
  },
  {
    id: "professor",
    label: "Profesor",
    emoji: "👨‍🏫",
    description: "Adaptado a la rúbrica: criterios, puntajes y formato del docente.",
    expectedResult: "Trabajo alineado a la rúbrica.",
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
