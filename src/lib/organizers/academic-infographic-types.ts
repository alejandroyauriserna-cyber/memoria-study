import type { ImageGenerationSource } from "@/lib/ai/image-generation-types";

export type AcademicInfographic = {
  centralTopic: string;
  subtopics: string[];
  imageUrl: string;
  prompt: string;
  generatedAt: string;
  source: ImageGenerationSource;
  warning?: string;
  model?: string;
};
