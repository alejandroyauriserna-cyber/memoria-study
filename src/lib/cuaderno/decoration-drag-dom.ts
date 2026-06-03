import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import {
  applyCornerResize,
  type ResizeCorner,
} from "@/components/cuaderno/decoration/decoration-resize";

export type DragMode = "move" | "rotate" | ResizeCorner;

export type LayerMetrics = {
  left: number;
  top: number;
  width: number;
  height: number;
};

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
): Partial<DecorationObject> {
  if (mode === "move") {
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
  return applyCornerResize(snapshot, mode, dx, dy);
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
): void {
  if (mode === "move") {
    el.style.width = "";
    el.style.height = "";
    el.style.left = "";
    el.style.top = "";
    el.style.transform = `translate(${dx * metrics.width}px, ${dy * metrics.height}px) rotate(${snapshot.rotation}deg)`;
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
  );
  if (patch.x != null) el.style.left = `${patch.x * 100}%`;
  if (patch.y != null) el.style.top = `${patch.y * 100}%`;
  if (patch.w != null) el.style.width = `${patch.w * 100}%`;
  if (patch.h != null) el.style.height = `${patch.h * 100}%`;
  if (patch.rotation != null) {
    el.style.transform = `rotate(${patch.rotation}deg)`;
  } else {
    el.style.transform = `rotate(${snapshot.rotation}deg)`;
  }
}

export function clearDragPreview(el: HTMLElement, mode: DragMode): void {
  el.style.transform = "";
  el.classList.remove("is-dragging");
  if (mode !== "move") {
    el.style.width = "";
    el.style.height = "";
    el.style.left = "";
    el.style.top = "";
  }
}
