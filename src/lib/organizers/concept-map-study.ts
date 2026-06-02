import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Gavel,
  Landmark,
  Lightbulb,
  Scale,
  Users,
} from "lucide-react";
import dagre from "@dagrejs/dagre";

export type StudyBranch = {
  id: number;
  name: string;
  color: string;
  glow: string;
  soft: string;
  icon: LucideIcon;
};

export const STUDY_BRANCHES: StudyBranch[] = [
  { id: 0, name: "Fundamentos", color: "#00FFD5", glow: "rgba(0,255,213,0.5)", soft: "rgba(0,255,213,0.12)", icon: BookOpen },
  { id: 1, name: "Normativa", color: "#00BFFF", glow: "rgba(0,191,255,0.5)", soft: "rgba(0,191,255,0.12)", icon: Scale },
  { id: 2, name: "Proceso", color: "#00FFD5", glow: "rgba(0,255,213,0.45)", soft: "rgba(0,255,213,0.1)", icon: Gavel },
  { id: 3, name: "Actores", color: "#FF8A00", glow: "rgba(255,138,0,0.5)", soft: "rgba(255,138,0,0.12)", icon: Users },
  { id: 4, name: "Instituciones", color: "#00BFFF", glow: "rgba(0,191,255,0.45)", soft: "rgba(0,191,255,0.1)", icon: Landmark },
  { id: 5, name: "Ideas clave", color: "#00FFD5", glow: "rgba(0,255,213,0.4)", soft: "rgba(0,255,213,0.08)", icon: Lightbulb },
];

export type StudyMapNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  branchId: number;
  branchIndex: number;
};

export type StudyMapLayout = {
  nodes: StudyMapNode[];
  cx: number;
  cy: number;
  w: number;
  h: number;
};

export const NODE_W = 108;
export const NODE_H = 32;
export const CENTER_NODE_SIZE = 72;

function hashLabel(label: string) {
  return label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

/** @deprecated use layoutStudyMapNodes return value */
export function studyMapViewport() {
  return { w: 800, h: 520, cx: 400, cy: 260 };
}

/** Dagre hierarchical layout: centro → ramas → conceptos, sin cruces. */
export function layoutStudyMapNodes(title: string | undefined, labels: string[]): StudyMapLayout {
  const fallback = { nodes: [] as StudyMapNode[], cx: 400, cy: 260, w: 800, h: 520 };

  if (!labels.length) {
    return fallback;
  }

  const branchCount = Math.min(STUDY_BRANCHES.length, Math.max(2, Math.ceil(labels.length / 2)));
  const perBranch = Math.max(1, Math.ceil(labels.length / branchCount));

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 24,
    ranksep: 64,
    marginx: 48,
    marginy: 48,
    align: "UL",
  });

  const centerId = "__center__";
  g.setNode(centerId, { width: CENTER_NODE_SIZE, height: CENTER_NODE_SIZE });

  const branchHubs = new Set<string>();

  labels.forEach((label, index) => {
    const branchId = Math.floor(index / perBranch) % branchCount;
    const branchHubId = `__branch_${branchId}__`;
    const nodeId = `node-${index}-${hashLabel(label)}`;

    if (!branchHubs.has(branchHubId)) {
      branchHubs.add(branchHubId);
      g.setNode(branchHubId, { width: 8, height: 8 });
      g.setEdge(centerId, branchHubId);
    }

    g.setNode(nodeId, { width: NODE_W, height: NODE_H });
    g.setEdge(branchHubId, nodeId);
  });

  dagre.layout(g);

  const centerPos = g.node(centerId) as { x: number; y: number; width: number; height: number };
  const rawNodes: StudyMapNode[] = labels.map((label, index) => {
    const branchId = Math.floor(index / perBranch) % branchCount;
    const nodeId = `node-${index}-${hashLabel(label)}`;
    const pos = g.node(nodeId) as { x: number; y: number };
    return {
      id: nodeId,
      label,
      x: pos.x,
      y: pos.y,
      branchId,
      branchIndex: index % perBranch,
    };
  });

  const allX = [centerPos.x, ...rawNodes.map((n) => n.x)];
  const allY = [centerPos.y, ...rawNodes.map((n) => n.y)];
  const pad = 72;
  const minX = Math.min(...allX) - CENTER_NODE_SIZE / 2 - pad;
  const maxX = Math.max(...allX) + NODE_W / 2 + pad;
  const minY = Math.min(...allY) - CENTER_NODE_SIZE / 2 - pad;
  const maxY = Math.max(...allY) + NODE_H / 2 + pad;

  const w = Math.max(640, maxX - minX);
  const h = Math.max(420, maxY - minY);

  const nodes = rawNodes.map((n) => ({
    ...n,
    x: n.x - minX,
    y: n.y - minY,
  }));

  return {
    nodes,
    cx: centerPos.x - minX,
    cy: centerPos.y - minY,
    w,
    h,
  };
}

export type CanvasTransform = { x: number; y: number; scale: number };

