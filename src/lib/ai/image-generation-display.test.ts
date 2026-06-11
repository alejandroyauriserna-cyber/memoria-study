import { describe, expect, it } from "vitest";
import {
  buildProviderTimelineSteps,
  buildStudentGenerationSummary,
  formatEstimatedCostUsd,
} from "@/lib/ai/image-generation-display";
import type { ImageGenerationDiagnostics } from "@/lib/ai/image-generation-types";

function diagnostics(partial: Partial<ImageGenerationDiagnostics>): ImageGenerationDiagnostics {
  return {
    provider: "flux",
    durationMs: 3100,
    usedFallback: false,
    imageSizeBytes: 2048,
    mimeType: "image/png",
    estimatedCostUsd: 0.001,
    providerChain: ["flux", "gemini"],
    attempts: [],
    env: {
      hfTokenConfigured: true,
      hfImageModel: "black-forest-labs/FLUX.1-schnell",
      hfImageModelFromEnv: false,
      providerChain: ["flux", "gemini"],
      providerChainFromEnv: false,
    },
    ...partial,
  };
}

describe("image-generation-display", () => {
  it("formatea costes pequeños como <$0.001", () => {
    expect(formatEstimatedCostUsd(0.001)).toBe("<$0.001");
    expect(formatEstimatedCostUsd(0.005)).toBe("<$0.005");
    expect(formatEstimatedCostUsd(0.039)).toBe("$0.04");
  });

  it("resume generación exitosa con FLUX", () => {
    const summary = buildStudentGenerationSummary(diagnostics({}));

    expect(summary.providerLabel).toBe("Generado con FLUX");
    expect(summary.durationLabel).toBe("3.1 s");
    expect(summary.costLabel).toBe("<$0.001");
    expect(summary.fallbackExplanation).toBeNull();
  });

  it("construye timeline con fallback a Gemini", () => {
    const steps = buildProviderTimelineSteps(
      diagnostics({
        provider: "gemini",
        usedFallback: true,
        estimatedCostUsd: 0.039,
        attempts: [
          {
            provider: "flux",
            error: "quota exceeded",
            durationMs: 420,
          },
        ],
      }),
    );

    expect(steps.map((s) => `${s.status}:${s.label}`)).toEqual([
      "failed:FLUX",
      "success:Gemini",
    ]);
  });

  it("construye timeline con fallback a SVG", () => {
    const steps = buildProviderTimelineSteps(
      diagnostics({
        provider: "fallback",
        usedFallback: true,
        estimatedCostUsd: 0,
        attempts: [
          { provider: "flux", error: "flux down", durationMs: 100 },
          { provider: "gemini", error: "gemini down", durationMs: 200 },
        ],
      }),
    );

    expect(steps.map((s) => s.label)).toEqual(["FLUX", "Gemini", "SVG"]);
    expect(steps.every((s, i) => (i < 2 ? s.status === "failed" : s.status === "success"))).toBe(
      true,
    );
  });
});
