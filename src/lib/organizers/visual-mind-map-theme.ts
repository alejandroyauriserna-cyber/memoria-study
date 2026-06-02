import type { VisualMindMapCategory, VisualMindMapTier } from "@/lib/organizers/visual-mind-map-types";

export type CategoryTheme = {
  id: VisualMindMapCategory;
  label: string;
  color: string;
  glow: string;
  soft: string;
  gradient: string;
  chip: string;
};

export const CATEGORY_THEMES: Record<VisualMindMapCategory, CategoryTheme> = {
  concept: {
    id: "concept",
    label: "Concepto",
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.6)",
    soft: "rgba(59,130,246,0.16)",
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(37,99,235,0.15))",
    chip: "rgba(59,130,246,0.22)",
  },
  norm: {
    id: "norm",
    label: "Norma",
    color: "#0EA5E9",
    glow: "rgba(14,165,233,0.55)",
    soft: "rgba(14,165,233,0.14)",
    gradient: "linear-gradient(135deg, rgba(14,165,233,0.35), rgba(2,132,199,0.12))",
    chip: "rgba(14,165,233,0.2)",
  },
  principle: {
    id: "principle",
    label: "Principio",
    color: "#22C55E",
    glow: "rgba(34,197,94,0.55)",
    soft: "rgba(34,197,94,0.16)",
    gradient: "linear-gradient(135deg, rgba(34,197,94,0.38), rgba(21,128,61,0.12))",
    chip: "rgba(34,197,94,0.22)",
  },
  case: {
    id: "case",
    label: "Caso",
    color: "#F97316",
    glow: "rgba(249,115,22,0.55)",
    soft: "rgba(249,115,22,0.16)",
    gradient: "linear-gradient(135deg, rgba(249,115,22,0.38), rgba(194,65,12,0.12))",
    chip: "rgba(249,115,22,0.22)",
  },
  example: {
    id: "example",
    label: "Ejemplo",
    color: "#A855F7",
    glow: "rgba(168,85,247,0.55)",
    soft: "rgba(168,85,247,0.16)",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.38), rgba(126,34,206,0.12))",
    chip: "rgba(168,85,247,0.22)",
  },
  comparison: {
    id: "comparison",
    label: "Comparación",
    color: "#EAB308",
    glow: "rgba(234,179,8,0.55)",
    soft: "rgba(234,179,8,0.16)",
    gradient: "linear-gradient(135deg, rgba(234,179,8,0.32), rgba(202,138,4,0.1))",
    chip: "rgba(234,179,8,0.22)",
  },
};

export type TierStyle = {
  collisionRadius: number;
  cardWidth: number;
  cardHeight: number;
  thumbWidth: number;
  fontSize: number;
  iconSize: number;
  labelLines: number;
};

export const TIER_STYLES: Record<VisualMindMapTier, TierStyle> = {
  center: {
    collisionRadius: 130,
    cardWidth: 280,
    cardHeight: 200,
    thumbWidth: 280,
    fontSize: 17,
    iconSize: 44,
    labelLines: 3,
  },
  topic: {
    collisionRadius: 88,
    cardWidth: 196,
    cardHeight: 112,
    thumbWidth: 72,
    fontSize: 13,
    iconSize: 22,
    labelLines: 2,
  },
  subtopic: {
    collisionRadius: 72,
    cardWidth: 168,
    cardHeight: 96,
    thumbWidth: 64,
    fontSize: 12,
    iconSize: 18,
    labelLines: 2,
  },
  detail: {
    collisionRadius: 52,
    cardWidth: 132,
    cardHeight: 44,
    thumbWidth: 36,
    fontSize: 10,
    iconSize: 14,
    labelLines: 1,
  },
};

export function themeForCategory(category: VisualMindMapCategory): CategoryTheme {
  return CATEGORY_THEMES[category] ?? CATEGORY_THEMES.concept;
}

export function styleForTier(tier: VisualMindMapTier): TierStyle {
  return TIER_STYLES[tier] ?? TIER_STYLES.topic;
}

export function collisionRadiusForNode(label: string, tier: VisualMindMapTier): number {
  const base = styleForTier(tier).collisionRadius;
  return base + Math.min(label.length * 0.45, tier === "detail" ? 6 : 12);
}

export const LEGEND_CATEGORIES: VisualMindMapCategory[] = [
  "concept",
  "principle",
  "case",
  "example",
  "comparison",
];
