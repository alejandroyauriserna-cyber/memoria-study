import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";

const MARGIN = 0.02;

/** Mantiene la decoración dentro del papel (sin zona prohibida superior). */
export function clampDecorationToPaper(item: DecorationObject): DecorationObject {
  const maxX = Math.max(MARGIN, 1 - MARGIN - item.w);
  const maxY = Math.max(MARGIN, 1 - MARGIN - item.h);
  return {
    ...item,
    x: Math.min(maxX, Math.max(MARGIN, item.x)),
    y: Math.min(maxY, Math.max(MARGIN, item.y)),
  };
}

/** Centro del viewport visible sobre el papel (libre, sin franja fija). */
export function visiblePaperCenterNorm(
  viewportRect: DOMRect | null,
  paperRect: DOMRect | null,
): { x: number; y: number } {
  if (!viewportRect || !paperRect || paperRect.width < 1 || paperRect.height < 1) {
    return { x: 0.4, y: 0.45 };
  }
  const cx = (viewportRect.left + viewportRect.right) / 2;
  const cy = (viewportRect.top + viewportRect.bottom) / 2;
  return {
    x: Math.min(0.95, Math.max(0.05, (cx - paperRect.left) / paperRect.width)),
    y: Math.min(0.95, Math.max(0.05, (cy - paperRect.top) / paperRect.height)),
  };
}
