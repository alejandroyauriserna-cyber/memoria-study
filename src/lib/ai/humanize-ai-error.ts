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

/** Mensajes claros para estudiantes; evita volcar JSON de Gemini/OpenRouter en la UI. */
export function humanizeAiError(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return "No pudimos usar la IA en este momento. Intenta de nuevo o completa el formulario manualmente.";
  }

  const recitation = isRecitationError(trimmed);
  const quota = isQuotaError(trimmed);

  if (recitation && quota) {
    return "La IA no pudo catalogar este PDF: se agotó la cuota de Gemini y el documento activó filtros de contenido. Completa el formulario manualmente o vuelve a intentar más tarde.";
  }

  if (recitation) {
    return "La IA no pudo catalogar este PDF porque el texto es muy literal (filtro RECITATION de Gemini). Completa el formulario manualmente: el archivo ya está listo para subir.";
  }

  if (quota) {
    return "Se agotó la cuota gratuita de Gemini por ahora. Espera unos minutos, pide a quien administre la app que configure OPENROUTER_API_KEY como respaldo, o completa el formulario manualmente.";
  }

  if (/todos los proveedores de texto fallaron/i.test(trimmed) || looksLikeRawProviderDump(trimmed)) {
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
    looksLikeRawProviderDump(message)
  );
}
