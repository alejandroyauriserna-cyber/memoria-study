import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { getJuridicoStickerById } from "@/lib/cuaderno/sticker-juridico-packs";
import { getPngStickerById } from "@/lib/cuaderno/sticker-png-packs";
import { getStickerById } from "@/lib/cuaderno/sticker-catalog";
import { getStickerSvgDataUrl } from "@/lib/cuaderno/sticker-svg";
import { createFloatingImage, loadImageNaturalSize } from "@/lib/cuaderno/floating-image";

export type PlaceProgress = {
  percent: number;
  label: string;
};

/** Simula progreso mientras corre una promesa (solo rutas lentas con red). */
export async function withPlaceProgress<T>(
  label: string,
  onProgress: (p: PlaceProgress) => void,
  work: () => Promise<T>,
): Promise<T> {
  onProgress({ percent: 8, label });
  let pct = 8;
  const timer = window.setInterval(() => {
    pct = Math.min(88, pct + 8);
    onProgress({ percent: pct, label });
  }, 80);
  try {
    const result = await work();
    onProgress({ percent: 100, label: "Listo" });
    return result;
  } finally {
    window.clearInterval(timer);
  }
}

function withImageSizeTimeout(src: string, ms: number): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    loadImageNaturalSize(src)
      .then((size) => {
        window.clearTimeout(timer);
        resolve(size);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

export function isDisplayableImageSrc(src: string | undefined): boolean {
  if (!src) return false;
  return (
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  );
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

/** Resuelve src del sticker sin llamadas de red. */
export function resolveStickerSrcSync(item: DecorationObject): string | undefined {
  if (item.kind !== "sticker") return undefined;
  if (item.src && isDisplayableImageSrc(item.src)) return item.src;
  if (item.stickerId?.startsWith("png:")) {
    const id = item.stickerId.slice(4);
    return getJuridicoStickerById(id)?.src ?? getPngStickerById(id)?.src;
  }
  if (item.stickerId) {
    const cat = getStickerById(item.stickerId);
    if (cat) return getStickerSvgDataUrl(cat);
  }
  return undefined;
}

export function stickerNeedsNetworkResolve(item: DecorationObject): boolean {
  if (item.kind !== "sticker") return false;
  if (resolveStickerSrcSync(item)) return false;
  return Boolean(item.stickerId?.startsWith("user:"));
}

/** Colocación inmediata sin barra de progreso ni red (salvo user sticker sin URL). */
export function canPlaceInstantly(item: DecorationObject): boolean {
  if (item.kind === "postit" || (item.kind !== "sticker" && item.kind !== "image")) {
    return true;
  }
  if (item.kind === "image") {
    return Boolean(item.src && isDisplayableImageSrc(item.src));
  }
  return !stickerNeedsNetworkResolve(item);
}

/** Colocación inmediata: sin proxy ni esperar dimensiones. */
export function prepareDecorationForCanvas(item: DecorationObject): DecorationObject {
  if (item.kind === "postit" || (item.kind !== "sticker" && item.kind !== "image")) {
    return item;
  }

  if (item.kind === "image" && item.src) {
    const ar = item.aspectRatio ?? 1.33;
    const w = item.w || 0.32;
    return { ...item, aspectRatio: ar, w, h: item.h || w / ar };
  }

  if (item.kind !== "sticker") return item;

  const src = resolveStickerSrcSync(item);
  if (!src) {
    throw new Error("No se pudo resolver la imagen del sticker");
  }

  const ar = item.aspectRatio ?? 1;
  const w = item.w || 0.14;
  return { ...item, src, aspectRatio: ar, w, h: item.h || w / ar };
}

/** Ajusta proporciones cuando la imagen ya cargó (no bloquea la colocación). */
export async function refineDecorationDimensions(
  item: DecorationObject,
): Promise<Pick<DecorationObject, "w" | "h" | "aspectRatio"> | null> {
  if (item.kind !== "sticker" && item.kind !== "image") return null;
  const src = item.kind === "sticker" ? resolveStickerSrcSync(item) ?? item.src : item.src;
  if (!src) return null;

  try {
    const size = await withImageSizeTimeout(src, 4000);
    const ar = size.w / size.h || 1;
    const w = item.w || (item.kind === "image" ? 0.32 : 0.14);
    return { aspectRatio: ar, w, h: w / ar };
  } catch {
    return null;
  }
}

export async function ensureDecorationReady(
  item: DecorationObject,
  onProgress?: (p: PlaceProgress) => void,
): Promise<DecorationObject> {
  if (item.kind !== "sticker" && item.kind !== "image") {
    return item;
  }

  if (!stickerNeedsNetworkResolve(item) && item.kind === "sticker") {
    return prepareDecorationForCanvas(item);
  }

  const report = (label: string, percent: number) => onProgress?.({ label, percent });

  if (item.kind === "image" && item.src) {
    report("Cargando imagen…", 40);
    try {
      const size = await loadImageNaturalSize(item.src);
      return {
        ...item,
        w: item.w,
        h: item.w / (size.w / size.h),
        aspectRatio: size.w / size.h,
      };
    } catch {
      return prepareDecorationForCanvas(item);
    }
  }

  if (item.kind !== "sticker") return item;

  let src = item.src;
  if (item.stickerId?.startsWith("user:")) {
    const uid = item.stickerId.slice(5);
    report("Obteniendo sticker…", 30);
    src = await resolveUserStickerDisplayUrl(uid, src);
  } else {
    src = resolveStickerSrcSync(item);
  }

  if (!src) throw new Error("No se pudo resolver la imagen del sticker");

  return prepareDecorationForCanvas({ ...item, src });
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
