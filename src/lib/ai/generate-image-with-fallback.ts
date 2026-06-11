import { getImageGenerationEnvStatus } from "@/lib/ai/image-generation-env";
import {
  logImageGenerationAttemptFailed,
  logImageGenerationComplete,
  logImageGenerationProviderFallback,
} from "@/lib/ai/image-generation-logger";
import { getImageProvider } from "@/lib/ai/image-providers/registry";
import { resolveImageProviderChain } from "@/lib/ai/image-providers/resolve-chain";
import type { ImageProviderId } from "@/lib/ai/image-providers/types";
import {
  buildImageGenerationUserMessage,
  buildProviderFallbackProgressMessage,
} from "@/lib/ai/image-generation-user-messages";
import type {
  ImageGenerationDiagnostics,
  ImageGenerationOptions,
  ImageGenerationResult,
  ImageProviderAttempt,
} from "@/lib/ai/image-generation-types";

function buildDiagnostics(input: {
  result: ImageGenerationResult;
  totalDurationMs: number;
  usedFallback: boolean;
  attempts: ImageProviderAttempt[];
  providerChain: ImageProviderId[];
  chainKey: string;
  estimatedCostUsd: number;
}): ImageGenerationDiagnostics {
  const envStatus = getImageGenerationEnvStatus();
  const diagnostics: ImageGenerationDiagnostics = {
    provider: input.result.source,
    model: input.result.model,
    durationMs: input.totalDurationMs,
    usedFallback: input.usedFallback,
    imageSizeBytes: input.result.buffer.byteLength,
    mimeType: input.result.mimeType,
    estimatedCostUsd: input.estimatedCostUsd,
    providerChain: input.providerChain,
    attempts: input.attempts,
    env: {
      hfTokenConfigured: envStatus.hfTokenConfigured,
      hfImageModel: envStatus.hfImageModel,
      hfImageModelFromEnv: envStatus.hfImageModelFromEnv,
      providerChain: envStatus.providerChain,
      providerChainFromEnv: envStatus.providerChainFromEnv,
      chainKey: input.chainKey,
    },
  };

  diagnostics.userMessage =
    buildImageGenerationUserMessage({
      diagnostics,
      source: input.result.source,
    }) ?? undefined;

  return diagnostics;
}

function buildFailureDiagnostics(input: {
  totalDurationMs: number;
  attempts: ImageProviderAttempt[];
  providerChain: ImageProviderId[];
  chainKey: string;
}): ImageGenerationDiagnostics {
  const envStatus = getImageGenerationEnvStatus();
  const diagnostics: ImageGenerationDiagnostics = {
    provider: "fallback",
    durationMs: input.totalDurationMs,
    usedFallback: true,
    imageSizeBytes: 0,
    mimeType: "image/svg+xml",
    estimatedCostUsd: 0,
    providerChain: input.providerChain,
    attempts: input.attempts,
    env: {
      hfTokenConfigured: envStatus.hfTokenConfigured,
      hfImageModel: envStatus.hfImageModel,
      hfImageModelFromEnv: envStatus.hfImageModelFromEnv,
      providerChain: envStatus.providerChain,
      providerChainFromEnv: envStatus.providerChainFromEnv,
      chainKey: input.chainKey,
    },
  };

  diagnostics.userMessage =
    buildImageGenerationUserMessage({
      diagnostics,
      source: "fallback",
    }) ?? undefined;

  return diagnostics;
}

/**
 * Orquestador de generación: recorre la cadena configurada por formato o global.
 * Por defecto: Flux (HF) → Gemini imagen.
 */
export async function generateOrganizerImageWithFallback(
  prompt: string,
  options: ImageGenerationOptions = {},
): Promise<
  | { ok: true; result: ImageGenerationResult }
  | { ok: false; lastError: string; attempts: ImageProviderAttempt[]; diagnostics: ImageGenerationDiagnostics }
> {
  const startedAt = Date.now();
  const attempts: ImageProviderAttempt[] = [];
  const { chain: providerChain, chainKey } = resolveImageProviderChain(options.formatId);
  let lastError = "Ningún proveedor de imagen respondió.";

  for (let index = 0; index < providerChain.length; index += 1) {
    const providerId = providerChain[index]!;
    const provider = getImageProvider(providerId);
    if (!provider) continue;

    const attemptStarted = Date.now();
    const outcome = await provider.generate(prompt, options);
    const durationMs = Date.now() - attemptStarted;

    if (outcome.ok) {
      const totalDurationMs = Date.now() - startedAt;
      const usedFallback = attempts.length > 0;
      const estimatedCostUsd = provider.estimateCostUsd();
      const result: ImageGenerationResult = {
        buffer: outcome.buffer,
        mimeType: outcome.mimeType,
        source: provider.source,
        model: outcome.model,
      };
      const diagnostics = buildDiagnostics({
        result,
        totalDurationMs,
        usedFallback,
        attempts,
        providerChain,
        chainKey,
        estimatedCostUsd,
      });

      logImageGenerationComplete({
        provider: provider.source,
        model: outcome.model,
        durationMs: totalDurationMs,
        imageSizeBytes: outcome.buffer.byteLength,
        usedFallback,
        mimeType: outcome.mimeType,
        estimatedCostUsd,
        providerChain,
        attemptErrors: attempts.map((a) => ({
          provider: a.provider,
          error: a.error,
          durationMs: a.durationMs,
        })),
      });

      return { ok: true, result: { ...result, diagnostics } };
    }

    lastError = outcome.error;

    attempts.push({
      provider: providerId,
      error: outcome.error,
      durationMs,
      model: outcome.model,
      configured: provider.isConfigured(),
      estimatedCostUsd: 0,
    });

    logImageGenerationAttemptFailed({
      event: "provider_attempt_failed",
      provider: provider.source,
      model: outcome.model,
      durationMs,
      error: outcome.error,
    });

    const nextProviderId = providerChain[index + 1];
    if (nextProviderId) {
      const progressMessage = buildProviderFallbackProgressMessage({
        fromProvider: providerId,
        toProvider: nextProviderId,
        error: outcome.error,
      });

      logImageGenerationProviderFallback({
        fromProvider: providerId,
        toProvider: nextProviderId,
        error: outcome.error,
        durationMs,
        model: outcome.model,
      });

      console.info(
        JSON.stringify({
          scope: "image-generation",
          level: "info",
          event: "provider_fallback_progress",
          message: progressMessage,
          ts: new Date().toISOString(),
        }),
      );
    }
  }

  const totalDurationMs = Date.now() - startedAt;
  const diagnostics = buildFailureDiagnostics({
    totalDurationMs,
    attempts,
    providerChain,
    chainKey,
  });

  logImageGenerationComplete({
    provider: "fallback",
    durationMs: totalDurationMs,
    imageSizeBytes: 0,
    usedFallback: true,
    mimeType: "image/svg+xml",
    estimatedCostUsd: 0,
    providerChain,
    attemptErrors: attempts.map((a) => ({
      provider: a.provider,
      error: a.error,
      durationMs: a.durationMs,
    })),
  });

  return {
    ok: false,
    lastError,
    attempts,
    diagnostics,
  };
}
