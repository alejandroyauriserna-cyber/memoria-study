import {
  extractImageUrlFromHtml,
  isHtmlContentType,
  isLikelyImageContentType,
} from "@/lib/cuaderno/resolve-import-image-url";

const DEFAULT_MAX_BYTES = 6_000_000;
const DEFAULT_UA = "MemoriaStudy-ImageFetch/1.0";

export function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local")) return true;
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) {
    return true;
  }
  return false;
}

/** Pin de Pinterest, pin.it o página de pinterest (no pinimg directo). */
export function isPinterestPageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("pinimg.com")) return false;
    if (host === "pin.it" || host.endsWith(".pin.it")) return true;
    if (!host.includes("pinterest")) return false;
    return /\/pin\//.test(u.pathname) || u.pathname.split("/").filter(Boolean).length >= 1;
  } catch {
    return false;
  }
}

export async function fetchUrlAsImageDataUrl(
  url: string,
  options?: { maxBytes?: number; userAgent?: string },
): Promise<{ imageDataUrl: string; contentType: string; resolvedUrl: string }> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  const userAgent = options?.userAgent ?? DEFAULT_UA;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL inválida");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Solo HTTP/HTTPS");
  }
  if (isPrivateHost(parsed.hostname)) {
    throw new Error("URL no permitida");
  }

  let fetchUrl = url;
  const res = await fetch(fetchUrl, {
    headers: { "User-Agent": userAgent, Accept: "image/*,*/*;q=0.8,text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    throw new Error(`No se pudo descargar (${res.status})`);
  }

  let contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";

  if (isHtmlContentType(contentType) || contentType === "") {
    const html = await res.text();
    const extracted = extractImageUrlFromHtml(html, url);
    if (!extracted) {
      throw new Error(
        "No se encontró la imagen del pin. Prueba pegar el enlace del pin o la URL directa (i.pinimg.com).",
      );
    }
    fetchUrl = extracted;
    const imgRes = await fetch(fetchUrl, {
      headers: { "User-Agent": userAgent, Accept: "image/*" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!imgRes.ok) {
      throw new Error(`Imagen no accesible (${imgRes.status})`);
    }
    contentType = imgRes.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/jpeg";
    if (!isLikelyImageContentType(contentType)) {
      throw new Error("Formato no soportado. Usa PNG, JPG o WEBP.");
    }
    const buf = Buffer.from(await imgRes.arrayBuffer());
    if (buf.length > maxBytes) {
      throw new Error("Imagen demasiado grande");
    }
    return {
      imageDataUrl: `data:${contentType};base64,${buf.toString("base64")}`,
      contentType,
      resolvedUrl: fetchUrl,
    };
  }

  if (!isLikelyImageContentType(contentType)) {
    throw new Error("La URL no apunta a una imagen. Pega el enlace del pin o una URL de imagen.");
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBytes) {
    throw new Error("Imagen demasiado grande");
  }

  return {
    imageDataUrl: `data:${contentType};base64,${buf.toString("base64")}`,
    contentType,
    resolvedUrl: fetchUrl,
  };
}
