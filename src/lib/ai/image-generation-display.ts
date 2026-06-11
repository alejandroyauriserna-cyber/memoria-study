import type {
  ImageGenerationDiagnostics,
  ImageGenerationSource,
  ImageProviderId,
} from "@/lib/ai/image-generation-types";
import { imageSourceLabel } from "@/lib/ai/image-generation-types";

export type ProviderTimelineStepStatus = "success" | "failed" | "skipped";

export type ProviderTimelineStep = {
  id: string;
  label: string;
  status: ProviderTimelineStepStatus;
  durationMs?: number;
  error?: string;
};

export type StudentGenerationSummary = {
  providerLabel: string;
  durationLabel: string;
  costLabel: string | null;
  fallbackExplanation: string | null;
  model?: string;
};

const PROVIDER_LABELS: Record<ImageProviderId, string> = {
  flux: "FLUX",
  gemini: "Gemini",
  replicate: "Replicate",
  ideogram: "Ideogram",
};

export function formatGenerationDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

export function formatEstimatedCostUsd(usd: number | undefined): string | null {
  if (usd == null || usd <= 0) return null;
  if (usd < 0.001) return "<$0.001";
  if (usd < 0.01) return `<$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

function successProviderId(
  source: ImageGenerationSource,
): ImageProviderId | "svg" | "structured" | null {
  switch (source) {
    case "flux":
      return "flux";
    case "gemini":
      return "gemini";
    case "fallback":
      return "svg";
    case "structured":
      return "structured";
    default:
      return null;
  }
}

export function buildProviderTimelineSteps(
  diagnostics: ImageGenerationDiagnostics,
): ProviderTimelineStep[] {
  const winner = successProviderId(diagnostics.provider);
  const attemptsByProvider = new Map(
    diagnostics.attempts.map((attempt) => [attempt.provider, attempt]),
  );
  const steps: ProviderTimelineStep[] = [];

  for (const providerId of diagnostics.providerChain) {
    const attempt = attemptsByProvider.get(providerId);
    if (winner === providerId) {
      steps.push({
        id: providerId,
        label: PROVIDER_LABELS[providerId],
        status: "success",
        durationMs: diagnostics.durationMs,
      });
      break;
    }

    if (attempt) {
      steps.push({
        id: providerId,
        label: PROVIDER_LABELS[providerId],
        status: "failed",
        durationMs: attempt.durationMs,
        error: attempt.error,
      });
      continue;
    }

    steps.push({
      id: providerId,
      label: PROVIDER_LABELS[providerId],
      status: "skipped",
    });
  }

  if (winner === "svg") {
    steps.push({
      id: "svg",
      label: "SVG",
      status: "success",
      durationMs: diagnostics.durationMs,
    });
  }

  return steps;
}

export function buildFallbackExplanation(
  diagnostics: ImageGenerationDiagnostics,
): string | null {
  if (!diagnostics.usedFallback && diagnostics.provider !== "fallback") {
    return null;
  }

  const failedFlux = diagnostics.attempts.some((a) => a.provider === "flux");

  if (diagnostics.provider === "gemini" && failedFlux) {
    return "FLUX no estuvo disponible.\nSe utilizó Gemini automáticamente.";
  }

  if (diagnostics.provider === "fallback") {
    return (
      diagnostics.userMessage?.replace(/^⚠️\s*/, "") ??
      "Los proveedores de imagen no respondieron.\nSe mostró una vista previa básica."
    );
  }

  return diagnostics.userMessage?.replace(/^⚠️\s*/, "") ?? null;
}

export function buildStudentGenerationSummary(
  diagnostics: ImageGenerationDiagnostics,
): StudentGenerationSummary {
  return {
    providerLabel: imageSourceLabel(diagnostics.provider),
    durationLabel: formatGenerationDuration(diagnostics.durationMs),
    costLabel: formatEstimatedCostUsd(diagnostics.estimatedCostUsd),
    fallbackExplanation: buildFallbackExplanation(diagnostics),
    model: diagnostics.model,
  };
}

export function buildMinimalGenerationSummary(
  source: ImageGenerationSource,
  model?: string,
): StudentGenerationSummary {
  return {
    providerLabel: imageSourceLabel(source),
    durationLabel: "—",
    costLabel: null,
    fallbackExplanation: null,
    model,
  };
}
