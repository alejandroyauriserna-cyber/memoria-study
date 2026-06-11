export type ImageGenerationSource = "flux" | "gemini" | "fallback" | "structured";

/** IDs de proveedores registrados o planificados para la cadena de fallback. */
export type ImageProviderId = "flux" | "gemini" | "replicate" | "ideogram";

export type ImageAspectRatio = "16:9" | "1:1" | "4:3";

export type ImageProviderAttempt = {
  provider: ImageProviderId;
  error: string;
  durationMs: number;
  model?: string;
  configured?: boolean;
  /** Siempre 0 en intentos fallidos. */
  estimatedCostUsd?: number;
};

export type ImageGenerationDiagnostics = {
  provider: ImageGenerationSource;
  model?: string;
  durationMs: number;
  usedFallback: boolean;
  imageSizeBytes: number;
  mimeType: string;
  /** Coste estimado USD de la generación exitosa. */
  estimatedCostUsd?: number;
  /** Cadena de proveedores ejecutada en esta generación. */
  providerChain: ImageProviderId[];
  /** Mensaje amigable para mostrar al usuario. */
  userMessage?: string;
  attempts: ImageProviderAttempt[];
  env: {
    hfTokenConfigured: boolean;
    hfImageModel: string;
    hfImageModelFromEnv: boolean;
    providerChain: ImageProviderId[];
    providerChainFromEnv: boolean;
    chainKey?: string;
  };
};

export type ImageGenerationResult = {
  buffer: Buffer;
  mimeType: string;
  source: ImageGenerationSource;
  model?: string;
  warning?: string;
  diagnostics?: ImageGenerationDiagnostics;
};

export type ImageGenerationOptions = {
  aspectRatio?: ImageAspectRatio;
  formatId?: import("@/lib/organizers/visual-ai-types").VisualAiFormatId;
};

export function imageSourceLabel(source: ImageGenerationSource): string {
  switch (source) {
    case "flux":
      return "Generado con FLUX";
    case "gemini":
      return "Generado con Gemini";
    case "structured":
      return "Diagrama estructurado MemoriaStudy";
    default:
      return "Generado con SVG local";
  }
}

/** @deprecated Use ImageGenerationResult */
export type GeminiImageResult = ImageGenerationResult;
