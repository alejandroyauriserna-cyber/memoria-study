import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Gavel,
  Landmark,
  Lightbulb,
  Scale,
  Users,
} from "lucide-react";

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
  ring: 1 | 2;
  globalIndex: number;
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
export const CENTER_NODE_SIZE = 88;

const INNER_RADIUS = 148;
const OUTER_RADIUS = 248;

export { INNER_RADIUS, OUTER_RADIUS };

function hashLabel(label: string) {
  return label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

/** Layout radial: centro → anillo interno → anillo externo por sector. */
export function layoutStudyMapNodes(title: string | undefined, labels: string[]): StudyMapLayout {
  const cx = 420;
  const cy = 320;
  const pad = 96;

  if (!labels.length) {
    return { nodes: [], cx, cy, w: 840, h: 640 };
  }

  const branchCount = Math.min(STUDY_BRANCHES.length, Math.max(2, Math.ceil(labels.length / 2)));
  const perBranch = Math.max(1, Math.ceil(labels.length / branchCount));

  const rawNodes: StudyMapNode[] = labels.map((label, index) => {
    const branchId = Math.floor(index / perBranch) % branchCount;
    const branchIndex = index % perBranch;
    const half = Math.max(1, Math.ceil(perBranch / 2));
    const ring: 1 | 2 = branchIndex < half ? 1 : 2;
    const radius = ring === 1 ? INNER_RADIUS : OUTER_RADIUS;

    const sectorSize = (2 * Math.PI) / branchCount;
    const sectorStart = branchId * sectorSize - Math.PI / 2 + sectorSize * 0.12;
    const sectorEnd = (branchId + 1) * sectorSize - Math.PI / 2 - sectorSize * 0.12;

    const ringPeers = labels
      .map((_, i) => i)
      .filter((i) => {
        const b = Math.floor(i / perBranch) % branchCount;
        const bi = i % perBranch;
        const r: 1 | 2 = bi < half ? 1 : 2;
        return b === branchId && r === ring;
      });

    const peerIndex = ringPeers.indexOf(index);
    const peerCount = ringPeers.length;
    const angle =
      peerCount === 1
        ? (sectorStart + sectorEnd) / 2
        : sectorStart + ((sectorEnd - sectorStart) * (peerIndex + 1)) / (peerCount + 1);

    return {
      id: `node-${index}-${hashLabel(label)}`,
      label,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      branchId,
      branchIndex,
      ring,
      globalIndex: index,
    };
  });

  const allX = [cx, ...rawNodes.map((n) => n.x)];
  const allY = [cy, ...rawNodes.map((n) => n.y)];
  const minX = Math.min(...allX) - CENTER_NODE_SIZE - pad;
  const maxX = Math.max(...allX) + NODE_W + pad;
  const minY = Math.min(...allY) - CENTER_NODE_SIZE - pad;
  const maxY = Math.max(...allY) + NODE_H + pad;

  const w = Math.max(720, maxX - minX);
  const h = Math.max(520, maxY - minY);

  const nodes = rawNodes.map((n) => ({
    ...n,
    x: n.x - minX,
    y: n.y - minY,
  }));

  return {
    nodes,
    cx: cx - minX,
    cy: cy - minY,
    w,
    h,
  };
}

export type CanvasTransform = { x: number; y: number; scale: number };

export function computeFitTransform(
  viewportW: number,
  viewportH: number,
  layout: StudyMapLayout,
  padding = 28,
): CanvasTransform {
  if (!viewportW || !viewportH) {
    return { x: 0, y: 0, scale: 1 };
  }

  const nodePad = 56;
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
  const curve = Math.max(32, dist * 0.28);
  const c1x = x1 + dx * 0.25 + (-dy / dist) * curve * 0.35;
  const c1y = y1 + dy * 0.25 + (dx / dist) * curve * 0.35;
  const c2x = x2 - dx * 0.25 + (-dy / dist) * curve * 0.2;
  const c2y = y2 - dy * 0.25 + (dx / dist) * curve * 0.2;
  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

export type OrganizerStudyContext = {
  summary?: string;
  simplifiedExplanation?: string;
  flashcards?: Array<{ question?: string; answer?: string }>;
  reviewQuestions?: string[];
};

export type NodeStudyDetail = {
  summary: string;
  simpleExplanation: string;
  examImportance: string;
  legalExample: string;
  examQuestion: string;
  commonMistake: string;
  memoryTip: string;
  relations: string[];
  previousConcepts: string[];
  derivedConcepts: string[];
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
  allNodes: StudyMapNode[],
  centerTitle: string | undefined,
  context: OrganizerStudyContext,
): NodeStudyDetail {
  const flashcards = context.flashcards ?? [];
  const matched = flashcards.find(
    (card) =>
      includesTerm(card.question ?? "", node.label) || includesTerm(card.answer ?? "", node.label),
  );

  const summary =
    extractSentence(context.summary, node.label) ||
    matched?.answer?.trim() ||
    `«${node.label}» es un concepto clave dentro de «${centerTitle ?? "este tema"}».`;

  const simpleExplanation =
    extractSentence(context.simplifiedExplanation, node.label) ||
    matched?.question?.trim() ||
    `Piensa en «${node.label}» como una pieza del puzzle jurídico que conecta norma, hecho y consecuencia.`;

  const examImportance =
    node.ring === 1
      ? "Alta probabilidad en examen: concepto estructural del tema."
      : "Relevante para casos prácticos y preguntas de aplicación.";

  const legalExample =
    matched?.question?.trim() ||
    `Caso tipo: identifica cómo interviene «${node.label}» en un supuesto del documento y qué efecto jurídico produce.`;

  const examQuestion =
    context.reviewQuestions?.find((q) => includesTerm(q, node.label)) ||
    `¿Puedes definir «${node.label}» y dar un ejemplo del PDF?`;

  const commonMistake = `Confundir «${node.label}» con conceptos vecinos sin distinguir requisitos, efectos o ámbito de aplicación.`;

  const memoryTip = `Asocia «${node.label}» con la rama «${branchForId(node.branchId).name}» y repítelo en voz alta con un ejemplo propio.`;

  const siblings = allNodes.filter((n) => n.branchId === node.branchId && n.id !== node.id);
  const relations = [
    centerTitle ? `Tema central: ${centerTitle}` : "",
    ...siblings.slice(0, 3).map((s) => s.label),
  ].filter(Boolean);

  const previousConcepts = allNodes
    .filter((n) => n.globalIndex < node.globalIndex && (n.branchId === node.branchId || n.ring === 1))
    .slice(-2)
    .map((n) => n.label);

  const derivedConcepts = allNodes
    .filter((n) => n.globalIndex > node.globalIndex && (n.branchId === node.branchId || n.ring === 2))
    .slice(0, 2)
    .map((n) => n.label);

  return {
    summary,
    simpleExplanation,
    examImportance,
    legalExample,
    examQuestion,
    commonMistake,
    memoryTip,
    relations,
    previousConcepts,
    derivedConcepts,
  };
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
      answer: detail.summary,
    };
  });
}

