import { z } from "zod";

export const studyDeckSchema = z.object({
  title: z.string().min(10).max(120),

  sourceName: z.string().min(1),

  summary: z.string().min(120).max(2500),

  difficulty: z.enum(["easy", "medium", "hard"]),

  estimatedMinutes: z.number().int().min(10).max(240),

  flashcards: z.array(
    z.object({
      id: z.string(),

      front: z.string()
        .min(20)
        .max(500),

      back: z.string()
        .min(35)
        .max(1500),

      hint: z.string()
        .min(5)
        .max(300),

      tags: z.array(
        z.string().min(2).max(40),
      ).min(1).max(6),
    }),
  ).min(8).max(25),

  fillBlanks: z.array(
    z.object({
      id: z.string(),

      sentence: z.string()
        .min(35)
        .max(1000),

      answer: z.string()
        .min(2)
        .max(120),

      explanation: z.string()
        .min(25)
        .max(1000),
    }),
  ).min(6).max(20),

  quiz: z.array(
    z.object({
      id: z.string(),

      question: z.string()
        .min(20)
        .max(1200),

      options: z.array(
        z.string()
          .min(5)
          .max(300),
      ).length(4),

      answerIndex: z.number().int().min(0).max(3),

      explanation: z.string()
        .min(35)
        .max(1500),
    }),
  ).min(8).max(25),
});

export type StudyDeckOutput = z.infer<typeof studyDeckSchema>;