import type { ImageGenerationSource } from "@/lib/ai/image-generation-types";

const SCOPE = "image-generation";

type ImageGenerationLogBase = {
  event: string;
  provider: ImageGenerationSource | "flux" | "gemini";
  model?: string;
  durationMs: number;
};

export function logImageGenerationAttemptFailed(
  input: ImageGenerationLogBase & { error: string; endpoint?: string },
) {
  console.warn(
    JSON.stringify({
      scope: SCOPE,
      level: "warn",
      ...input,
      ts: new Date().toISOString(),
    }),
  );
}

export function logImageGenerationProviderFallback(input: {
  fromProvider: string;
  toProvider: string;
  error: string;
  durationMs: number;
  model?: string;
}) {
  console.error(
    JSON.stringify({
      scope: SCOPE,
      level: "error",
      event: "provider_fallback",
      provider: input.fromProvider,
      nextProvider: input.toProvider,
      error: input.error,
      durationMs: input.durationMs,
      model: input.model,
      message: `${input.fromProvider} falló; intentando ${input.toProvider} como respaldo.`,
      ts: new Date().toISOString(),
    }),
  );
}

/** @deprecated Usar logImageGenerationProviderFallback */
export function logImageGenerationFluxFallback(input: {
  fluxError: string;
  fluxDurationMs: number;
  model?: string;
}) {
  logImageGenerationProviderFallback({
    fromProvider: "flux",
    toProvider: "gemini",
    error: input.fluxError,
    durationMs: input.fluxDurationMs,
    model: input.model,
  });
}

export function logImageGenerationComplete(input: {
  provider: ImageGenerationSource;
  model?: string;
  durationMs: number;
  imageSizeBytes: number;
  usedFallback: boolean;
  mimeType: string;
  estimatedCostUsd?: number;
  providerChain?: string[];
  attemptErrors?: Array<{ provider: string; error: string; durationMs: number }>;
}) {
  console.info(
    JSON.stringify({
      scope: SCOPE,
      level: "info",
      event: "image_generation_complete",
      ...input,
      ts: new Date().toISOString(),
    }),
  );
}
