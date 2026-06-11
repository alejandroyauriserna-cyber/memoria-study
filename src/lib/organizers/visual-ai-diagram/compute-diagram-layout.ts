import dagre from "@dagrejs/dagre";
import {
  NODE_TIER_SIZE,
  type NodeTier,
} from "@/lib/organizers/visual-ai-diagram/diagram-theme";
import {
  extractComparisonData,
  extractConceptMapData,
  extractMindMapData,
  extractTimelineData,
  type DiagramEdge,
} from "@/lib/organizers/visual-ai-diagram/extract-diagram-data";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";
import type { OrganizerContent } from "@/lib/organizers/parse-content";

export type LayoutNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tier: NodeTier;
  parentId?: string;
  groupId?: string;
};

export type LayoutEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type DiagramLayout = {
  formatId: VisualAiFormatId;
  title: string;
  subtitle: string;
  width: number;
  height: number;
  nodes: LayoutNode[];
  edges: LayoutEdge[];
};

function conceptMapTier(nodeId: string, edges: DiagramEdge[]): NodeTier {
  if (nodeId === "root") return "root";
  if (edges.some((e) => e.from === "root" && e.to === nodeId)) return "primary";
  const childCount = edges.filter((e) => e.from === nodeId).length;
  return childCount > 0 ? "secondary" : "tertiary";
}

function layoutConceptMap(data: ReturnType<typeof extractConceptMapData>): DiagramLayout {
  const width = 1200;
  const height = 1200;
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 88, ranksep: 112, marginx: 72, marginy: 56 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of data.nodes) {
    const tier = conceptMapTier(node.id, data.edges);
    const spec = NODE_TIER_SIZE[tier];
    g.setNode(node.id, { width: spec.w + 16, height: spec.h + 20, label: node.label });
  }
  for (const edge of data.edges) {
    if (g.hasNode(edge.from) && g.hasNode(edge.to)) {
      g.setEdge(edge.from, edge.to, { label: edge.label ?? "" });
    }
  }

  dagre.layout(g);

  let minX = Infinity;
  let minY = Infinity;
  g.nodes().forEach((id) => {
    const n = g.node(id);
    minX = Math.min(minX, n.x - n.width / 2);
    minY = Math.min(minY, n.y - n.height / 2);
  });

  const offsetX = 56 - minX;
  const offsetY = 176 - minY;

  const nodes: LayoutNode[] = data.nodes
    .map((node) => {
      const pos = g.node(node.id);
      if (!pos) return null;
      const tier = conceptMapTier(node.id, data.edges);
      const spec = NODE_TIER_SIZE[tier];
      const parentEdge = data.edges.find((e) => e.to === node.id);
      return {
        id: node.id,
        label: node.label,
        x: pos.x - spec.w / 2 + offsetX,
        y: pos.y - spec.h / 2 + offsetY,
        w: spec.w,
        h: spec.h,
        tier,
        parentId: parentEdge?.from,
        groupId: parentEdge?.from ?? node.id,
      };
    })
    .filter(Boolean) as LayoutNode[];

  const edges: LayoutEdge[] = data.edges
    .filter((e) => g.hasNode(e.from) && g.hasNode(e.to))
    .map((edge, index) => ({ id: `edge-${index}`, from: edge.from, to: edge.to, label: edge.label }));

  return {
    formatId: "conceptMap",
    title: data.title,
    subtitle: "Mapa conceptual interactivo",
    width,
    height,
    nodes,
    edges,
  };
}

function layoutMindMap(data: ReturnType<typeof extractMindMapData>): DiagramLayout {
  const width = 1200;
  const height = 1200;
  const cx = width / 2;
  const cy = height / 2 + 48;
  const r1 = 280;
  const r2 = 440;
  const rootSpec = NODE_TIER_SIZE.root;
  const nodes: LayoutNode[] = [
    {
      id: "root",
      label: data.title,
      x: cx - rootSpec.w / 2,
      y: cy - rootSpec.h / 2,
      w: rootSpec.w,
      h: rootSpec.h,
      tier: "root",
      groupId: "root",
    },
  ];
  const edges: LayoutEdge[] = [];
  const count = Math.max(data.branches.length, 1);

  data.branches.forEach((branch, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    const px = cx + r1 * Math.cos(angle);
    const py = cy + r1 * Math.sin(angle);
    const primary = NODE_TIER_SIZE.primary;
    nodes.push({
      id: branch.id,
      label: branch.label,
      x: px - primary.w / 2,
      y: py - primary.h / 2,
      w: primary.w,
      h: primary.h,
      tier: "primary",
      parentId: "root",
      groupId: branch.id,
    });
    edges.push({ id: `edge-root-${branch.id}`, from: "root", to: branch.id });

    branch.children.forEach((child, childIndex) => {
      const spread = 0.32;
      const childAngle = angle + (childIndex - (branch.children.length - 1) / 2) * spread;
      const cpx = cx + r2 * Math.cos(childAngle);
      const cpy = cy + r2 * Math.sin(childAngle);
      const tertiary = NODE_TIER_SIZE.tertiary;
      const childId = `${branch.id}-child-${childIndex}`;
      nodes.push({
        id: childId,
        label: child,
        x: cpx - tertiary.w / 2,
        y: cpy - tertiary.h / 2,
        w: tertiary.w,
        h: tertiary.h,
        tier: "tertiary",
        parentId: branch.id,
        groupId: branch.id,
      });
      edges.push({ id: `edge-${branch.id}-${childId}`, from: branch.id, to: childId, label: "subtema" });
    });
  });

  return {
    formatId: "mindMap",
    title: data.title,
    subtitle: "Mapa mental interactivo",
    width,
    height,
    nodes,
    edges,
  };
}

