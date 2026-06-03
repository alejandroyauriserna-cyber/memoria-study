import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { applyResize, type ResizeHandle } from "@/lib/cuaderno/decoration-resize";

export type DragMode = "move" | "rotate" | ResizeHandle;

export type LayerMetrics = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Offset en píxeles desde la esquina superior izquierda del elemento hasta el cursor. */
export type GrabOffsetPx = { offsetX: number; offsetY: number };

export function getLayerMetrics(el: HTMLElement): LayerMetrics {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width || 1, height: r.height || 1 };
}

export function grabOffsetPxFromPointer(
  clientX: number,
  clientY: number,
  el: HTMLElement,
): GrabOffsetPx {
  const r = el.getBoundingClientRect();
  return {
    offsetX: clientX - r.left,
    offsetY: clientY - r.top,
  };
}

export function normalizedFromPointer(
  clientX: number,
  clientY: number,
  metrics: LayerMetrics,
  grab: GrabOffsetPx,
): { x: number; y: number } {
  const leftPx = clientX - grab.offsetX - metrics.left;
  const topPx = clientY - grab.offsetY - metrics.top;
  return {
    x: Math.min(0.95, Math.max(0, leftPx / metrics.width)),
    y: Math.min(0.95, Math.max(0, topPx / metrics.height)),
  };
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
    const cx = metrics.left + (snapshot.x + snapshot.w / 2) * metrics.width;
    const cy = metrics.top + (snapshot.y + snapshot.h / 2) * metrics.height;
    const angle = Math.atan2(clientY - cy, clientX - cx);
    const start = Math.atan2(startY - cy, startX - cx);
    return { rotation: snapshot.rotation + ((angle - start) * 180) / Math.PI };
  }
  return applyResize(snapshot, mode, dx, dy, proportional);
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
    const pos = normalizedFromPointer(clientX, clientY, metrics, grab);
    el.style.left = `${pos.x * 100}%`;
    el.style.top = `${pos.y * 100}%`;
    el.style.width = `${snapshot.w * 100}%`;
    el.style.height = `${snapshot.h * 100}%`;
    el.style.transform = `rotate(${snapshot.rotation}deg)`;
    return;
  }

  if (mode === "move") {
    const pos = {
      x: Math.min(0.95, Math.max(0, snapshot.x + dx)),
      y: Math.min(0.95, Math.max(0, snapshot.y + dy)),
    };
    el.style.left = `${pos.x * 100}%`;
    el.style.top = `${pos.y * 100}%`;
    el.style.width = `${snapshot.w * 100}%`;
    el.style.height = `${snapshot.h * 100}%`;
    el.style.transform = `rotate(${snapshot.rotation}deg)`;
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

export function applyGroupDragPreview(
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
    const x = Math.min(0.95, Math.max(0, snapshot.x + ddx));
    const y = Math.min(0.95, Math.max(0, snapshot.y + ddy));
    el.style.left = `${x * 100}%`;
    el.style.top = `${y * 100}%`;
    el.style.width = `${snapshot.w * 100}%`;
    el.style.height = `${snapshot.h * 100}%`;
    el.style.transform = `rotate(${snapshot.rotation}deg)`;
  }
}

export function clearDragPreview(el: HTMLElement): void {
  el.style.transform = "";
  el.style.width = "";
  el.style.height = "";
  el.style.left = "";
  el.style.top = "";
  el.classList.remove("is-dragging");
}
