import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { applyResize, type ResizeHandle } from "@/lib/cuaderno/decoration-resize";

export type DragMode = "move" | "rotate" | ResizeHandle;

export type LayerMetrics = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type GrabOffset = { x: number; y: number };

export function getLayerMetrics(el: HTMLElement): LayerMetrics {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width || 1, height: r.height || 1 };
}

export function pointerToNormalized(
  clientX: number,
  clientY: number,
  metrics: LayerMetrics,
): { nx: number; ny: number } {
  return {
    nx: Math.min(0.98, Math.max(0, (clientX - metrics.left) / metrics.width)),
    ny: Math.min(0.98, Math.max(0, (clientY - metrics.top) / metrics.height)),
  };
}

export function grabOffsetFromPointer(
  clientX: number,
  clientY: number,
  snapshot: DecorationObject,
  metrics: LayerMetrics,
): GrabOffset {
  const p = pointerToNormalized(clientX, clientY, metrics);
  return { x: p.nx - snapshot.x, y: p.ny - snapshot.y };
}

export function movePositionFromPointer(
  clientX: number,
  clientY: number,
  metrics: LayerMetrics,
  grab: GrabOffset,
): { x: number; y: number } {
  const p = pointerToNormalized(clientX, clientY, metrics);
  return {
    x: Math.min(0.95, Math.max(0, p.nx - grab.x)),
    y: Math.min(0.95, Math.max(0, p.ny - grab.y)),
  };
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
  grab?: GrabOffset,
  proportional = false,
): Partial<DecorationObject> {
  if (mode === "move") {
    if (grab) return movePositionFromPointer(clientX, clientY, metrics, grab);
    return {
      x: Math.min(0.95, Math.max(0, snapshot.x + dx)),
      y: Math.min(0.95, Math.max(0, snapshot.y + dy)),
    };
  }
  if (mode === "rotate") {
    const cx = metrics.left + (snapshot.x + snapshot.w / 2) * metrics.width;
    const cy = metrics.top + (snapshot.y + snapshot.h / 2) * metrics.height;
    const angle = Math.atan2(clientY - cy, clientX - cx);
    const start = Math.atan2(startY - cy, startX - cx);
    return { rotation: snapshot.rotation + ((angle - start) * 180) / Math.PI };
  }
  return applyResize(snapshot, mode, dx, dy, proportional);
}

/** Vista previa del drag solo en DOM — sin setState de React. */
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
  grab?: GrabOffset,
  proportional = false,
): void {
  if (mode === "move") {
    const pos = grab
      ? movePositionFromPointer(clientX, clientY, metrics, grab)
      : { x: snapshot.x + dx, y: snapshot.y + dy };
    const dxPx = (pos.x - snapshot.x) * metrics.width;
    const dyPx = (pos.y - snapshot.y) * metrics.height;
    el.style.width = "";
    el.style.height = "";
    el.style.left = "";
    el.style.top = "";
    el.style.transform = `translate3d(${dxPx}px, ${dyPx}px, 0) rotate(${snapshot.rotation}deg)`;
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

export function clearDragPreview(el: HTMLElement): void {
  el.style.transform = "";
  el.style.width = "";
  el.style.height = "";
  el.style.left = "";
  el.style.top = "";
  el.classList.remove("is-dragging");
}
