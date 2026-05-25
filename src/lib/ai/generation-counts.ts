import { z } from "zod";
import {
  DEFAULT_GENERATION_COUNTS,
  GENERATION_LIMITS,
  type StudyGenerationCounts,
} from "@/types/generation";

const countSchema = z.coerce
  .number()
  .int()
  .min(GENERATION_LIMITS.min)
  .max(GENERATION_LIMITS.max);

export const studyGenerationCountsSchema = z.object({
  flashcards: countSchema,
  fillBlanks: countSchema,
  quiz: countSchema,
  definitionCards: countSchema,
  matchingPairs: countSchema,
});

export function parseGenerationCounts(raw: unknown): StudyGenerationCounts {
  const parsed = studyGenerationCountsSchema.safeParse(raw);
  if (!parsed.success) {
    return DEFAULT_GENERATION_COUNTS;
  }

  const total = Object.values(parsed.data).reduce((sum, value) => sum + value, 0);
  if (total === 0) {
    return DEFAULT_GENERATION_COUNTS;
  }

  return parsed.data;
}

export function trimDeckToCounts<
  T extends {
    flashcards: { id: string }[];
    fillBlanks: { id: string }[];
    quiz: { id: string }[];
    definitionCards: { id: string }[];
    matchingPairs: { id: string }[];
  },
>(deck: T, counts: StudyGenerationCounts) {
  return {
    ...deck,
    flashcards: deck.flashcards.slice(0, counts.flashcards),
    fillBlanks: deck.fillBlanks.slice(0, counts.fillBlanks),
    quiz: deck.quiz.slice(0, counts.quiz),
    definitionCards: deck.definitionCards.slice(0, counts.definitionCards),
    matchingPairs: deck.matchingPairs.slice(0, counts.matchingPairs),
  };
}
