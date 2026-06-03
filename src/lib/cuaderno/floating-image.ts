import {
  decorationId,
  type DecorationObject,
  type ImageTextWrap,
} from "@/lib/cuaderno/decoration-objects";

/** Relación ancho/alto del contenedor del papel (aprox. A4 vertical). */
export const PAPER_ASPECT_WH = 0.72;

export function loadImageNaturalSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

export function normalizedHeightForWidth(w: number, aspectRatio: number): number {
  return Math.min(0.85, Math.max(0.06, (w * PAPER_ASPECT_WH) / aspectRatio));
}

export function createFloatingImage(
  src: string,
  at?: { x: number; y: number },
  natural?: { w: number; h: number },
): DecorationObject {
  const aspectRatio = natural && natural.h > 0 ? natural.w / natural.h : 1.33;
  const w = 0.32;
  const h = normalizedHeightForWidth(w, aspectRatio);
  const x = at?.x ?? 0.34;
  const y = at?.y ?? 0.28;
  return {
    id: decorationId(),
    kind: "image",
    x: Math.min(0.92, Math.max(0.02, x - w / 2)),
    y: Math.min(0.92, Math.max(0.02, y - h / 2)),
    w,
    h,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    src,
    aspectRatio,
    textWrap: "inFront",
  };
}

export function isBehindTextWrap(wrap?: ImageTextWrap): boolean {
  return wrap === "behind";
}
