import { normalizedHeightForWidth } from "@/lib/cuaderno/floating-image";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";

export type ResizeCorner = "nw" | "ne" | "sw" | "se";
export type ResizeEdge = "n" | "s" | "e" | "w";
export type ResizeHandle = ResizeCorner | ResizeEdge;

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

function lockAspectBox(
  snapshot: DecorationObject,
  w: number,
  anchor: "nw" | "ne" | "sw" | "se",
): { x: number; y: number; w: number; h: number } {
  const h = lockImageHeight(w, snapshot);
  let x = snapshot.x;
  let y = snapshot.y;
  if (anchor.includes("w")) x = snapshot.x + snapshot.w - w;
  if (anchor.includes("n")) y = snapshot.y + snapshot.h - h;
  return { x, y, w, h };
}

export function applyResize(
  snapshot: DecorationObject,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  proportional = false,
): Partial<DecorationObject> {
  const lockAspect =
    snapshot.kind === "image" || snapshot.kind === "sticker" || proportional;
  let { x, y, w, h } = snapshot;

  const corner = handle as ResizeCorner;
  if (["nw", "ne", "sw", "se"].includes(handle)) {
    switch (corner) {
      case "se": {
        w = clampW(snapshot.w + dx);
        if (lockAspect) {
          ({ x, y, w, h } = lockAspectBox(snapshot, w, "se"));
        } else {
          h = clampH(snapshot.h + dy);
        }
        break;
      }
      case "sw": {
        w = clampW(snapshot.w - dx);
        if (lockAspect) {
          ({ x, y, w, h } = lockAspectBox(snapshot, w, "sw"));
        } else {
          x = snapshot.x + dx;
          h = clampH(snapshot.h + dy);
        }
        break;
      }
      case "ne": {
        w = clampW(snapshot.w + dx);
        if (lockAspect) {
          ({ x, y, w, h } = lockAspectBox(snapshot, w, "ne"));
        } else {
          y = snapshot.y + dy;
          h = clampH(snapshot.h - dy);
        }
        break;
      }
      case "nw": {
        w = clampW(snapshot.w - dx);
        if (lockAspect) {
          ({ x, y, w, h } = lockAspectBox(snapshot, w, "nw"));
        } else {
          x = snapshot.x + dx;
          y = snapshot.y + dy;
          h = clampH(snapshot.h - dy);
        }
        break;
      }
      default:
        break;
    }
  } else if (handle === "e") {
    w = clampW(snapshot.w + dx);
    if (lockAspect) ({ x, y, w, h } = lockAspectBox(snapshot, w, "se"));
  } else if (handle === "w") {
    w = clampW(snapshot.w - dx);
    if (lockAspect) {
      ({ x, y, w, h } = lockAspectBox(snapshot, w, "sw"));
    } else {
      x = snapshot.x + dx;
    }
  } else if (handle === "s") {
    h = lockAspect ? lockImageHeight(snapshot.w, snapshot) : clampH(snapshot.h + dy);
  } else if (handle === "n") {
    if (lockAspect) {
      const nextH = lockImageHeight(snapshot.w, snapshot);
      y = snapshot.y + snapshot.h - nextH;
      h = nextH;
    } else {
      y = snapshot.y + dy;
      h = clampH(snapshot.h - dy);
    }
  }

  x = Math.min(0.98, Math.max(0, x));
  y = Math.min(0.98, Math.max(0, y));

  return { x, y, w, h };
}

/** @deprecated Use applyResize */
export function applyCornerResize(
  snapshot: DecorationObject,
  corner: ResizeCorner,
  dx: number,
  dy: number,
): Partial<DecorationObject> {
  return applyResize(snapshot, corner, dx, dy);
}
