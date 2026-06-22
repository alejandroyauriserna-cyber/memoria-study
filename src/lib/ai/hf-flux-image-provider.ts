import { InferenceClient } from "@huggingface/inference";
import { getImageGenerationEnvStatus } from "@/lib/ai/image-generation-env";
import { logImageGenerationAttemptFailed } from "@/lib/ai/image-generation-logger";
import { env } from "@/lib/env";
import type { ImageAspectRatio, ImageGenerationResult } from "@/lib/ai/image-generation-types";

const DEFAULT_FLUX_MODEL = "black-forest-labs/FLUX.1-schnell";

/** HF ya no sirve FLUX solo por hf-inference; el SDK elige fal-ai, nscale, etc. */
const FLUX_PROVIDER_ATTEMPTS = ["auto", "fal-ai", "nscale", "black-forest-labs"] as const;

function dimensionsForAspectRatio(aspectRatio: ImageAspectRatio) {
  switch (aspectRatio) {
    case "16:9":
      return { width: 1344, height: 768 };
    case "4:3":
      return { width: 1024, height: 768 };
    default:
      return { width: 1024, height: 1024 };
  }
}

function inferenceStepsForModel(model: string) {
  return /schnell/i.test(model) ? 4 : 28;
}

function parseInferenceError(caught: unknown, model: string, provider: string): string {
  if (caught instanceof Error) {
    const message = caught.message.trim();
    if (message) return `${model} (${provider}): ${message}`;
  }
  return `${model} (${provider}): error de inferencia`;
}

export async function generateFluxImage(
  prompt: string,
  options: {
    aspectRatio?: ImageAspectRatio;
    model?: string;
    negativePrompt?: string;
    /** Avatares de perfil: 768px suele bastar y mejora en Schnell. */
    profileAvatar?: boolean;
  } = {},
): Promise<{ ok: true; result: ImageGenerationResult } | { ok: false; lastError: string }> {
  const envStatus = getImageGenerationEnvStatus();

  if (!env.hfToken) {
    const error = "HF_TOKEN no configurado.";
    logImageGenerationAttemptFailed({
      event: "flux_env_missing",
      provider: "flux",
      model: envStatus.hfImageModel,
      durationMs: 0,
      error,
    });
    return { ok: false, lastError: error };
  }

  const model = options.model?.trim() || env.hfImageModel?.trim() || DEFAULT_FLUX_MODEL;
  const aspectRatio = options.aspectRatio ?? "1:1";
  let { width, height } = dimensionsForAspectRatio(aspectRatio);
  if (options.profileAvatar && aspectRatio === "1:1") {
    width = 768;
    height = 768;
  }
  const numInferenceSteps = inferenceStepsForModel(model);
  const client = new InferenceClient(env.hfToken);

  let lastError = "Flux no respondió.";

  for (const provider of FLUX_PROVIDER_ATTEMPTS) {
    const startedAt = Date.now();

    try {
      const blob = await client.textToImage(
        {
          model,
          inputs: prompt,
          provider,
          parameters: {
            width,
            height,
            num_inference_steps: numInferenceSteps,
            ...(options.negativePrompt ? { negative_prompt: options.negativePrompt } : {}),
          },
        },
        { outputType: "blob" },
      );

      const arrayBuffer = await blob.arrayBuffer();

      return {
        ok: true,
        result: {
          buffer: Buffer.from(arrayBuffer),
          mimeType: blob.type?.split(";")[0]?.trim() || "image/png",
          source: "flux",
          model,
        },
      };
    } catch (caught) {
      lastError = parseInferenceError(caught, model, provider);
      logImageGenerationAttemptFailed({
        event: "flux_inference_error",
        provider: "flux",
        model,
        durationMs: Date.now() - startedAt,
        error: lastError,
        endpoint: provider,
      });
    }
  }

  return { ok: false, lastError };
}

export function fluxQuotaHint(error: string): string | undefined {
  if (/quota|429|billing|credits|limit|exhausted/i.test(error)) {
    return "Tu token de Hugging Face no tiene cuota de inferencia para imágenes. Revisa créditos en hf.co/settings/billing y el plan Inference Providers.";
  }
  if (/401|403|unauthorized|forbidden|permission|gated|accept/i.test(error)) {
    return "HF_TOKEN inválido o sin permiso Inference Providers. Crea un token en hf.co/settings/tokens con permiso «Inference Providers» y acepta la licencia del modelo FLUX en Hugging Face.";
  }
  if (/loading|estimated_time|503|unavailable/i.test(error)) {
    return "El modelo Flux se está cargando o el proveedor está ocupado. Espera unos segundos y vuelve a intentar.";
  }
  if (/410|deprecated|no longer supported|api-inference/i.test(error)) {
    return "Hugging Face cambió su API de imágenes. Redeploy la app más reciente; usa HF_TOKEN con Inference Providers.";
  }
  return undefined;
}
