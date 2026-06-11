import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";

/** Claves de cadena de proveedores configurables por env. */
export type ImageProviderChainKey =
  | "infographic"
  | "poster"
  | "atlas"
  | "presentation"
  | "default";

export const IMAGE_PROVIDER_CHAIN_ENV_KEYS: Record<ImageProviderChainKey, string> = {
  infographic: "IMAGE_PROVIDER_CHAIN_INFOGRAPHIC",
  poster: "IMAGE_PROVIDER_CHAIN_POSTER",
  atlas: "IMAGE_PROVIDER_CHAIN_ATLAS",
  presentation: "IMAGE_PROVIDER_CHAIN_PRESENTATION",
  default: "IMAGE_PROVIDER_CHAIN",
};

export function formatIdToChainKey(formatId: VisualAiFormatId): ImageProviderChainKey | null {
  switch (formatId) {
    case "infographic":
      return "infographic";
    case "academicPoster":
      return "poster";
    case "legalAtlas":
      return "atlas";
    case "presentation":
      return "presentation";
    default:
      return null;
  }
}
