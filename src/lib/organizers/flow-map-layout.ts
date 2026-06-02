import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";

export type FlowProcessNode = NonNullable<StoredOrganizerContent["flowProcess"]>["nodes"][number];
export type FlowProcessEdge = NonNullable<StoredOrganizerContent["flowProcess"]>["edges"][number];

export type FlowLayoutNode = FlowProcessNode & {
  x: number;
  y: number;
  w: number;
  h: number;
  stepIndex: number;
  prevId: string | null;
  nextId: string | null;
};

const CARD_W = 184;
const CARD_H = 88;
const GAP_X = 56;

/** Layout horizontal BPMN: pasos en fila con conectores laterales. */
export function layoutFlowProcess(
  nodes: FlowProcessNode[],
  edges: FlowProcessEdge[],
): { nodes: FlowLayoutNode[]; width: number; height: number; orderedIds: string[] } {
  if (!nodes.length) {
    return { nodes: [], width: 640, height: 200, orderedIds: [] };
  }

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const node of nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }
  for (const edge of edges) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.get(edge.from)?.push(edge.to);
  }

  const orderedIds: string[] = [];
  const visited = new Set<string>();
  let cursor = nodes.find((n) => (incoming.get(n.id) ?? 0) === 0)?.id ?? nodes[0]!.id;

  while (cursor && !visited.has(cursor)) {
    orderedIds.push(cursor);
    visited.add(cursor);
    cursor = outgoing.get(cursor)?.[0] ?? "";
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) orderedIds.push(node.id);
  }

  const layoutNodes: FlowLayoutNode[] = orderedIds.map((id, index) => {
    const node = nodes.find((n) => n.id === id)!;
    return {
      ...node,
      x: index * (CARD_W + GAP_X),
      y: 48,
      w: CARD_W,
      h: CARD_H,
      stepIndex: index,
      prevId: index > 0 ? orderedIds[index - 1]! : null,
      nextId: index < orderedIds.length - 1 ? orderedIds[index + 1]! : null,
    };
  });

  const width = Math.max(640, orderedIds.length * (CARD_W + GAP_X) + 80);
  const height = CARD_H + 96;

  return { nodes: layoutNodes, width, height, orderedIds };
}

export function computeFlowFitTransform(
  viewportW: number,
  viewportH: number,
  contentW: number,
  contentH: number,
  padding = 28,
): { x: number; y: number; scale: number } {
  if (!viewportW || !viewportH || !contentW || !contentH) {
    return { x: 24, y: 24, scale: 1 };
  }

  const scale = Math.min(
    (viewportW - padding * 2) / contentW,
    (viewportH - padding * 2) / contentH,
  );
  const clamped = Math.max(0.45, Math.min(scale, 1.65));

  return {
    x: (viewportW - contentW * clamped) / 2,
    y: (viewportH - contentH * clamped) / 2,
    scale: clamped,
  };
}

export function flowEdgePath(from: FlowLayoutNode, to: FlowLayoutNode): string {
  const x1 = from.x + from.w;
  const y1 = from.y + from.h / 2;
  const x2 = to.x;
  const y2 = to.y + to.h / 2;
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

export function convertLegacyFlowChart(
  flowChart: { start: string; end: string; steps?: string[] },
): StoredOrganizerContent["flowProcess"] {
  const labels = [flowChart.start, ...(flowChart.steps ?? []), flowChart.end].filter(Boolean);
  const nodes = labels.map((label, index) => ({
    id: `step-${index}`,
    label,
    explanation: `Paso ${index + 1} del proceso jurídico descrito en el documento.`,
  }));
  const edges = nodes.slice(0, -1).map((node, index) => ({
    from: node.id,
    to: nodes[index + 1]!.id,
  }));

  return {
    title: "Proceso jurídico",
    nodes,
    edges,
  };
}
