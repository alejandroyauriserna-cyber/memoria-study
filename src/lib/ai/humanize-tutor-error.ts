import { humanizeAiError } from "@/lib/ai/humanize-ai-error";
import { getTextAiProviderStatus } from "@/lib/ai/server-ai-env";
import {
  isTextAiProvidersFailedError,
  type TextAiProvidersFailedError,
} from "@/lib/ai/text-ai-providers-failed";

function tutorMessageFromProvidersError(error: TextAiProvidersFailedError): string {
  const triedOpenRouter = error.providersAttempted.includes("openrouter");
  const openRouterConfigured = error.providersConfigured.openrouter;

  if (triedOpenRouter) {
    return "El profesor IA no pudo responder (Gemini y OpenRouter fallaron). Espera unos minutos e inténtalo de nuevo.";
  }

  if (openRouterConfigured) {
    return "Gemini falló y OpenRouter no respondió en el servidor. Haz redeploy en Vercel o inténtalo más tarde.";
  }

  return "La cuota de Gemini se agotó. Añade OPENROUTER_API_KEY en Vercel para que el profesor siga funcionando.";
}

export function humanizeTutorAiError(error: unknown): string {
  if (isTextAiProvidersFailedError(error)) {
    return tutorMessageFromProvidersError(error);
  }

  const message = error instanceof Error ? error.message.trim() : String(error).trim();
  if (!message) {
    return "El profesor IA no pudo responder. Intenta de nuevo en un momento.";
  }

  if (/todos los proveedores de texto fallaron/i.test(message)) {
    const status = getTextAiProviderStatus();
    return humanizeAiError(message, {
      openRouterConfigured: status.openrouter,
      openRouterAttempted: /openrouter:/i.test(message),
    }).replace(/catalogar este PDF/gi, "explicar esta página");
  }

  if (/no hay proveedores de ia configurados/i.test(message)) {
    return "El profesor IA no está configurado en el servidor. Añade GEMINI_API_KEY u OPENROUTER_API_KEY en Vercel.";
  }

  if (/recitation|429|quota|resource_exhausted|too many requests/i.test(message)) {
    return "Gemini limitó la solicitud. El sistema intentará otro proveedor; si persiste, espera unos minutos.";
  }

  if (message.length > 220 || /generativelanguage|google\.rpc|"@type"/i.test(message)) {
    return "El profesor IA tuvo un problema técnico. Intenta de nuevo en un momento.";
  }

  return message;
}
