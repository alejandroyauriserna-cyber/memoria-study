import {
  collisionRadiusForNode,
  styleForTier,
} from "@/lib/organizers/visual-mind-map-theme";
import type { VisualMindMap, VisualMindMapNode } from "@/lib/organizers/visual-mind-map-types";

const CX = 420;
const CY = 340;
const TOPIC_RADIUS_BASE = 168;
const DETAIL_RADIUS = 92;

function nodeRadius(label: string, tier: VisualMindMapNode["tier"]) {
  return collisionRadiusForNode(label, tier);
}

export function resolveMindMapCollisions(
  nodes: Array<{
    id: string;
    label: string;
    tier: VisualMindMapNode["tier"];
    parentId?: string;
    x: number;
    y: number;
  }>,
  center: { x: number; y: number },
  iterations = 120,
) {
  const centerNode = nodes.find((n) => n.tier === "center");
  const centerR = centerNode
    ? nodeRadius(centerNode.label, "center")
    : styleForTier("center").collisionRadius;

  for (let iter = 0; iter < iterations; iter += 1) {
    let moved = false;

    for (const node of nodes) {
      if (node.tier === "center") continue;
      const dx = node.x - center.x;
      const dy = node.y - center.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const minFromCenter = centerR + nodeRadius(node.label, node.tier) + 22;
      if (dist < minFromCenter) {
        const push = (minFromCenter - dist) / dist;
        node.x += dx * push;
        node.y += dy * push;
        moved = true;
      }
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const sibling = a.parentId && a.parentId === b.parentId;
        const required =
          nodeRadius(a.label, a.tier) * 0.5 +
          nodeRadius(b.label, b.tier) * 0.5 +
          (sibling ? 16 : 28);
        if (dist < required) {
          const push = (required - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
          moved = true;
        }
      }
    }

    if (!moved) break;
  }
}

export function layoutVisualMindMap(nodes: VisualMindMapNode[]): Pick<VisualMindMap, "nodes" | "width" | "height"> {
  const topics = nodes.filter((n) => n.tier === "topic" || (n.tier === "subtopic" && n.parentId === "center"));
  const details = nodes.filter((n) => n.tier === "detail" || (n.tier === "subtopic" && n.parentId !== "center"));

  const positioned = nodes.map((n) => ({ ...n }));

  const centerNode = positioned.find((n) => n.tier === "center");
  if (centerNode) {
    centerNode.x = CX;
    centerNode.y = CY;
  }

  const topicRadius = TOPIC_RADIUS_BASE + Math.max(0, topics.length - 5) * 10;

  topics.forEach((topic, index) => {
    const angle = (index / Math.max(topics.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const node = positioned.find((n) => n.id === topic.id);
    if (!node) return;
    node.x = CX + Math.cos(angle) * topicRadius;
    node.y = CY + Math.sin(angle) * topicRadius;
  });

  for (const topic of topics) {
    const children = details.filter((d) => d.parentId === topic.id);
    const parent = positioned.find((n) => n.id === topic.id);
    if (!parent || !children.length) continue;

    const parentAngle = Math.atan2(parent.y - CY, parent.x - CX);
    const spread = Math.min(Math.PI * 0.75, children.length * 0.38 + 0.28);
    const start = parentAngle - spread / 2;

    children.forEach((child, index) => {
      const node = positioned.find((n) => n.id === child.id);
      if (!node) return;
      const t = children.length === 1 ? 0.5 : index / (children.length - 1);
      const angle = start + t * spread;
      node.x = parent.x + Math.cos(angle) * DETAIL_RADIUS;
      node.y = parent.y + Math.sin(angle) * DETAIL_RADIUS;
    });
  }

  resolveMindMapCollisions(
    positioned.map((n) => ({
      id: n.id,
      label: n.label,
      tier: n.tier,
      parentId: n.parentId,
      x: n.x,
      y: n.y,
    })),
    { x: CX, y: CY },
  );

  const pad = 72;
  const xs = positioned.map((n) => n.x);
  const ys = positioned.map((n) => n.y);
  const radii = positioned.map((n) => nodeRadius(n.label, n.tier));

  const minX = Math.min(...xs.map((x, i) => x - radii[i]!));
  const maxX = Math.max(...xs.map((x, i) => x + radii[i]!));
  const minY = Math.min(...ys.map((y, i) => y - radii[i]!));
  const maxY = Math.max(...ys.map((y, i) => y + radii[i]!));

  const width = Math.max(820, maxX - minX + pad * 2);
  const height = Math.max(620, maxY - minY + pad * 2);
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
  const edges: Array<{ from: VisualMindMapNode; to: VisualMindMapNode; key: string; kind: "hierarchy" | "relation" }> = [];
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
