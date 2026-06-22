import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { parseJsonText } from "@/lib/ai/parse-json-text";
import { getOpenRouterModelCandidates } from "@/lib/ai/server-ai-env";

vi.mock("@/lib/ai/gemini-text", () => ({
  generateGeminiText: vi.fn(async () => {
    throw new Error("gemini-2.5-flash: Candidate was blocked due to RECITATION");
  }),
}));

describe("parseJsonText", () => {
  it("strips markdown fences", () => {
    expect(parseJsonText('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
  });
});

describe("getOpenRouterModelCandidates", () => {
  const original = process.env.OPENROUTER_MODEL;

  afterEach(() => {
    if (original === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = original;
  });

  it("puts configured model first and dedupes fallbacks", () => {
    process.env.OPENROUTER_MODEL = "deepseek/deepseek-chat-v3-0324:free";
    const models = getOpenRouterModelCandidates();
    expect(models[0]).toBe("deepseek/deepseek-chat-v3-0324:free");
    expect(models.filter((m) => m === "deepseek/deepseek-chat-v3-0324:free")).toHaveLength(1);
    expect(models.length).toBeGreaterThan(2);
  });
});

describe("generateTextWithFallback", () => {
  it("reports missing providers when no API keys are configured", async () => {
    const keys = ["GEMINI_API_KEY", "OPENROUTER_API_KEY", "XAI_API_KEY", "OPENAI_API_KEY"] as const;
    const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    for (const key of keys) delete process.env[key];
    vi.resetModules();

    const { generateTextWithFallback } = await import("@/lib/ai/generate-text-with-fallback");
    await expect(generateTextWithFallback({ prompt: "Hola", json: false })).rejects.toThrow(
      /No hay proveedores de IA configurados/,
    );

    for (const key of keys) {
      if (saved[key] !== undefined) process.env[key] = saved[key];
    }
    vi.resetModules();
  });
});

describe("generateTextWithFallback OpenRouter fallback", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [{ message: { content: '{"title":"Test"}' } }],
          }),
      })) as unknown as typeof fetch,
    );
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    process.env.GEMINI_API_KEY = "test-gemini-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GEMINI_API_KEY;
    vi.resetModules();
  });

  it("uses OpenRouter when Gemini fails", async () => {
    vi.resetModules();
    const { generateTextWithFallback } = await import("@/lib/ai/generate-text-with-fallback");
    const result = await generateTextWithFallback({
      prompt: "Cataloga",
      json: true,
    });

    expect(result.provider).toBe("openrouter");
    expect(result.text).toContain('"title"');
  });
});
