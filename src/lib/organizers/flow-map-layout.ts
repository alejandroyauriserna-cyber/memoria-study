import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";

export type FlowProcessNode = NonNullable<StoredOrganizerContent["flowProcess"]>["nodes"][number];
export type FlowProcessEdge = NonNullable<StoredOrganizerContent["flowProcess"]>["edges"][number];

export type FlowLayoutNode = FlowProcessNode & {
  x: number;
  y: number;
  w: number;
  h: number;
};

const NODE_W = 168;
const NODE_H = 56;
const GAP_X = 48;
const GAP_Y = 72;

export function layoutFlowProcess(
  nodes: FlowProcessNode[],
  edges: FlowProcessEdge[],
): { nodes: FlowLayoutNode[]; width: number; height: number } {
  if (!nodes.length) {
    return { nodes: [], width: 400, height: 240 };
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

  const roots = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const startNodes = roots.length ? roots : [nodes[0]];

  const levels = new Map<string, number>();
  const queue = startNodes.map((node) => node.id);
  for (const id of queue) levels.set(id, 0);

  while (queue.length) {
    const current = queue.shift()!;
    const level = levels.get(current) ?? 0;
    for (const next of outgoing.get(current) ?? []) {
      const nextLevel = Math.max(levels.get(next) ?? 0, level + 1);
      if (!levels.has(next) || nextLevel > (levels.get(next) ?? 0)) {
        levels.set(next, nextLevel);
        queue.push(next);
      }
    }
  }

  for (const node of nodes) {
    if (!levels.has(node.id)) levels.set(node.id, 0);
  }

  const byLevel = new Map<number, FlowProcessNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    const group = byLevel.get(level) ?? [];
    group.push(node);
    byLevel.set(level, group);
  }

  const layoutNodes: FlowLayoutNode[] = [];
  let maxCols = 0;

  for (const [level, group] of [...byLevel.entries()].sort(([a], [b]) => a - b)) {
    maxCols = Math.max(maxCols, group.length);
    group.forEach((node, index) => {
      layoutNodes.push({
        ...node,
        x: index * (NODE_W + GAP_X),
        y: level * (NODE_H + GAP_Y),
        w: NODE_W,
        h: NODE_H,
      });
    });
  }

  const width = Math.max(480, maxCols * (NODE_W + GAP_X) + 80);
  const height = Math.max(280, byLevel.size * (NODE_H + GAP_Y) + 80);

  return { nodes: layoutNodes, width, height };
}

export function flowEdgePath(
  from: FlowLayoutNode,
  to: FlowLayoutNode,
): string {
  const x1 = from.x + from.w / 2;
  const y1 = from.y + from.h;
  const x2 = to.x + to.w / 2;
  const y2 = to.y;
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

export function convertLegacyFlowChart(
  flowChart: { start: string; end: string; steps?: string[] },
): StoredOrganizerContent["flowProcess"] {
  const labels = [flowChart.start, ...(flowChart.steps ?? []), flowChart.end].filter(Boolean);
  const nodes = labels.map((label, index) => ({
    id: `step-${index}`,
    label,
  }));
  const edges = nodes.slice(0, -1).map((node, index) => ({
    from: node.id,
    to: nodes[index + 1]!.id,
  }));

  return {
    title: "Proceso jurídico",
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.label,
    })),
    edges: edges.map((edge) => ({ from: edge.from, to: edge.to })),
  };
}
