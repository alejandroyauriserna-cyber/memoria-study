import type {
  ImageGenerationOptions,
  ImageGenerationSource,
  ImageProviderId,
} from "@/lib/ai/image-generation-types";

export type { ImageProviderId };

export type ImageProviderGenerateSuccess = {
  ok: true;
  buffer: Buffer;
  mimeType: string;
  model?: string;
};

export type ImageProviderGenerateFailure = {
  ok: false;
  error: string;
  model?: string;
};

export type ImageProviderGenerateResult =
  | ImageProviderGenerateSuccess
  | ImageProviderGenerateFailure;

/**
 * Contrato uniforme para todos los motores de imagen.
 * La UI y Visual IA consumen solo `generateOrganizerImageWithFallback`.
 */
export interface ImageProvider {
  readonly id: ImageProviderId;
  /** Valor persistido en `ImageGenerationResult.source`. */
  readonly source: ImageGenerationSource;
  readonly label: string;
  isConfigured(): boolean;
  /** Coste estimado en USD por imagen generada con éxito. */
  estimateCostUsd(): number;
  quotaHint?(error: string): string | undefined;
  generate(
    prompt: string,
    options: ImageGenerationOptions,
  ): Promise<ImageProviderGenerateResult>;
}
