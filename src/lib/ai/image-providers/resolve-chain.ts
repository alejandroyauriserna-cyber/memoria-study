import type { ImageProviderChainKey } from "@/lib/ai/image-providers/format-chain-keys";
import { IMAGE_PROVIDER_CHAIN_ENV_KEYS } from "@/lib/ai/image-providers/format-chain-keys";
import {
  getImageProvider,
  isRegisteredImageProvider,
} from "@/lib/ai/image-providers/registry";
import type { ImageProviderId } from "@/lib/ai/image-providers/types";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";
import { formatIdToChainKey } from "@/lib/ai/image-providers/format-chain-keys";

export const DEFAULT_IMAGE_PROVIDER_CHAIN: ImageProviderId[] = ["flux", "gemini"];

const KNOWN_PROVIDER_IDS = new Set<ImageProviderId>([
  "flux",
  "gemini",
  "replicate",
  "ideogram",
]);

function parseChainToken(token: string): ImageProviderId | null {
  const normalized = token.trim().toLowerCase();
  if (!normalized || !KNOWN_PROVIDER_IDS.has(normalized as ImageProviderId)) {
    return null;
  }
  return normalized as ImageProviderId;
}

function parseChainRaw(raw: string | undefined): ImageProviderId[] | null {
  if (!raw?.trim()) return null;

  const parsed = raw
    .split(",")
    .map(parseChainToken)
    .filter((id): id is ImageProviderId => id !== null)
    .filter((id) => isRegisteredImageProvider(id) && getImageProvider(id));

  return parsed.length ? parsed : null;
}

function resolveChainByKey(chainKey: ImageProviderChainKey): {
  chain: ImageProviderId[];
  fromEnv: boolean;
} {
  const envVar = IMAGE_PROVIDER_CHAIN_ENV_KEYS[chainKey];
  const parsed = parseChainRaw(process.env[envVar]);

  if (parsed) {
    return { chain: parsed, fromEnv: true };
  }

  if (chainKey !== "default") {
    const global = parseChainRaw(process.env.IMAGE_PROVIDER_CHAIN);
    if (global) {
      return { chain: global, fromEnv: Boolean(process.env.IMAGE_PROVIDER_CHAIN?.trim()) };
    }
  }

  return { chain: [...DEFAULT_IMAGE_PROVIDER_CHAIN], fromEnv: false };
}

/**
 * Cadena de fallback por formato o global (`IMAGE_PROVIDER_CHAIN`).
 * Prioridad: env específico del formato → `IMAGE_PROVIDER_CHAIN` → default flux,gemini.
 */
export function resolveImageProviderChain(formatId?: VisualAiFormatId): {
  chain: ImageProviderId[];
  fromEnv: boolean;
  chainKey: ImageProviderChainKey;
} {
  const chainKey = formatId ? (formatIdToChainKey(formatId) ?? "default") : "default";
  const resolved = resolveChainByKey(chainKey);
  return { ...resolved, chainKey };
}

export function resolveAllImageProviderChains(): Record<
  ImageProviderChainKey,
  { chain: ImageProviderId[]; fromEnv: boolean }
> {
  return {
    infographic: resolveChainByKey("infographic"),
    poster: resolveChainByKey("poster"),
    atlas: resolveChainByKey("atlas"),
    presentation: resolveChainByKey("presentation"),
    default: resolveChainByKey("default"),
  };
}
