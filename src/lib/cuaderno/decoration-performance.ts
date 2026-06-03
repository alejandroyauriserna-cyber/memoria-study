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
  selectedId: string | null,
  draggingId: string | null,
  enabled: boolean,
): DecorationObject[] {
  if (!enabled) return items;
  return items.filter(
    (d) => d.id === selectedId || d.id === draggingId || isInViewportBounds(d, bounds),
  );
}
