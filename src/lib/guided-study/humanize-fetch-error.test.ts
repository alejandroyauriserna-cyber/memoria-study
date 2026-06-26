import { describe, expect, it } from "vitest";
import { humanizeGuidedStudyFetchError } from "@/lib/guided-study/humanize-fetch-error";

describe("humanizeGuidedStudyFetchError", () => {
  it("traduce Failed to fetch", () => {
    expect(humanizeGuidedStudyFetchError(new TypeError("Failed to fetch"))).toMatch(
      /No se pudo conectar con el servidor del tutor/,
    );
  });

  it("conserva mensajes del servidor", () => {
    expect(humanizeGuidedStudyFetchError(new Error("La cuota de Gemini se agotó."))).toBe(
      "La cuota de Gemini se agotó.",
    );
  });
});
