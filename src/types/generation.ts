export type StudyGenerationCounts = {
  flashcards: number;
  fillBlanks: number;
  quiz: number;
  definitionCards: number;
  matchingPairs: number;
};

export const DEFAULT_GENERATION_COUNTS: StudyGenerationCounts = {
  flashcards: 8,
  fillBlanks: 5,
  quiz: 6,
  definitionCards: 8,
  matchingPairs: 8,
};

export const GENERATION_LIMITS = {
  min: 0,
  max: 25,
} as const;
