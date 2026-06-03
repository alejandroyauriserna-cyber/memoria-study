import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import {
  applyCornerResize,
  type ResizeCorner,
} from "@/components/cuaderno/decoration/decoration-resize";

export type DragMode = "move" | "rotate" | ResizeCorner;

export function computeDragPatch(
  snapshot: DecorationObject,
  mode: DragMode,
  dx: number,
  dy: number,
  clientX: number,
  clientY: number,
  startX: number,
  startY: number,
  layerRect: DOMRect,
): Partial<DecorationObject> {
  if (mode === "move") {
    return {
      x: Math.min(0.95, Math.max(0, snapshot.x + dx)),
      y: Math.min(0.95, Math.max(0, snapshot.y + dy)),
    };
  }
  if (mode === "rotate") {
    const cx = layerRect.left + (snapshot.x + snapshot.w / 2) * layerRect.width;
    const cy = layerRect.top + (snapshot.y + snapshot.h / 2) * layerRect.height;
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
  layerRect: DOMRect,
): void {
  if (mode === "move") {
    el.style.transform = `translate(${dx * layerRect.width}px, ${dy * layerRect.height}px) rotate(${snapshot.rotation}deg)`;
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
    layerRect,
  );
  if (patch.x != null) el.style.left = `${patch.x * 100}%`;
  if (patch.y != null) el.style.top = `${patch.y * 100}%`;
  if (patch.w != null) el.style.width = `${patch.w * 100}%`;
  if (patch.h != null) el.style.height = `${patch.h * 100}%`;
  if (patch.rotation != null) {
    el.style.transform = `rotate(${patch.rotation}deg)`;
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