export function branchForId(branchId: number) {
  return STUDY_BRANCHES[branchId % STUDY_BRANCHES.length];
}

export function nodesInBranch(nodes: StudyMapNode[], branchId: number) {
  return nodes.filter((n) => n.branchId === branchId);
}

export function getRelatedNodeIds(
  nodeId: string | null,
  layout: StudyMapNode[],
): Set<string> {
  if (!nodeId) return new Set(layout.map((n) => n.id));

  const selected = layout.find((n) => n.id === nodeId);
  if (!selected) return new Set();

  const related = new Set<string>([nodeId]);

  for (const node of layout) {
    if (node.branchId === selected.branchId) related.add(node.id);
    if (Math.abs(node.globalIndex - selected.globalIndex) === 1) related.add(node.id);
    if (selected.ring === 2 && node.ring === 1 && node.branchId === selected.branchId) {
      related.add(node.id);
    }
    if (selected.ring === 1 && node.ring === 2 && node.branchId === selected.branchId) {
      related.add(node.id);
    }
  }

  return related;
}

export function isNodeRelated(
  nodeId: string | null,
  targetId: string,
  layout: StudyMapNode[],
): boolean {
  if (!nodeId) return true;
  return getRelatedNodeIds(nodeId, layout).has(targetId);
}

export function getMapEdges(layout: StudyMapLayout) {
  const edges: Array<{ from: "center" | string; to: string; kind: "center" | "inner" | "branch" }> = [];

  for (const node of layout.nodes) {
    if (node.ring === 1) {
      edges.push({ from: "center", to: node.id, kind: "center" });
    } else {
      const inner = layout.nodes.find(
        (n) => n.branchId === node.branchId && n.ring === 1,
      );
      if (inner) {
        edges.push({ from: inner.id, to: node.id, kind: "branch" });
      } else {
        edges.push({ from: "center", to: node.id, kind: "center" });
      }
    }
  }

  return edges;
}
