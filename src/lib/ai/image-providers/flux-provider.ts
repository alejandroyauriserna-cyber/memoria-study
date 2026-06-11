import { getImageGenerationEnvStatus } from "@/lib/ai/image-generation-env";
import { fluxQuotaHint, generateFluxImage } from "@/lib/ai/hf-flux-image-provider";
import type { ImageProvider } from "@/lib/ai/image-providers/types";

/** Coste aproximado HF Inference Providers (FLUX Schnell, ~2–4 s GPU). */
const ESTIMATED_COST_USD = 0.001;

export const fluxImageProvider: ImageProvider = {
  id: "flux",
  source: "flux",
  label: "FLUX (Hugging Face)",

  isConfigured() {
    return getImageGenerationEnvStatus().hfTokenConfigured;
  },

  estimateCostUsd() {
    return ESTIMATED_COST_USD;
  },

  quotaHint: fluxQuotaHint,

  async generate(prompt, options) {
    const result = await generateFluxImage(prompt, options);
    if (result.ok) {
      return {
        ok: true,
        buffer: result.result.buffer,
        mimeType: result.result.mimeType,
        model: result.result.model,
      };
    }
    return {
      ok: false,
      error: result.lastError,
      model: getImageGenerationEnvStatus().hfImageModel,
    };
  },
};
