export function humanizeGuidedStudyFetchError(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : String(error).trim();

  if (/failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(message)) {
    return "No se pudo conectar con el servidor del tutor. Suele ocurrir por un corte de red o porque Vercel cortó la función por tiempo. Espera unos segundos e inténtalo de nuevo.";
  }

  if (!message) {
    return "Error consultando al profesor. Intenta de nuevo.";
  }

  return message;
}
