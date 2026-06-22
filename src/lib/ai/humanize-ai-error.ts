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
    /resource_exhausted/i.test(message) ||
    /GoogleGenerativeAI Error/i.test(message)
  );
}

function looksLikeRawProviderDump(message: string): boolean {
  return (
    message.length > 280 ||
    message.includes('"@type"') ||
    message.includes("generativelanguage.googleapis.com") ||
    message.includes("google.rpc") ||
    message.includes("GenerateContentRequest") ||
    message.includes("GoogleGenerativeAI Error") ||
    message.includes("[GoogleGenerativeAI Error]")
  );
}

export type HumanizeAiErrorContext = {
  openRouterConfigured?: boolean;
  openRouterAttempted?: boolean;
};

function friendlyCatalogFallback(context?: HumanizeAiErrorContext): string {
  if (context?.openRouterAttempted) {
    return "Gemini y OpenRouter no pudieron catalogar este PDF. Completa el formulario manualmente: el archivo ya está listo para subir.";
  }
  if (context?.openRouterConfigured) {
    return "Gemini falló y OpenRouter no respondió en el servidor. Haz redeploy en Vercel o completa el formulario manualmente.";
  }
  return "No pudimos catalogar el PDF con IA. Completa el formulario manualmente y envía a revisión.";
}

/** Mensajes claros para estudiantes; evita volcar JSON de Gemini/OpenRouter en la UI. */
export function humanizeAiError(message: string, context?: HumanizeAiErrorContext): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "No pudimos usar la IA en este momento. Intenta de nuevo o completa el formulario manualmente.";
  }

  if (looksLikeRawProviderDump(trimmed) || /todos los proveedores de texto fallaron/i.test(trimmed)) {
    const recitation = isRecitationError(trimmed);
    const quota = isQuotaError(trimmed);
    const triedOpenRouter = context?.openRouterAttempted ?? /openrouter:/i.test(trimmed);

    if (recitation && quota) {
      return triedOpenRouter
        ? "Gemini y OpenRouter no pudieron catalogar este PDF (cuota y filtros de contenido). Completa el formulario manualmente."
        : friendlyCatalogFallback(context);
    }

    if (recitation || quota) {
      if (triedOpenRouter) {
        return recitation
          ? "Ni Gemini ni OpenRouter pudieron catalogar este PDF. Completa el formulario manualmente."
          : "Se agotó la cuota de Gemini y OpenRouter tampoco respondió. Completa el formulario manualmente.";
      }
      return friendlyCatalogFallback(context);
    }

    return friendlyCatalogFallback(context);
  }

  const recitation = isRecitationError(trimmed);
  const quota = isQuotaError(trimmed);
  const triedOpenRouter = context?.openRouterAttempted ?? /openrouter:/i.test(trimmed);
  const openRouterConfigured = context?.openRouterConfigured ?? triedOpenRouter;

  if (recitation && quota) {
    if (triedOpenRouter) {
      return "Gemini y OpenRouter no pudieron catalogar este PDF (cuota y filtros de contenido). Completa el formulario manualmente.";
    }
    return friendlyCatalogFallback(context);
  }

  if (recitation) {
    return triedOpenRouter
      ? "Ni Gemini ni OpenRouter pudieron catalogar este PDF. Completa el formulario manualmente: el archivo ya está listo para subir."
      : openRouterConfigured
        ? friendlyCatalogFallback(context)
        : "Gemini bloqueó el texto literal del PDF (RECITATION). Completa el formulario manualmente.";
  }

  if (quota) {
    return triedOpenRouter
      ? "Se agotó la cuota gratuita de Gemini y OpenRouter tampoco respondió. Completa el formulario manualmente o inténtalo más tarde."
      : friendlyCatalogFallback(context);
  }

  if (/no hay proveedores de ia configurados/i.test(trimmed)) {
    return "La catalogación con IA no está configurada en el servidor. Completa el formulario manualmente.";
  }

  return trimmed.length > 280 ? friendlyCatalogFallback(context) : trimmed;
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
