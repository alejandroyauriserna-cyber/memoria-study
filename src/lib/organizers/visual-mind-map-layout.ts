import dagre from "@dagrejs/dagre";
import {
  collisionRadiusForNode,
  nodeDimensions,
  styleForTier,
} from "@/lib/organizers/visual-mind-map-theme";
import type { VisualMindMap, VisualMindMapNode } from "@/lib/organizers/visual-mind-map-types";

export function layoutVisualMindMap(nodes: VisualMindMapNode[]): Pick<VisualMindMap, "nodes" | "width" | "height"> {
  const positioned = nodes.map((n) => ({ ...n }));
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    align: "UL",
    nodesep: 48,
    ranksep: 96,
    edgesep: 24,
    marginx: 80,
    marginy: 80,
  });

  for (const node of positioned) {
    const { width, height } = nodeDimensions(node);
    graph.setNode(node.id, { width, height });
  }

  for (const node of positioned) {
    if (node.parentId && positioned.some((n) => n.id === node.parentId)) {
      graph.setEdge(node.parentId, node.id);
    }
  }

  dagre.layout(graph);

  for (const node of positioned) {
    const layoutNode = graph.node(node.id);
    if (!layoutNode) continue;
    node.x = layoutNode.x;
    node.y = layoutNode.y;
  }

  const pad = 88;
  const bounds = positioned.map((node) => {
    const radius = collisionRadiusForNode(node);
    return {
      minX: node.x - radius,
      maxX: node.x + radius,
      minY: node.y - radius,
      maxY: node.y + radius,
    };
  });

  const minX = Math.min(...bounds.map((b) => b.minX));
  const maxX = Math.max(...bounds.map((b) => b.maxX));
  const minY = Math.min(...bounds.map((b) => b.minY));
  const maxY = Math.max(...bounds.map((b) => b.maxY));

  const width = Math.max(960, maxX - minX + pad * 2);
  const height = Math.max(680, maxY - minY + pad * 2);
  const offsetX = pad - minX;
  const offsetY = pad - minY;

  return {
    nodes: positioned.map((n) => ({
      ...n,
      x: n.x + offsetX,
      y: n.y + offsetY,
    })),
    width,
    height,
  };
}

export function organicEdgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature = 0.26,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx = (x1 + x2) / 2 - dy * curvature;
  const cy = (y1 + y2) / 2 + dx * curvature;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export function getMindMapEdges(nodes: VisualMindMapNode[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: Array<{
    from: VisualMindMapNode;
    to: VisualMindMapNode;
    key: string;
    kind: "hierarchy" | "relation";
  }> = [];
  const seen = new Set<string>();

  for (const node of nodes) {
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) {
        const key = `${parent.id}-${node.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push({ from: parent, to: node, key, kind: "hierarchy" });
        }
      }
    }

    for (const relId of node.relatedIds) {
      const target = byId.get(relId);
      if (!target || target.id === node.id) continue;
      const key = [node.id, relId].sort().join("-");
      if (seen.has(key)) continue;
      if (node.parentId === relId || target.parentId === node.id) continue;
      seen.add(key);
      edges.push({ from: node, to: target, key, kind: "relation" });
    }
  }

  return edges;
}

export function edgeAnchors(from: VisualMindMapNode, to: VisualMindMapNode) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const fromDim = nodeDimensions(from);
  const toDim = nodeDimensions(to);
  const fromOffset = fromDim.width * 0.48;
  const toOffset = toDim.width * 0.48;

  return {
    x1: from.x + nx * fromOffset,
    y1: from.y + ny * fromOffset * 0.35,
    x2: to.x - nx * toOffset,
    y2: to.y - ny * toOffset * 0.35,
  };
}

export function particleAlongPath(path: string, progress: number) {
  if (typeof document === "undefined") return { x: 0, y: 0 };
  const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svgPath.setAttribute("d", path);
  const length = svgPath.getTotalLength();
  const point = svgPath.getPointAtLength(length * progress);
  return { x: point.x, y: point.y };
}
