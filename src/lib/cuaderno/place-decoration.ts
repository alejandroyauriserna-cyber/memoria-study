import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { getPngStickerById } from "@/lib/cuaderno/sticker-png-packs";
import { getStickerById } from "@/lib/cuaderno/sticker-catalog";
import { getStickerSvgDataUrl } from "@/lib/cuaderno/sticker-svg";
import { createFloatingImage, loadImageNaturalSize } from "@/lib/cuaderno/floating-image";

export type PlaceProgress = {
  percent: number;
  label: string;
};

/** Simula progreso mientras corre una promesa (útil para subidas/resolución). */
export async function withPlaceProgress<T>(
  label: string,
  onProgress: (p: PlaceProgress) => void,
  work: () => Promise<T>,
): Promise<T> {
  onProgress({ percent: 8, label });
  let pct = 8;
  const timer = window.setInterval(() => {
    pct = Math.min(88, pct + 6);
    onProgress({ percent: pct, label });
  }, 120);
  try {
    const result = await work();
    onProgress({ percent: 100, label: "Listo" });
    return result;
  } finally {
    window.clearInterval(timer);
  }
}

export function isDisplayableImageSrc(src: string | undefined): boolean {
  if (!src) return false;
  return src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/");
}

export async function resolveUserStickerDisplayUrl(
  userStickerId: string,
  imageUrlOrPath?: string,
): Promise<string> {
  if (imageUrlOrPath && isDisplayableImageSrc(imageUrlOrPath)) return imageUrlOrPath;
  const res = await fetch(`/api/cuaderno/stickers/library?id=${encodeURIComponent(userStickerId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo cargar el sticker");
  const url = data.sticker?.imageUrl as string | undefined;
  if (!url) throw new Error("Sticker sin imagen");
  return url;
}

export async function ensureDecorationReady(
  item: DecorationObject,
  onProgress?: (p: PlaceProgress) => void,
): Promise<DecorationObject> {
  const report = (label: string, percent: number) => onProgress?.({ label, percent });

  if (item.kind === "image" && item.src) {
    report("Cargando imagen…", 40);
    try {
      const size = await loadImageNaturalSize(item.src);
      return { ...item, w: item.w, h: item.w / (size.w / size.h), aspectRatio: size.w / size.h };
    } catch {
      return item;
    }
  }

  if (item.kind !== "sticker") return item;

  let src = item.src;
  if (item.stickerId?.startsWith("user:")) {
    const uid = item.stickerId.slice(5);
    report("Obteniendo sticker…", 25);
    src = await resolveUserStickerDisplayUrl(uid, src);
  } else if (!src && item.stickerId?.startsWith("png:")) {
    src = getPngStickerById(item.stickerId.slice(4))?.src;
  } else if (!src && item.stickerId) {
    const cat = getStickerById(item.stickerId);
    if (cat) src = getStickerSvgDataUrl(cat);
  }

  if (!src) throw new Error("No se pudo resolver la imagen del sticker");

  if (src.startsWith("http://") || src.startsWith("https://")) {
    report("Descargando sticker…", 55);
    try {
      src = await imageUrlToDataUrl(src);
    } catch {
      /* usar URL remota si el proxy falla */
    }
  }

  report("Preparando…", 70);
  try {
    const size = await loadImageNaturalSize(src);
    const ar = size.w / size.h || 1;
    const w = item.w || 0.14;
    return { ...item, src, aspectRatio: ar, w, h: w / ar };
  } catch {
    return { ...item, src, aspectRatio: item.aspectRatio ?? 1 };
  }
}

export async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch("/api/cuaderno/images/fetch-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo importar la imagen");
  return data.dataUrl as string;
}

export async function buildFloatingImageFromUrl(
  url: string,
  at: { x: number; y: number },
): Promise<DecorationObject> {
  const dataUrl = await imageUrlToDataUrl(url);
  try {
    const size = await loadImageNaturalSize(dataUrl);
    return createFloatingImage(dataUrl, at, size);
  } catch {
    return createFloatingImage(dataUrl, at);
  }
}
