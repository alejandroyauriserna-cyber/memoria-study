export type VisualPromptMode =
  | "infographic"
  | "memorization"
  | "exam"
  | "legal_premium"
  | "jurisprudence";

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

export type VisualPremiumPrompt = {
  title: string;
  mode: VisualPromptMode;
  prompt: string;
  analysis?: DocumentVisualAnalysis;
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
];

export const GEMINI_APP_URL = "https://gemini.google.com/app";
