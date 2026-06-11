import { fluxImageProvider } from "@/lib/ai/image-providers/flux-provider";
import { geminiImageProvider } from "@/lib/ai/image-providers/gemini-provider";
import type { ImageProvider, ImageProviderId } from "@/lib/ai/image-providers/types";

const REGISTRY: Partial<Record<ImageProviderId, ImageProvider>> = {
  flux: fluxImageProvider,
  gemini: geminiImageProvider,
};

export function getImageProvider(id: ImageProviderId): ImageProvider | undefined {
  return REGISTRY[id];
}

export function listRegisteredImageProviders(): ImageProvider[] {
  return Object.values(REGISTRY).filter((p): p is ImageProvider => Boolean(p));
}

export function isRegisteredImageProvider(id: string): id is ImageProviderId {
  return id in REGISTRY && REGISTRY[id as ImageProviderId] !== undefined;
}
