import { getImageGenerationEnvStatus } from "@/lib/ai/image-generation-env";
import { logImageGenerationAttemptFailed } from "@/lib/ai/image-generation-logger";
import { env } from "@/lib/env";
import type { ImageAspectRatio, ImageGenerationResult } from "@/lib/ai/image-generation-types";

const DEFAULT_FLUX_MODEL = "black-forest-labs/FLUX.1-schnell";

const HF_INFERENCE_ENDPOINTS = [
  (model: string) => `https://router.huggingface.co/hf-inference/models/${model}`,
  (model: string) => `https://api-inference.huggingface.co/models/${model}`,
] as const;

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

function parseErrorPayload(payload: unknown, status: number): string {
  if (typeof payload === "object" && payload) {
    const record = payload as {
      error?: string;
      message?: string;
      estimated_time?: number;
    };
    if (record.error) {
      return record.estimated_time
        ? `${record.error} (reintenta en ~${Math.ceil(record.estimated_time)}s)`
        : record.error;
    }
    if (record.message) return record.message;
  }
  return `HTTP ${status}`;
}

export async function generateFluxImage(
  prompt: string,
  options: { aspectRatio?: ImageAspectRatio } = {},
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

  const model = env.hfImageModel?.trim() || DEFAULT_FLUX_MODEL;
  const aspectRatio = options.aspectRatio ?? "1:1";
  const { width, height } = dimensionsForAspectRatio(aspectRatio);
  const numInferenceSteps = inferenceStepsForModel(model);

  let lastError = "Flux no respondió.";

  for (const buildUrl of HF_INFERENCE_ENDPOINTS) {
    const url = buildUrl(model);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width,
            height,
            num_inference_steps: numInferenceSteps,
          },
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        const payload = contentType.includes("json")
          ? await response.json()
          : await response.text();
        lastError = `${model}: ${parseErrorPayload(payload, response.status)}`;
        logImageGenerationAttemptFailed({
          event: "flux_http_error",
          provider: "flux",
          model,
          durationMs: 0,
          error: lastError,
          endpoint: url,
        });
        continue;
      }

      if (contentType.includes("image")) {
        const arrayBuffer = await response.arrayBuffer();
        return {
          ok: true,
          result: {
            buffer: Buffer.from(arrayBuffer),
            mimeType: contentType.split(";")[0]?.trim() || "image/png",
            source: "flux",
            model,
          },
        };
      }

      const payload = await response.json();
      lastError = `${model}: ${parseErrorPayload(payload, response.status)}`;
      logImageGenerationAttemptFailed({
        event: "flux_unexpected_response",
        provider: "flux",
        model,
        durationMs: 0,
        error: lastError,
        endpoint: url,
      });
    } catch (caught) {
      lastError = `${model}: ${caught instanceof Error ? caught.message : "error de red"}`;
      logImageGenerationAttemptFailed({
        event: "flux_network_error",
        provider: "flux",
        model,
        durationMs: 0,
        error: lastError,
        endpoint: url,
      });
    }
  }

  return { ok: false, lastError };
}

export function fluxQuotaHint(error: string): string | undefined {
  if (/quota|429|billing|credits|limit/i.test(error)) {
    return "Tu token de Hugging Face no tiene cuota de inferencia para imágenes. Revisa HF_TOKEN y el plan de Inference Providers.";
  }
  if (/401|403|unauthorized|forbidden/i.test(error)) {
    return "HF_TOKEN inválido o sin permiso de inferencia. Crea un token con acceso a Inference Providers.";
  }
  if (/loading|estimated_time/i.test(error)) {
    return "El modelo Flux se está cargando en Hugging Face. Espera unos segundos y vuelve a intentar.";
  }
  return undefined;
}
