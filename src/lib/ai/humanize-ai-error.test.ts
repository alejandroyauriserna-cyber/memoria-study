import { describe, expect, it } from "vitest";
import { humanizeAiError, isAiCatalogBlockedError } from "@/lib/ai/humanize-ai-error";

describe("humanizeAiError", () => {
  it("replaces raw Gemini quota dumps with a short message", () => {
    const raw =
      'Todos los proveedores de texto fallaron. gemini: gemini-2.0-flash: [429 Too Many Requests] {"error":{"code":429,"message":"quota exceeded"}}';
    expect(humanizeAiError(raw)).toMatch(/catalogar/i);
    expect(humanizeAiError(raw).length).toBeLessThan(280);
    expect(isAiCatalogBlockedError(raw)).toBe(true);
  });

  it("explains RECITATION blocks without dumping provider JSON", () => {
    const raw =
      "gemini-1.5-flash: Candidate was blocked due to RECITATION | gemini-2.0-flash: [GoogleGenerativeAI Error]: 429 quota";
    const message = humanizeAiError(raw);
    expect(message).not.toContain("GoogleGenerativeAI");
    expect(message).toMatch(/manualmente/i);
  });

  it("mentions redeploy when OpenRouter is configured but not attempted", () => {
    const raw =
      "Todos los proveedores de texto fallaron. gemini: Candidate was blocked due to RECITATION | gemini: 429 quota exceeded";
    const message = humanizeAiError(raw, {
      openRouterConfigured: true,
      openRouterAttempted: false,
    });
    expect(message).toMatch(/redeploy|manualmente/i);
    expect(message).not.toMatch(/Añade OPENROUTER_API_KEY/i);
  });

  it("mentions both providers when OpenRouter was attempted", () => {
    const raw =
      "Todos los proveedores de texto fallaron. gemini: RECITATION | openrouter: 429";
    expect(
      humanizeAiError(raw, {
        openRouterConfigured: true,
        openRouterAttempted: true,
      }),
    ).toMatch(/Gemini y OpenRouter/i);
  });
});
