function isRecitationError(message: string): boolean {
  return /recitation|blocked due to recitation/i.test(message);
}

function isQuotaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    /429/.test(message) ||
    /quota exceeded/.test(lower) ||
    /too many requests/.test(lower) ||
    /free_tier/.test(lower) ||
    /resource_exhausted/.test(lower)
  );
}

function looksLikeRawProviderDump(message: string): boolean {
  return (
    message.length > 320 ||
    message.includes('"@type"') ||
    message.includes("generativelanguage.googleapis.com") ||
    message.includes("google.rpc") ||
    message.includes("GenerateContentRequest")
  );
}

export type HumanizeAiErrorContext = {
  openRouterConfigured?: boolean;
  openRouterAttempted?: boolean;
};

/** Mensajes claros para estudiantes; evita volcar JSON de Gemini/OpenRouter en la UI. */
export function humanizeAiError(message: string, context?: HumanizeAiErrorContext): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "No pudimos usar la IA en este momento. Intenta de nuevo o completa el formulario manualmente.";
  }

  const recitation = isRecitationError(trimmed);
  const quota = isQuotaError(trimmed);
  const triedOpenRouter = context?.openRouterAttempted ?? /openrouter:/i.test(trimmed);
  const openRouterConfigured = context?.openRouterConfigured ?? triedOpenRouter;

  if (recitation && quota) {
    if (triedOpenRouter) {
      return "Gemini y OpenRouter no pudieron catalogar este PDF (cuota y filtros de contenido). Completa el formulario manualmente.";
    }
    if (openRouterConfigured) {
      return "Gemini falló y el servidor no pudo usar OpenRouter (revisa la key y haz redeploy en Vercel). Completa el formulario manualmente.";
    }
    return "La IA no pudo catalogar este PDF: cuota de Gemini agotada y filtros de contenido. Configura OPENROUTER_API_KEY en Vercel o completa el formulario manualmente.";
  }

  if (recitation) {
    if (triedOpenRouter) {
      return "Ni Gemini ni OpenRouter pudieron catalogar este PDF. Completa el formulario manualmente: el archivo ya está listo para subir.";
    }
    if (openRouterConfigured) {
      return "Gemini bloqueó el texto literal del PDF. OpenRouter está configurado pero no se usó en este intento; haz redeploy en Vercel o completa el formulario manualmente.";
    }
    return "Gemini bloqueó el texto literal del PDF (RECITATION). Completa el formulario manualmente.";
  }

  if (quota) {
    if (triedOpenRouter) {
      return "Se agotó la cuota gratuita de Gemini y OpenRouter tampoco respondió. Completa el formulario manualmente o inténtalo más tarde.";
    }
    if (openRouterConfigured) {
      return "Gemini sin cuota y OpenRouter no se activó en el servidor. Haz redeploy en Vercel o completa el formulario manualmente.";
    }
    return "Se agotó la cuota gratuita de Gemini. Configura OPENROUTER_API_KEY en Vercel para el respaldo gratuito o completa el formulario manualmente.";
  }

  if (/todos los proveedores de texto fallaron/i.test(trimmed) || looksLikeRawProviderDump(trimmed)) {
    if (triedOpenRouter) {
      return "Ningún proveedor de IA pudo catalogar el PDF. El archivo sí se preparó: completa el formulario manualmente y envía a revisión.";
    }
    if (openRouterConfigured) {
      return "La IA no respondió y OpenRouter no se activó en el servidor. Haz redeploy en Vercel o completa el formulario manualmente.";
    }
    return "No pudimos catalogar el PDF con IA en este momento. El archivo sí se preparó correctamente: completa el formulario manualmente y envía a revisión.";
  }

  if (/no hay proveedores de ia configurados/i.test(trimmed)) {
    return "La catalogación con IA no está configurada en el servidor. Completa el formulario manualmente.";
  }

  return trimmed.length > 280 ? `${trimmed.slice(0, 277)}…` : trimmed;
}

export function isAiCatalogBlockedError(message: string): boolean {
  return (
    isRecitationError(message) ||
    isQuotaError(message) ||
    /todos los proveedores de texto fallaron/i.test(message) ||
    looksLikeRawProviderDump(message) ||
    /completa el formulario manualmente/i.test(message)
  );
}
