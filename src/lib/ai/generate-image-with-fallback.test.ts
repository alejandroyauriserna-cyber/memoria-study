import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/hf-flux-image-provider", () => ({
  generateFluxImage: vi.fn(),
  fluxQuotaHint: vi.fn(() => undefined),
}));

vi.mock("@/lib/ai/gemini-image-generation", () => ({
  generateGeminiImage: vi.fn(),
  quotaHint: vi.fn(() => undefined),
  GEMINI_IMAGE_MODELS: ["gemini-2.5-flash-image"],
}));

import { generateFluxImage } from "@/lib/ai/hf-flux-image-provider";
import { generateGeminiImage } from "@/lib/ai/gemini-image-generation";
import { generateOrganizerImageWithFallback } from "@/lib/ai/generate-image-with-fallback";

const fluxMock = vi.mocked(generateFluxImage);
const geminiMock = vi.mocked(generateGeminiImage);

afterEach(() => {
  vi.clearAllMocks();
});

describe("generateOrganizerImageWithFallback", () => {
  it("usa Flux cuando responde correctamente", async () => {
    fluxMock.mockResolvedValue({
      ok: true,
      result: {
        buffer: Buffer.from("flux"),
        mimeType: "image/png",
        source: "flux",
        model: "black-forest-labs/FLUX.1-schnell",
      },
    });

    const result = await generateOrganizerImageWithFallback("prompt", { aspectRatio: "16:9" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.source).toBe("flux");
      expect(result.result.diagnostics?.usedFallback).toBe(false);
      expect(result.result.diagnostics?.provider).toBe("flux");
      expect(result.result.diagnostics?.imageSizeBytes).toBe(4);
      expect(result.result.diagnostics?.providerChain).toEqual(["flux", "gemini"]);
      expect(result.result.diagnostics?.estimatedCostUsd).toBeGreaterThan(0);
    }
    expect(geminiMock).not.toHaveBeenCalled();
  });

  it("recurre a Gemini si Flux falla", async () => {
    fluxMock.mockResolvedValue({ ok: false, lastError: "HF_TOKEN no configurado." });
    geminiMock.mockResolvedValue({
      ok: true,
      result: {
        buffer: Buffer.from("gemini"),
        mimeType: "image/png",
        source: "gemini",
        model: "gemini-2.5-flash-image",
      },
    });

    const result = await generateOrganizerImageWithFallback("prompt");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.source).toBe("gemini");
      expect(result.result.diagnostics?.usedFallback).toBe(true);
      expect(result.result.diagnostics?.attempts[0]?.provider).toBe("flux");
      expect(result.result.diagnostics?.attempts[0]?.error).toContain("HF_TOKEN");
    }
    expect(fluxMock).toHaveBeenCalledOnce();
    expect(geminiMock).toHaveBeenCalledOnce();
  });

  it("devuelve intentos cuando ambos proveedores fallan", async () => {
    fluxMock.mockResolvedValue({ ok: false, lastError: "flux down" });
    geminiMock.mockResolvedValue({ ok: false, lastError: "gemini down" });

    const result = await generateOrganizerImageWithFallback("prompt");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.attempts).toHaveLength(2);
      expect(result.attempts[0]?.provider).toBe("flux");
      expect(result.attempts[1]?.provider).toBe("gemini");
      expect(result.diagnostics.usedFallback).toBe(true);
      expect(result.diagnostics.attempts).toHaveLength(2);
    }
  });
});
