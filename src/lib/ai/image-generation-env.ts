import { resolveAllImageProviderChains, resolveImageProviderChain } from "@/lib/ai/image-providers/resolve-chain";
import type { ImageProviderId } from "@/lib/ai/image-generation-types";
import { env } from "@/lib/env";

const DEFAULT_FLUX_MODEL = "black-forest-labs/FLUX.1-schnell";

export type ImageGenerationEnvStatus = {
  hfTokenConfigured: boolean;
  hfTokenPreview: string | null;
  hfImageModel: string;
  hfImageModelFromEnv: boolean;
  geminiImageConfigured: boolean;
  providerChain: ImageProviderId[];
  providerChainFromEnv: boolean;
  providerChainsByFormat: Record<
    string,
    { chain: ImageProviderId[]; fromEnv: boolean }
  >;
};

/** Estado de variables de entorno para auditoría (sin exponer secretos). */
export function getImageGenerationEnvStatus(): ImageGenerationEnvStatus {
  const rawToken = process.env.HF_TOKEN?.trim();
  const rawModel = process.env.HF_IMAGE_MODEL?.trim();
  const { chain, fromEnv } = resolveImageProviderChain();
  const chainsByFormat = resolveAllImageProviderChains();

  return {
    hfTokenConfigured: Boolean(rawToken),
    hfTokenPreview: rawToken ? `${rawToken.slice(0, 4)}…${rawToken.slice(-4)}` : null,
    hfImageModel: rawModel || DEFAULT_FLUX_MODEL,
    hfImageModelFromEnv: Boolean(rawModel),
    geminiImageConfigured: Boolean(process.env.GEMINI_API_KEY?.trim() || env.geminiApiKey?.trim()),
    providerChain: chain,
    providerChainFromEnv: fromEnv,
    providerChainsByFormat: Object.fromEntries(
      Object.entries(chainsByFormat).map(([key, value]) => [
        key,
        { chain: value.chain, fromEnv: value.fromEnv },
      ]),
    ),
  };
}
