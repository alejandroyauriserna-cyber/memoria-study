import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";

export type NormRect = { x1: number; y1: number; x2: number; y2: number };

export function normRectFromPoints(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): NormRect {
  return {
    x1: Math.min(ax, bx),
    y1: Math.min(ay, by),
    x2: Math.max(ax, bx),
    y2: Math.max(ay, by),
  };
}

export function clientToNormalized(
  clientX: number,
  clientY: number,
  paperRect: DOMRect,
): { x: number; y: number } {
  return {
    x: Math.min(1, Math.max(0, (clientX - paperRect.left) / paperRect.width)),
    y: Math.min(1, Math.max(0, (clientY - paperRect.top) / paperRect.height)),
  };
}

export function decorationIntersectsRect(d: DecorationObject, r: NormRect): boolean {
  const dx2 = d.x + d.w;
  const dy2 = d.y + d.h;
  return d.x < r.x2 && dx2 > r.x1 && d.y < r.y2 && dy2 > r.y1;
}

export function domRectIntersectsNormRect(dom: DOMRect, paper: DOMRect, r: NormRect): boolean {
  const x1 = (dom.left - paper.left) / paper.width;
  const y1 = (dom.top - paper.top) / paper.height;
  const x2 = (dom.right - paper.left) / paper.width;
  const y2 = (dom.bottom - paper.top) / paper.height;
  return x1 < r.x2 && x2 > r.x1 && y1 < r.y2 && y2 > r.y1;
}

export function groupBounds(items: DecorationObject[]): NormRect | null {
  if (!items.length) return null;
  let x1 = 1;
  let y1 = 1;
  let x2 = 0;
  let y2 = 0;
  for (const d of items) {
    x1 = Math.min(x1, d.x);
    y1 = Math.min(y1, d.y);
    x2 = Math.max(x2, d.x + d.w);
    y2 = Math.max(y2, d.y + d.h);
  }
  return { x1, y1, x2, y2 };
}
