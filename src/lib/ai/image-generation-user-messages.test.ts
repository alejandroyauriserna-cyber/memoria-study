import { describe, expect, it } from "vitest";
import { buildImageGenerationUserMessage } from "@/lib/ai/image-generation-user-messages";
import type { ImageGenerationDiagnostics } from "@/lib/ai/image-generation-types";

const baseDiagnostics = (): ImageGenerationDiagnostics => ({
  provider: "gemini",
  durationMs: 1200,
  usedFallback: true,
  imageSizeBytes: 4096,
  mimeType: "image/png",
  estimatedCostUsd: 0.039,
  providerChain: ["flux", "gemini"],
  attempts: [
    {
      provider: "flux",
      error: "quota exceeded for inference",
      durationMs: 400,
      configured: true,
    },
  ],
  env: {
    hfTokenConfigured: true,
    hfImageModel: "black-forest-labs/FLUX.1-schnell",
    hfImageModelFromEnv: false,
    providerChain: ["flux", "gemini"],
    providerChainFromEnv: false,
  },
});

describe("buildImageGenerationUserMessage", () => {
  it("muestra mensaje humano cuando FLUX falla por cuota", () => {
    const message = buildImageGenerationUserMessage({
      diagnostics: baseDiagnostics(),
      source: "gemini",
    });

    expect(message).toContain("⚠️");
    expect(message).toContain("cuota");
    expect(message).toContain("Gemini");
  });

  it("usa warning para fallback SVG", () => {
    const message = buildImageGenerationUserMessage({
      source: "fallback",
      warning: "⚠️ Vista previa básica generada.",
    });

    expect(message).toBe("⚠️ Vista previa básica generada.");
  });
});
