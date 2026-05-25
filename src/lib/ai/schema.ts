import { z } from "zod";

const definitionCardSchema = z.object({
  id: z.string(),
  term: z.string(),
  definition: z.string(),
  hint: z.string(),
});

const matchingPairSchema = z.object({
  id: z.string(),
  left: z.string(),
  right: z.string(),
});

export const studyDeckSchema = z.object({
  title: z.string(),
  sourceName: z.string(),
  summary: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimatedMinutes: z.number(),
  flashcards: z.array(
    z.object({
      id: z.string(),
      front: z.string(),
      back: z.string(),
      hint: z.string(),
      tags: z.array(z.string()),
    }),
  ),
  fillBlanks: z.array(
    z.object({
      id: z.string(),
      sentence: z.string(),
      answer: z.string(),
      explanation: z.string(),
    }),
  ),
  quiz: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()).length(4),
      answerIndex: z.number(),
      explanation: z.string(),
    }),
  ),
  definitionCards: z.array(definitionCardSchema).default([]),
  matchingPairs: z.array(matchingPairSchema).default([]),
});

export type StudyDeckOutput = z.infer<typeof studyDeckSchema>;

export function enrichStudyDeck(deck: StudyDeckOutput): StudyDeckOutput {
  const definitionCards =
    deck.definitionCards.length > 0
      ? deck.definitionCards
      : deck.flashcards.slice(0, 8).map((card) => ({
          id: `def_${card.id}`,
          term: card.front,
          definition: card.back,
          hint: card.hint,
        }));

  const matchingPairs =
    deck.matchingPairs.length > 0
      ? deck.matchingPairs
      : definitionCards.slice(0, 8).map((card) => ({
          id: `pair_${card.id}`,
          left: card.term,
          right: card.definition,
        }));

  return {
    ...deck,
    definitionCards,
    matchingPairs,
  };
}
