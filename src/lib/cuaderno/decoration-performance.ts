import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import type { ViewportBounds } from "@/hooks/use-cuaderno-viewport";
import { isInViewportBounds } from "@/hooks/use-cuaderno-viewport";

/** Umbral para activar culling agresivo */
export const DECO_PERF_THRESHOLD = 40;

export function shouldVirtualizeDecorations(count: number): boolean {
  return count >= DECO_PERF_THRESHOLD;
}

export function filterVisibleDecorations(
  items: DecorationObject[],
  bounds: ViewportBounds,
  selectedIds: string[],
  draggingIds: string[],
  enabled: boolean,
): DecorationObject[] {
  if (!enabled) return items;
  const keep = new Set([...selectedIds, ...draggingIds]);
  return items.filter((d) => keep.has(d.id) || isInViewportBounds(d, bounds));
}
