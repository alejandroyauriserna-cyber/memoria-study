import { normalizedHeightForWidth } from "@/lib/cuaderno/floating-image";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";

export type ResizeCorner = "nw" | "ne" | "sw" | "se";

const MIN_W = 0.05;
const MIN_H = 0.04;
const MAX_W = 0.95;
const MAX_H = 0.95;

function clampW(w: number) {
  return Math.min(MAX_W, Math.max(MIN_W, w));
}

function clampH(h: number) {
  return Math.min(MAX_H, Math.max(MIN_H, h));
}

function lockImageHeight(w: number, snapshot: DecorationObject): number {
  const ar = snapshot.aspectRatio ?? 1.33;
  return clampH(normalizedHeightForWidth(w, ar));
}

export function applyCornerResize(
  snapshot: DecorationObject,
  corner: ResizeCorner,
  dx: number,
  dy: number,
): Partial<DecorationObject> {
  const lockAspect = snapshot.kind === "image" || snapshot.kind === "sticker";
  let { x, y, w, h } = snapshot;

  switch (corner) {
    case "se":
      w = clampW(snapshot.w + dx);
      h = lockAspect ? lockImageHeight(w, snapshot) : clampH(snapshot.h + dy);
      break;
    case "sw":
      w = clampW(snapshot.w - dx);
      x = snapshot.x + dx;
      h = lockAspect ? lockImageHeight(w, snapshot) : clampH(snapshot.h + dy);
      break;
    case "ne":
      w = clampW(snapshot.w + dx);
      y = snapshot.y + dy;
      h = lockAspect ? lockImageHeight(w, snapshot) : clampH(snapshot.h - dy);
      break;
    case "nw":
      w = clampW(snapshot.w - dx);
      x = snapshot.x + dx;
      y = snapshot.y + dy;
      h = lockAspect ? lockImageHeight(w, snapshot) : clampH(snapshot.h - dy);
      break;
    default:
      break;
  }

  x = Math.min(0.98, Math.max(0, x));
  y = Math.min(0.98, Math.max(0, y));

  return { x, y, w, h };
}
