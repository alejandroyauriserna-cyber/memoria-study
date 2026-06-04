const FETCH_TIMEOUT_MS = 45_000;
const USER_AGENT = "MemoriaStudy/1.0 (+https://memoriastudy.app; academic legal sync)";

export async function fetchUrlContent(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-PE,es;q=0.9",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`No se pudo descargar la página (${response.status}).`);
    }

    const html = await response.text();
    if (!html.trim()) {
      throw new Error("La página descargada está vacía.");
    }

    return html;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tiempo de espera agotado al descargar la fuente web.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
