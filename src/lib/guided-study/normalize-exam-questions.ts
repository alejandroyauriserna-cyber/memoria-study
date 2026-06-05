import type { ExamStructuredQuestion } from "@/types/guided-legal-study";

export function normalizeExamStructuredQuestion(item: unknown): ExamStructuredQuestion {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return { question: trimmed, gradingPoints: [], modelAnswer: undefined };
  }

  if (typeof item !== "object" || item === null) {
    return { question: "", gradingPoints: [], modelAnswer: undefined };
  }

  const record = item as Record<string, unknown>;
  const gradingRaw = record.gradingPoints ?? record.grading_points ?? record.puntos;
  const gradingPoints = Array.isArray(gradingRaw)
    ? gradingRaw.map((p) => String(p).trim()).filter(Boolean)
    : [];

  const modelRaw = record.modelAnswer ?? record.model_answer ?? record.respuesta;
  const modelAnswer =
    typeof modelRaw === "string" && modelRaw.trim() ? modelRaw.trim() : undefined;

  return {
    question: String(record.question ?? record.pregunta ?? "").trim(),
    gradingPoints,
    modelAnswer,
  };
}

export function normalizeExamStructuredList(items: unknown): ExamStructuredQuestion[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeExamStructuredQuestion).filter((q) => q.question.length > 0);
}
