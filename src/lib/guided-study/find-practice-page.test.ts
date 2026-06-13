import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  buildSourceFingerprint,
  findPracticePageCache,
  saveTutorCache,
} from "@/lib/guided-study/tutor-cache";
import type { PageProfessorAnalysis } from "@/types/guided-legal-study";
import type { LegalSourcesSettings } from "@/types/legal-sources";

const materialId = "test-material-practice";

const settings: LegalSourcesSettings = {
  strictMode: false,
  strictNormativeMode: true,
  sources: [],
};

const fingerprint = buildSourceFingerprint(settings);

const sampleAnalysis = (focus: string): PageProfessorAnalysis => ({
  pageFocus: focus,
  secondaryMentions: [],
  keyLearning: [{ id: "kl1", label: "Idea clave", essential: true }],
  highlights: [],
  conceptCards: [
    {
      id: "c1",
      concept: "Concepto A",
      explanation: "Explicación del concepto A para repaso.",
      example: "Ejemplo",
      examImportance: "Alta",
      essential: true,
    },
  ],
  examMode: {
    oral: [{ question: "¿Qué es A?", gradingPoints: ["Definición"], modelAnswer: "Es A." }],
    desarrollo: [],
    test: [
      {
        question: "¿Cuál es A?",
        options: ["A", "B", "C", "D"],
        answerIndex: 0,
        explanation: "Porque es A.",
      },
    ],
    memorableConcepts: [],
    commonErrors: [],
  },
  citations: [],
});

describe("findPracticePageCache", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    const localStorageMock = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
    };
    vi.stubGlobal("window", { localStorage: localStorageMock });
    vi.stubGlobal("localStorage", localStorageMock);
  });

  it("prefers the immediately previous page", () => {
    saveTutorCache(
      materialId,
      { type: "page", pageNumber: 1 },
      false,
      fingerprint,
      { analysis: sampleAnalysis("Página 1") },
    );
    saveTutorCache(
      materialId,
      { type: "page", pageNumber: 2 },
      false,
      fingerprint,
      { analysis: sampleAnalysis("Página 2") },
    );

    const hit = findPracticePageCache(materialId, 3, false, fingerprint);
    expect(hit?.pageNumber).toBe(2);
    expect(hit?.analysis.pageFocus).toBe("Página 2");
  });

  it("falls back to the nearest cached page below the current one", () => {
    saveTutorCache(
      materialId,
      { type: "page", pageNumber: 1 },
      false,
      fingerprint,
      { analysis: sampleAnalysis("Página 1") },
    );

    const hit = findPracticePageCache(materialId, 5, false, fingerprint);
    expect(hit?.pageNumber).toBe(1);
  });

  it("returns null when there is no prior cached page", () => {
    expect(findPracticePageCache(materialId, 1, false, fingerprint)).toBeNull();
  });
});
