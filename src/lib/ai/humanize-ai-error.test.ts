import { describe, expect, it } from "vitest";
import { humanizeAiError, isAiCatalogBlockedError } from "@/lib/ai/humanize-ai-error";

describe("humanizeAiError", () => {
  it("replaces raw Gemini quota dumps with a short message", () => {
    const raw =
      'Todos los proveedores de texto fallaron. gemini: gemini-2.0-flash: [429 Too Many Requests] {"error":{"code":429,"message":"quota exceeded"}}';
    expect(humanizeAiError(raw)).toMatch(/cuota gratuita de Gemini/i);
    expect(isAiCatalogBlockedError(raw)).toBe(true);
  });

  it("explains RECITATION blocks", () => {
    const raw = "gemini-2.5-flash: Candidate was blocked due to RECITATION";
    expect(humanizeAiError(raw)).toMatch(/RECITATION/i);
    expect(isAiCatalogBlockedError(raw)).toBe(true);
  });
});
