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
};

const CANVAS_W = 1200;
const CANVAS_H = 720;

function hashLabel(label: string) {
  return label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function studyMapViewport() {
  return { w: CANVAS_W, h: CANVAS_H, cx: CANVAS_W / 2, cy: CANVAS_H / 2 };
}

/** Ramas radiales tipo XMind: sectores con nodos agrupados. */
export function layoutStudyMapNodes(title: string | undefined, labels: string[]): StudyMapNode[] {
  const { cx, cy } = studyMapViewport();
  const count = labels.length;
  const branchCount = Math.min(STUDY_BRANCHES.length, Math.max(2, Math.ceil(count / 2)));
  const perBranch = Math.max(1, Math.ceil(count / branchCount));
  const baseRadius = Math.min(CANVAS_W, CANVAS_H) * 0.26;

  return labels.map((label, index) => {
    const branchId = Math.floor(index / perBranch) % branchCount;
    const indexInBranch = index % perBranch;
    const branchAngle = (2 * Math.PI * branchId) / branchCount - Math.PI / 2;
    const spread = Math.min(0.55, 0.18 * perBranch);
    const angle = branchAngle + (indexInBranch - (perBranch - 1) / 2) * spread;
    const radius = baseRadius + indexInBranch * 52 + (hashLabel(label) % 20);

    return {
      id: `node-${index}-${hashLabel(label)}`,
      label,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      branchId,
      branchIndex: indexInBranch,
    };
  });
}

export function studyBezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const curve = Math.max(40, Math.hypot(dx, dy) * 0.28);
  const c1x = x1 + dx * 0.2 + (-dy / Math.hypot(dx, dy || 1)) * curve * 0.15;
  const c1y = y1 + dy * 0.15 + (dx / Math.hypot(dx, dy || 1)) * curve * 0.15;
  const c2x = x2 - dx * 0.25;
  const c2y = y2 - dy * 0.2;
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
    context.reviewQuestions?.find((q) => includesTerm(q, node.label)) ||
    `Pregúntate: ¿cómo se aplica «${node.label}» en un caso del documento?`;

  const relations = [
    centerTitle ? `Tema central: ${centerTitle}` : "",
    ...siblings
      .filter((s) => s.id !== node.id)
      .slice(0, 4)
      .map((s) => s.label),
  ].filter(Boolean);

  return { definition, example, relations };
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

/** Halo SVG path aproximado por sector de rama */
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