function layoutTimeline(data: ReturnType<typeof extractTimelineData>): DiagramLayout {
  const width = 1440;
  const height = 820;
  const yAxis = 400;
  const margin = 96;
  const usable = width - margin * 2;
  const step = usable / Math.max(data.events.length, 1);
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  data.events.forEach((event, index) => {
    const x = margin + step * index + step / 2;
    const above = index % 2 === 0;
    const cardW = 248;
    const cardH = 168;
    const cardY = above ? yAxis - cardH - 44 : yAxis + 44;
    const id = `event-${index}`;
    nodes.push({
      id,
      label: event.date ? `${event.date} · ${event.label}` : event.label,
      x: x - cardW / 2,
      y: cardY,
      w: cardW,
      h: cardH,
      tier: index === 0 ? "primary" : "secondary",
      groupId: "timeline",
    });
    edges.push({
      id: `axis-${id}`,
      from: "axis",
      to: id,
      label: event.date,
    });
  });

  nodes.unshift({
    id: "axis",
    label: data.title,
    x: width / 2 - 120,
    y: yAxis - 20,
    w: 240,
    h: 40,
    tier: "root",
    groupId: "timeline",
  });

  return {
    formatId: "timeline",
    title: data.title,
    subtitle: "Línea de tiempo interactiva",
    width,
    height,
    nodes,
    edges,
  };
}

function layoutComparison(data: ReturnType<typeof extractComparisonData>): DiagramLayout {
  const width = 1440;
  const height = 820;
  const colW = NODE_TIER_SIZE.primary.w;
  const leftX = 80;
  const rightX = width - colW - 80;
  const headerY = 220;
  const rowH = 104;
  const nodes: LayoutNode[] = [
    {
      id: "left-header",
      label: data.leftTitle,
      x: leftX,
      y: headerY,
      w: colW,
      h: NODE_TIER_SIZE.primary.h,
      tier: "primary",
      groupId: "comparison",
    },
    {
      id: "right-header",
      label: data.rightTitle,
      x: rightX,
      y: headerY,
      w: colW,
      h: NODE_TIER_SIZE.primary.h,
      tier: "primary",
      groupId: "comparison",
    },
  ];
  const edges: LayoutEdge[] = [
    { id: "vs", from: "left-header", to: "right-header", label: "VS" },
  ];

  data.rows.slice(0, 5).forEach((row, index) => {
    const y = headerY + 96 + index * rowH;
    const id = `row-${index}`;
    nodes.push({
      id,
      label: row.criterion,
      x: 56,
      y: y - 10,
      w: width - 112,
      h: rowH - 12,
      tier: "secondary",
      groupId: "comparison",
    });
    nodes.push({
      id: `${id}-left`,
      label: row.left,
      x: leftX + 12,
      y: y + 8,
      w: colW - 24,
      h: 56,
      tier: "tertiary",
      parentId: id,
      groupId: "comparison",
    });
    nodes.push({
      id: `${id}-right`,
      label: row.right,
      x: rightX + 12,
      y: y + 8,
      w: colW - 24,
      h: 56,
      tier: "tertiary",
      parentId: id,
      groupId: "comparison",
    });
    edges.push(
      { id: `edge-l-${index}`, from: id, to: `${id}-left` },
      { id: `edge-r-${index}`, from: id, to: `${id}-right` },
    );
  });

  return {
    formatId: "comparisonTable",
    title: data.title,
    subtitle: "Cuadro comparativo interactivo",
    width,
    height,
    nodes,
    edges,
  };
}

export function computeDiagramLayout(
  formatId: VisualAiFormatId,
  content: OrganizerContent,
): DiagramLayout {
  switch (formatId) {
    case "conceptMap":
      return layoutConceptMap(extractConceptMapData(content));
    case "mindMap":
      return layoutMindMap(extractMindMapData(content));
    case "timeline":
      return layoutTimeline(extractTimelineData(content));
    case "comparisonTable":
      return layoutComparison(extractComparisonData(content));
    default:
      throw new Error(`Formato no estructurado: ${formatId}`);
  }
}

export function getDescendantIds(layout: DiagramLayout, rootId: string): string[] {
  const children = layout.edges.filter((e) => e.from === rootId).map((e) => e.to);
  return children.flatMap((child) => [child, ...getDescendantIds(layout, child)]);
}
