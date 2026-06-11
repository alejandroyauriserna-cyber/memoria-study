import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";

/** Diagramas precisos desde datos del organizador — sin FLUX. */
export const STRUCTURED_VISUAL_AI_FORMATS: VisualAiFormatId[] = [
  "mindMap",
  "conceptMap",
  "timeline",
  "comparisonTable",
];

/** Ilustración editorial — FLUX / Gemini. */
export const FLUX_VISUAL_AI_FORMATS: VisualAiFormatId[] = [
  "infographic",
  "legalAtlas",
  "academicPoster",
  "presentation",
];

export function isStructuredVisualAiFormat(formatId: VisualAiFormatId): boolean {
  return STRUCTURED_VISUAL_AI_FORMATS.includes(formatId);
}

export function isFluxVisualAiFormat(formatId: VisualAiFormatId): boolean {
  return FLUX_VISUAL_AI_FORMATS.includes(formatId);
}
