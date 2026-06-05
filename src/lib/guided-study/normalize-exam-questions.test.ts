import { describe, expect, it } from "vitest";
import { normalizeExamStructuredQuestion } from "@/lib/guided-study/normalize-exam-questions";

describe("normalizeExamStructuredQuestion", () => {
  it("wraps legacy string questions", () => {
    const result = normalizeExamStructuredQuestion("¿Qué es el contrato?");
    expect(result.question).toBe("¿Qué es el contrato?");
    expect(result.gradingPoints).toEqual([]);
  });

  it("parses structured objects", () => {
    const result = normalizeExamStructuredQuestion({
      question: "Define la obligación",
      gradingPoints: ["sujeto", "objeto", "vínculo"],
      modelAnswer: "La obligación es...",
    });
    expect(result.gradingPoints).toHaveLength(3);
    expect(result.modelAnswer).toContain("obligación");
  });
});
