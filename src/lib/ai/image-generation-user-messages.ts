import { getImageProvider } from "@/lib/ai/image-providers/registry";
import type {
  ImageGenerationDiagnostics,
  ImageGenerationSource,
  ImageProviderId,
} from "@/lib/ai/image-generation-types";
import { imageSourceLabel } from "@/lib/ai/image-generation-types";

const PROVIDER_LABELS: Record<ImageProviderId, string> = {
  flux: "FLUX",
  gemini: "Gemini",
  replicate: "Replicate",
  ideogram: "Ideogram",
};

function providerLabel(id: ImageProviderId): string {
  return PROVIDER_LABELS[id] ?? id;
}

function hintForAttempt(providerId: ImageProviderId, error: string): string | undefined {
  const provider = getImageProvider(providerId);
  return provider?.quotaHint?.(error);
}

function genericFallbackReason(providerId: ImageProviderId): string {
  if (providerId === "flux") {
    return "FLUX alcanzó su cuota temporal o no está disponible.";
  }
  return "Servicio de imágenes temporalmente ocupado.";
}

/**
 * Mensaje amigable para mostrar en Visual IA tras una generación con fallback.
 */
export function buildImageGenerationUserMessage(input: {
  diagnostics?: ImageGenerationDiagnostics;
  source: ImageGenerationSource;
  warning?: string;
}): string | null {
  if (input.source === "fallback") {
    return (
      input.warning ??
      input.diagnostics?.userMessage ??
      "⚠️ No se pudo generar la imagen con los proveedores disponibles. Se mostró una vista previa básica."
    );
  }

  if (input.diagnostics?.userMessage) {
    return input.diagnostics.userMessage;
  }

  if (!input.diagnostics?.usedFallback || !input.diagnostics.attempts.length) {
    return input.warning ?? null;
  }

  const lastFailed = input.diagnostics.attempts[input.diagnostics.attempts.length - 1]!;
  const hint = hintForAttempt(lastFailed.provider, lastFailed.error);
  const reason = hint ?? genericFallbackReason(lastFailed.provider);
  const successLabel = imageSourceLabel(input.source);

  return `⚠️ ${reason}\nSe usó ${successLabel} como proveedor alternativo.`;
}

/** Mensaje durante el recorrido de la cadena (p. ej. logs o futuro streaming). */
export function buildProviderFallbackProgressMessage(input: {
  fromProvider: ImageProviderId;
  toProvider: ImageProviderId;
  error: string;
}): string {
  const hint = hintForAttempt(input.fromProvider, input.error);
  const reason = hint ?? genericFallbackReason(input.fromProvider);
  return `⚠️ ${reason}\nProbando ${providerLabel(input.toProvider)}…`;
}
