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

function extractImageUrlFromHtml(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
}

function looksLikeImageUrl(text: string): boolean {
  const t = text.trim();
  if (!/^https?:\/\//i.test(t)) return false;
  return /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(t) || /pinimg\.com|i\.imgur\.com|images\./i.test(t);
}

/** Archivo, URL de imagen (Pinterest, etc.) o null. */
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

  const html = clipboard.getData("text/html");
  if (html) {
    const fromHtml = extractImageUrlFromHtml(html);
    if (fromHtml && looksLikeImageUrl(fromHtml)) return { kind: "url", url: fromHtml };
  }

  const plain = clipboard.getData("text/plain").trim();
  if (looksLikeImageUrl(plain)) return { kind: "url", url: plain };

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
