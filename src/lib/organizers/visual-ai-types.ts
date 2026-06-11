import type { ImageGenerationSource } from "@/lib/ai/image-generation-types";

export const VISUAL_AI_FORMAT_IDS = [
  "infographic",
  "mindMap",
  "conceptMap",
  "comparisonTable",
  "timeline",
  "legalAtlas",
  "academicPoster",
  "presentation",
] as const;

export type VisualAiFormatId = (typeof VISUAL_AI_FORMAT_IDS)[number];

export type InteractiveDiagramLayoutState = {
  positions: Record<string, { x: number; y: number }>;
  collapsedGroups: string[];
  updatedAt: string;
};

export type VisualAiOutput = {
  formatId: VisualAiFormatId;
  centralTopic: string;
  subtopics: string[];
  imageUrl: string;
  prompt: string;
  generatedAt: string;
  source: ImageGenerationSource;
  warning?: string;
  model?: string;
  interactiveLayout?: InteractiveDiagramLayoutState;
};

export type VisualAiOutputsCache = Partial<Record<VisualAiFormatId, VisualAiOutput>>;
