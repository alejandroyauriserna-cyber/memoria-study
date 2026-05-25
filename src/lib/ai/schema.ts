import { z } from "zod";

export const studyDeckSchema = z.object({
  title: z.string().min(3).max(90),
  sourceName: z.string().min(1),
  summary: z.string().min(80).max(1200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  estimatedMinutes: z.number().int().min(5).max(120),
  flashcards: z.array(
    z.object({
      id: z.string(),
      front: z.string().min(5),
      back: z.string().min(5),
      hint: z.string().min(3),
      tags: z.array(z.string()).min(1).max(4),
    }),
  ).min(6).max(14),
  fillBlanks: z.array(
    z.object({
      id: z.string(),
      sentence: z.string().min(20),
      answer: z.string().min(2),
      explanation: z.string().min(10),
    }),
  ).min(4).max(10),
  quiz: z.array(
    z.object({
      id: z.string(),
      question: z.string().min(10),
      options: z.array(z.string()).length(4),
      answerIndex: z.number().int().min(0).max(3),
      explanation: z.string().min(10),
    }),
  ).min(5).max(12),
});

export type StudyDeckOutput = z.infer<typeof studyDeckSchema>;
