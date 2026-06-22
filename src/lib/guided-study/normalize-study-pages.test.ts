import { describe, expect, it } from "vitest";
import { humanizeTutorAiError } from "@/lib/ai/humanize-tutor-error";
import { TextAiProvidersFailedError } from "@/lib/ai/text-ai-providers-failed";
import {
  isSequentialStudyPages,
  normalizeStudyPages,
} from "@/lib/guided-study/normalize-study-pages";

describe("normalizeStudyPages", () => {
  it("renumera diapositivas a 1..n", () => {
    const pages = normalizeStudyPages([
      { pageNumber: 1, text: "Intro" },
      { pageNumber: 5, text: "Soberanía" },
      { pageNumber: 9, text: "   " },
      { pageNumber: 12, text: "Cierre" },
    ]);

    expect(pages).toEqual([
      { pageNumber: 1, text: "Intro" },
      { pageNumber: 2, text: "Soberanía" },
      { pageNumber: 3, text: "Cierre" },
    ]);
    expect(isSequentialStudyPages(pages)).toBe(true);
  });
});

describe("humanizeTutorAiError", () => {
  it("resume fallos de proveedores sin volcar JSON", () => {
    const error = new TextAiProvidersFailedError("Todos los proveedores de texto fallaron.", {
      providerErrors: ["gemini: 429", "openrouter: 503"],
      providersAttempted: ["gemini", "openrouter"],
      providersConfigured: {
        gemini: true,
        openrouter: true,
        xai: false,
        openai: false,
      },
    });

    const message = humanizeTutorAiError(error);
    expect(message).toContain("profesor IA");
    expect(message).not.toContain("google.rpc");
  });
});
