import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";

/** Zona útil del papel (evita encabezado/márgenes del lienzo). */
export const PAPER_CONTENT_BOUNDS = {
  left: 0.04,
  top: 0.12,
  right: 0.92,
  bottom: 0.9,
} as const;

export const MAX_IMAGE_HEIGHT_NORM = 0.48;

export function clampDecorationToContentArea(item: DecorationObject): DecorationObject {
  const w = item.w;
  const h = item.h;
  const maxX = PAPER_CONTENT_BOUNDS.right - w;
  const maxY = PAPER_CONTENT_BOUNDS.bottom - h;
  return {
    ...item,
    x: Math.min(maxX, Math.max(PAPER_CONTENT_BOUNDS.left, item.x)),
    y: Math.min(maxY, Math.max(PAPER_CONTENT_BOUNDS.top, item.y)),
  };
}

/** Centro visible del viewport mapeado al área de contenido. */
export function visibleContentCenterNorm(
  viewportRect: DOMRect | null,
  paperRect: DOMRect | null,
): { x: number; y: number } {
  if (!viewportRect || !paperRect || paperRect.width < 1 || paperRect.height < 1) {
    return { x: 0.38, y: 0.42 };
  }
  const cx = (viewportRect.left + viewportRect.right) / 2;
  const cy = (viewportRect.top + viewportRect.bottom) / 2;
  return {
    x: Math.min(
      PAPER_CONTENT_BOUNDS.right - 0.08,
      Math.max(PAPER_CONTENT_BOUNDS.left + 0.08, (cx - paperRect.left) / paperRect.width),
    ),
    y: Math.min(
      PAPER_CONTENT_BOUNDS.bottom - 0.08,
      Math.max(PAPER_CONTENT_BOUNDS.top + 0.08, (cy - paperRect.top) / paperRect.height),
    ),
  };
}
