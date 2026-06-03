import { isPinterestPageUrl } from "@/lib/cuaderno/fetch-remote-image";
import { extractImageUrlFromHtml } from "@/lib/cuaderno/resolve-import-image-url";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export function readImageFileFromClipboard(
  clipboard: DataTransfer | null,
): File | null {
  if (!clipboard) return null;
  for (const item of Array.from(clipboard.items)) {
    if (item.kind === "file" && IMAGE_TYPES.some((t) => item.type === t || item.type.startsWith("image/"))) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}

export function readImageFileFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const files = Array.from(dataTransfer.files);
  return files.find((f) => f.type.startsWith("image/")) ?? null;
}

function looksLikeDirectImageUrl(text: string): boolean {
  const t = text.trim();
  if (!/^https?:\/\//i.test(t)) return false;
  return (
    /\.(png|jpe?g|webp|gif|bmp|avif)(\?|$)/i.test(t) ||
    /pinimg\.com|i\.imgur\.com|pbs\.twimg\.com|googleusercontent\.com/i.test(t)
  );
}

/** URL que el servidor puede convertir en imagen (pin de Pinterest, CDN, etc.). */
export function isImportableImageUrl(text: string): boolean {
  const t = text.trim();
  if (!/^https?:\/\//i.test(t)) return false;
  if (looksLikeDirectImageUrl(t)) return true;
  if (isPinterestPageUrl(t)) return true;
  try {
    const host = new URL(t).hostname.toLowerCase();
    if (host.includes("pinimg.com")) return true;
    if (host.includes("imgur.com") && host.startsWith("i.")) return true;
  } catch {
    return false;
  }
  return false;
}

function extractUrlFromClipboardHtml(html: string, pageUrl: string): string | null {
  const fromOg = extractImageUrlFromHtml(html, pageUrl);
  if (fromOg && isImportableImageUrl(fromOg)) return fromOg;

  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  const src = imgMatch?.[1]?.replace(/&amp;/g, "&");
  if (src && isImportableImageUrl(src)) return src;

  return null;
}

/** Archivo, URL importable (Pinterest pin, pinimg, etc.) o null. */
export function readImagePayloadFromClipboard(clipboard: DataTransfer | null): {
  kind: "file";
  file: File;
} | {
  kind: "url";
  url: string;
} | null {
  if (!clipboard) return null;

  const file = readImageFileFromClipboard(clipboard);
  if (file) return { kind: "file", file };

  let plain = clipboard.getData("text/plain").trim();
  if (/^www\./i.test(plain)) plain = `https://${plain}`;
  const html = clipboard.getData("text/html");

  if (html) {
    const fromHtml = extractUrlFromClipboardHtml(html, plain);
    if (fromHtml) return { kind: "url", url: fromHtml };
  }

  if (isImportableImageUrl(plain)) return { kind: "url", url: plain };

  return null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}
