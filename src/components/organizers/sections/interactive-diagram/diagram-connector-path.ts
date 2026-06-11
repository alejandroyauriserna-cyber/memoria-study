import type { LayoutNode } from "@/lib/organizers/visual-ai-diagram/compute-diagram-layout";

export function diagramConnectorPath(from: LayoutNode, to: LayoutNode) {
  const x1 = from.x + from.w / 2;
  const y1 = from.y + from.h;
  const x2 = to.x + to.w / 2;
  const y2 = to.y;
  const dy = Math.abs(y2 - y1);
  const curve = Math.max(40, dy * 0.45);
  const c1y = y1 + curve;
  const c2y = y2 - curve;
  return `M${x1},${y1} C${x1},${c1y} ${x2},${c2y} ${x2},${y2}`;
}

export function diagramRadialPath(from: LayoutNode, to: LayoutNode) {
  const x1 = from.x + from.w / 2;
  const y1 = from.y + from.h / 2;
  const x2 = to.x + to.w / 2;
  const y2 = to.y + to.h / 2;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}
