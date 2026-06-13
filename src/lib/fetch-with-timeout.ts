export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = 60_000, ...fetchInit } = init;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (fetchInit.signal) {
    if (fetchInit.signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      fetchInit.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(url, { ...fetchInit, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`La solicitud superó el límite de ${Math.round(timeoutMs / 1000)} segundos.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