/** fitView: centra el contenido y escala para que quepa en el viewport. */
export function computeFitTransform(
  viewportW: number,
  viewportH: number,
  layout: StudyMapLayout,
  padding = 28,
): CanvasTransform {
  if (!viewportW || !viewportH) {
    return { x: 0, y: 0, scale: 1 };
  }

  const nodePad = 48;
  const xs = [layout.cx, ...layout.nodes.map((n) => n.x)];
  const ys = [layout.cy, ...layout.nodes.map((n) => n.y)];
  const minX = Math.min(...xs) - nodePad;
  const maxX = Math.max(...xs) + nodePad;
  const minY = Math.min(...ys) - nodePad;
  const maxY = Math.max(...ys) + nodePad;

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const contentCx = (minX + maxX) / 2;
  const contentCy = (minY + maxY) / 2;

  const scale = Math.min(
    (viewportW - padding * 2) / contentW,
    (viewportH - padding * 2) / contentH,
    1.05,
  );
  const clampedScale = Math.max(0.32, Math.min(scale, 1.1));

  return {
    x: -(contentCx - layout.w / 2) * clampedScale,
    y: -(contentCy - layout.h / 2) * clampedScale,
    scale: clampedScale,
  };
}

export function studyBezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const curve = Math.max(28, dist * 0.22);
  const c1x = x1 + dx * 0.35 + (-dy / dist) * curve * 0.12;
  const c1y = y1 + dy * 0.12 + (dx / dist) * curve * 0.12;
  const c2x = x2 - dx * 0.35;
  const c2y = y2 - dy * 0.15;
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

export type OrganizerStudyContext = {
  summary?: string;
  simplifiedExplanation?: string;
  flashcards?: Array<{ question?: string; answer?: string }>;
  reviewQuestions?: string[];
};

export type NodeStudyDetail = {
  definition: string;
  example: string;
  reviewQuestion: string;
  relations: string[];
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function includesTerm(text: string, term: string) {
  const hay = normalize(text);
  const needle = normalize(term);
  if (needle.length < 4) return hay.includes(needle);
  const words = needle.split(/\s+/).filter((w) => w.length > 3);
  return words.length ? words.some((w) => hay.includes(w)) : hay.includes(needle);
}

export function buildNodeStudyDetail(
  node: StudyMapNode,
  siblings: StudyMapNode[],
  centerTitle: string | undefined,
  context: OrganizerStudyContext,
): NodeStudyDetail {
  const flashcards = context.flashcards ?? [];
  const matched = flashcards.find(
    (card) =>
      includesTerm(card.question ?? "", node.label) || includesTerm(card.answer ?? "", node.label),
  );

  const definition =
    matched?.answer?.trim() ||
    extractSentence(context.summary, node.label) ||
    extractSentence(context.simplifiedExplanation, node.label) ||
    `${node.label} es un concepto central del tema «${centerTitle ?? "este material"}». Repásalo en el PDF para fijarlo en memoria.`;

  const example =
    matched?.question?.trim() ||
    `Pregúntate: ¿cómo se aplica «${node.label}» en un caso del documento?`;

  const reviewQuestion =
    context.reviewQuestions?.find((q) => includesTerm(q, node.label)) ||
    `¿Puedes explicar «${node.label}» con tus propias palabras?`;

  const relations = [
    centerTitle ? `Tema central: ${centerTitle}` : "",
    ...siblings
      .filter((s) => s.id !== node.id)
      .slice(0, 4)
      .map((s) => s.label),
  ].filter(Boolean);

  return { definition, example, reviewQuestion, relations };
}

function extractSentence(text: string | undefined, term: string) {
  if (!text) return "";
  const parts = text.split(/(?<=[.!?])\s+/);
  const hit = parts.find((p) => includesTerm(p, term));
  return hit?.trim() ?? "";
}

export function flashcardsForBranch(
  branchNodes: StudyMapNode[],
  context: OrganizerStudyContext,
  centerTitle?: string,
) {
  const terms = branchNodes.map((n) => n.label);
  const existing = (context.flashcards ?? []).filter((card) =>
    terms.some(
      (term) =>
        includesTerm(card.question ?? "", term) || includesTerm(card.answer ?? "", term),
    ),
  );

  if (existing.length >= 2) {
    return existing.map((c) => ({
      question: c.question ?? "",
      answer: c.answer ?? "",
    }));
  }

  return branchNodes.map((node) => {
    const detail = buildNodeStudyDetail(node, branchNodes, centerTitle, context);
    return {
      question: `¿Qué debes recordar sobre «${node.label}»?`,
      answer: detail.definition,
    };
  });
}

export function branchForId(branchId: number) {
  return STUDY_BRANCHES[branchId % STUDY_BRANCHES.length];
}

export function nodesInBranch(nodes: StudyMapNode[], branchId: number) {
  return nodes.filter((n) => n.branchId === branchId);
}

export function branchSectorPath(
  cx: number,
  cy: number,
  branchId: number,
  branchCount: number,
  radius: number,
) {
  const start = (2 * Math.PI * branchId) / branchCount - Math.PI / 2 - Math.PI / branchCount;
  const end = (2 * Math.PI * (branchId + 1)) / branchCount - Math.PI / 2 + Math.PI / branchCount;
  const x1 = cx + Math.cos(start) * radius;
  const y1 = cy + Math.sin(start) * radius;
  const x2 = cx + Math.cos(end) * radius;
  const y2 = cy + Math.sin(end) * radius;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
}

export function isNodeRelated(
  nodeId: string | null,
  targetId: string,
  layout: StudyMapNode[],
): boolean {
  if (!nodeId) return true;
  if (nodeId === targetId) return true;
  const selected = layout.find((n) => n.id === nodeId);
  const target = layout.find((n) => n.id === targetId);
  if (!selected || !target) return false;
  return selected.branchId === target.branchId;
}
