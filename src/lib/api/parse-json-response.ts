export async function parseJsonResponse<T extends Record<string, unknown>>(
  response: Response,
): Promise<T> {
  if (response.status === 413) {
    throw new Error(
      "El archivo es demasiado pesado para enviarlo al servidor. La app ahora lo lee en tu navegador; recarga la página e inténtalo de nuevo.",
    );
  }

  const raw = await response.text();

  if (!raw.trim()) {
    if (response.status === 504 || response.status === 408) {
      throw new Error(
        "El análisis tardó demasiado. Prueba con un archivo más liviano o con texto seleccionable.",
      );
    }

    throw new Error(`El servidor respondió vacío (HTTP ${response.status}).`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    if (response.status === 504 || response.status === 502 || response.status === 408) {
      throw new Error(
        "El análisis tardó demasiado o el servidor falló. Espera un momento y vuelve a intentar.",
      );
    }

    throw new Error(
      `Error del servidor al analizar (HTTP ${response.status}). Intenta de nuevo en unos minutos.`,
    );
  }
}
