import { z } from "zod";

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
});

export type StudyDeckOutput = z.infer<typeof studyDeckSchema>;