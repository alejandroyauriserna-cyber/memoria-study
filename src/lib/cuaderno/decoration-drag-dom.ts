import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { applyResize, type ResizeHandle } from "@/lib/cuaderno/decoration-resize";

export type DragMode = "move" | "rotate" | ResizeHandle;

export const DRAG_MOVE_THRESHOLD_PX = 5;

export type LayerMetrics = {
  /** Viewport (getBoundingClientRect) */
  left: number;
  top: number;
  /** Layout box (offsetWidth/Height) — coincide con % left/top del layer */
  width: number;
  height: number;
  /** viewport / layout — p. ej. zoom CSS scale() del papel */
  scaleX: number;
  scaleY: number;
};

/** Offset en píxeles de layout desde la esquina del elemento hasta el cursor. */
export type GrabOffsetPx = { offsetX: number; offsetY: number };

function layoutScale(el: HTMLElement, rect: DOMRect) {
  const w = el.offsetWidth || rect.width || 1;
  const h = el.offsetHeight || rect.height || 1;
  return {
    width: w,
    height: h,
    scaleX: w > 0 ? rect.width / w : 1,
    scaleY: h > 0 ? rect.height / h : 1,
  };
}

export function getLayerMetrics(el: HTMLElement): LayerMetrics {
  const r = el.getBoundingClientRect();
  const layout = layoutScale(el, r);
  return { left: r.left, top: r.top, ...layout };
}

export function grabOffsetPxFromPointer(
  clientX: number,
  clientY: number,
  el: HTMLElement,
): GrabOffsetPx {
  const r = el.getBoundingClientRect();
  const { scaleX, scaleY } = layoutScale(el, r);
  return {
    offsetX: (clientX - r.left) / scaleX,
    offsetY: (clientY - r.top) / scaleY,
  };
}

export function normalizedFromPointer(
  clientX: number,
  clientY: number,
  metrics: LayerMetrics,
  grab: GrabOffsetPx,
): { x: number; y: number } {
  const leftPx = (clientX - metrics.left) / metrics.scaleX - grab.offsetX;
  const topPx = (clientY - metrics.top) / metrics.scaleY - grab.offsetY;
  return {
    x: Math.min(0.95, Math.max(0, leftPx / metrics.width)),
    y: Math.min(0.95, Math.max(0, topPx / metrics.height)),
  };
}

/** Fija left/top/transform en DOM antes de quitar el preview (evita salto al soltar). */
export function bakeDecorationPosition(
  el: HTMLElement,
  item: Pick<DecorationObject, "x" | "y" | "rotation">,
): void {
  el.style.left = `${item.x * 100}%`;
  el.style.top = `${item.y * 100}%`;
  el.style.transform = `rotate(${item.rotation}deg)`;
}

/** Fija caja completa (move/resize) antes de quitar preview inline. */
export function bakeDecorationGeometry(
  el: HTMLElement,
  item: Pick<DecorationObject, "x" | "y" | "w" | "h" | "rotation">,
): void {
  el.style.left = `${item.x * 100}%`;
  el.style.top = `${item.y * 100}%`;
  el.style.width = `${item.w * 100}%`;
  el.style.height = `${item.h * 100}%`;
  el.style.transform = `rotate(${item.rotation}deg)`;
}

export function computeDragPatch(
  snapshot: DecorationObject,
  mode: DragMode,
  dx: number,
  dy: number,
  clientX: number,
  clientY: number,
  startX: number,
  startY: number,
  metrics: LayerMetrics,
  grab?: GrabOffsetPx,
  proportional = false,
): Partial<DecorationObject> {
  if (mode === "move") {
    if (grab) return normalizedFromPointer(clientX, clientY, metrics, grab);
    return {
      x: Math.min(0.95, Math.max(0, snapshot.x + dx)),
      y: Math.min(0.95, Math.max(0, snapshot.y + dy)),
    };
  }
  if (mode === "rotate") {
    const cx = metrics.left + (snapshot.x + snapshot.w / 2) * metrics.width * metrics.scaleX;
    const cy = metrics.top + (snapshot.y + snapshot.h / 2) * metrics.height * metrics.scaleY;
    const angle = Math.atan2(clientY - cy, clientX - cx);
    const start = Math.atan2(startY - cy, startX - cx);
    return { rotation: snapshot.rotation + ((angle - start) * 180) / Math.PI };
  }
  return applyResize(snapshot, mode, dx, dy, proportional);
}

/** Solo translate3d — no toca left/top/width/height (evita encogimiento en drag). */
export function applyDragPreviewMove(
  el: HTMLElement,
  snapshot: DecorationObject,
  clientX: number,
  clientY: number,
  metrics: LayerMetrics,
  grab: GrabOffsetPx,
): void {
  const pos = normalizedFromPointer(clientX, clientY, metrics, grab);
  const dxPx = (pos.x - snapshot.x) * metrics.width;
  const dyPx = (pos.y - snapshot.y) * metrics.height;
  el.style.transform = `translate3d(${dxPx}px, ${dyPx}px, 0) rotate(${snapshot.rotation}deg)`;
}

export function applyGroupDragPreviewMove(
  elements: { el: HTMLElement; snapshot: DecorationObject }[],
  clientX: number,
  clientY: number,
  metrics: LayerMetrics,
  grab: GrabOffsetPx,
  leadSnapshot: DecorationObject,
): void {
  const leadPos = normalizedFromPointer(clientX, clientY, metrics, grab);
  const ddx = leadPos.x - leadSnapshot.x;
  const ddy = leadPos.y - leadSnapshot.y;
  for (const { el, snapshot } of elements) {
    const dxPx = ddx * metrics.width;
    const dyPx = ddy * metrics.height;
    el.style.transform = `translate3d(${dxPx}px, ${dyPx}px, 0) rotate(${snapshot.rotation}deg)`;
  }
}

export function applyDragPreview(
  el: HTMLElement,
  snapshot: DecorationObject,
  mode: DragMode,
  dx: number,
  dy: number,
  clientX: number,
  clientY: number,
  startX: number,
  startY: number,
  metrics: LayerMetrics,
  grab?: GrabOffsetPx,
  proportional = false,
): void {
  if (mode === "move" && grab) {
    applyDragPreviewMove(el, snapshot, clientX, clientY, metrics, grab);
    return;
  }

  const patch = computeDragPatch(
    snapshot,
    mode,
    dx,
    dy,
    clientX,
    clientY,
    startX,
    startY,
    metrics,
    grab,
    proportional,
  );
  if (patch.x != null) el.style.left = `${patch.x * 100}%`;
  if (patch.y != null) el.style.top = `${patch.y * 100}%`;
  if (patch.w != null) el.style.width = `${patch.w * 100}%`;
  if (patch.h != null) el.style.height = `${patch.h * 100}%`;
  el.style.transform = `rotate(${patch.rotation ?? snapshot.rotation}deg)`;
}

export function clearDragPreview(el: HTMLElement, mode?: DragMode): void {
  el.style.transform = "";
  if (mode !== "move") {
    el.style.width = "";
    el.style.height = "";
    el.style.left = "";
    el.style.top = "";
  }
  el.classList.remove("is-dragging");
}
