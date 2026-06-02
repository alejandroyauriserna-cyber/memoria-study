import type {
  VisualMindMapCategory,
  VisualMindMapImportance,
  VisualMindMapTier,
} from "@/lib/organizers/visual-mind-map-types";

export type CategoryTheme = {
  id: VisualMindMapCategory;
  label: string;
  color: string;
  glow: string;
  soft: string;
  gradient: string;
  chip: string;
  highlighted: boolean;
};

export const CATEGORY_THEMES: Record<VisualMindMapCategory, CategoryTheme> = {
  concept: {
    id: "concept",
    label: "Concepto",
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.65)",
    soft: "rgba(59,130,246,0.16)",
    gradient: "linear-gradient(145deg, rgba(59,130,246,0.35), rgba(15,23,42,0.95))",
    chip: "rgba(59,130,246,0.24)",
    highlighted: false,
  },
  norm: {
    id: "norm",
    label: "Norma",
    color: "#0EA5E9",
    glow: "rgba(14,165,233,0.55)",
    soft: "rgba(14,165,233,0.14)",
    gradient: "linear-gradient(145deg, rgba(14,165,233,0.3), rgba(15,23,42,0.95))",
    chip: "rgba(14,165,233,0.2)",
    highlighted: false,
  },
  principle: {
    id: "principle",
    label: "Principio",
    color: "#22C55E",
    glow: "rgba(34,197,94,0.55)",
    soft: "rgba(34,197,94,0.16)",
    gradient: "linear-gradient(145deg, rgba(34,197,94,0.32), rgba(15,23,42,0.95))",
    chip: "rgba(34,197,94,0.22)",
    highlighted: false,
  },
  case: {
    id: "case",
    label: "Caso",
    color: "#F97316",
    glow: "rgba(249,115,22,0.65)",
    soft: "rgba(249,115,22,0.2)",
    gradient: "linear-gradient(145deg, rgba(249,115,22,0.38), rgba(15,23,42,0.95))",
    chip: "rgba(249,115,22,0.28)",
    highlighted: true,
  },
  example: {
    id: "example",
    label: "Ejemplo",
    color: "#A855F7",
    glow: "rgba(168,85,247,0.65)",
    soft: "rgba(168,85,247,0.2)",
    gradient: "linear-gradient(145deg, rgba(168,85,247,0.38), rgba(15,23,42,0.95))",
    chip: "rgba(168,85,247,0.28)",
    highlighted: true,
  },
  comparison: {
    id: "comparison",
    label: "Comparación",
    color: "#EAB308",
    glow: "rgba(234,179,8,0.55)",
    soft: "rgba(234,179,8,0.16)",
    gradient: "linear-gradient(145deg, rgba(234,179,8,0.28), rgba(15,23,42,0.95))",
    chip: "rgba(234,179,8,0.22)",
    highlighted: false,
  },
  article: {
    id: "article",
    label: "Artículo",
    color: "#EF4444",
    glow: "rgba(239,68,68,0.6)",
    soft: "rgba(239,68,68,0.18)",
    gradient: "linear-gradient(145deg, rgba(239,68,68,0.32), rgba(15,23,42,0.95))",
    chip: "rgba(239,68,68,0.26)",
    highlighted: true,
  },
};

export type TierStyle = {
  collisionRadius: number;
  cardWidth: number;
  cardHeight: number;
  thumbHeight: number;
  fontSize: number;
  titleSize: number;
  iconSize: number;
  summarySize: number;
  scale: number;
};

export const TIER_STYLES: Record<VisualMindMapTier, TierStyle> = {
  center: {
    collisionRadius: 180,
    cardWidth: 320,
    cardHeight: 248,
    thumbHeight: 128,
    fontSize: 11,
    titleSize: 20,
    iconSize: 52,
    summarySize: 13,
    scale: 1,
  },
  topic: {
    collisionRadius: 110,
    cardWidth: 248,
    cardHeight: 148,
    thumbHeight: 72,
    fontSize: 9,
    titleSize: 14,
    iconSize: 32,
    summarySize: 11,
    scale: 0.92,
  },
  subtopic: {
    collisionRadius: 92,
    cardWidth: 216,
    cardHeight: 132,
    thumbHeight: 64,
    fontSize: 9,
    titleSize: 13,
    iconSize: 28,
    summarySize: 10,
    scale: 0.88,
  },
  detail: {
    collisionRadius: 72,
    cardWidth: 188,
    cardHeight: 112,
    thumbHeight: 52,
    fontSize: 8,
    titleSize: 12,
    iconSize: 24,
    summarySize: 10,
    scale: 0.84,
  },
};

export const IMPORTANCE_LABELS: Record<VisualMindMapImportance, string> = {
  essential: "Esencial",
  important: "Importante",
  supporting: "Complementario",
};

export function themeForCategory(category: VisualMindMapCategory): CategoryTheme {
  return CATEGORY_THEMES[category] ?? CATEGORY_THEMES.concept;
}

export function styleForTier(tier: VisualMindMapTier): TierStyle {
  return TIER_STYLES[tier] ?? TIER_STYLES.topic;
}

export function nodeDimensions(node: { tier: VisualMindMapTier; summary?: string; category: VisualMindMapCategory }) {
  const style = styleForTier(node.tier);
  const theme = themeForCategory(node.category);
  const highlightBoost = theme.highlighted ? 16 : 0;
  const summaryBoost = node.summary ? 12 : 0;
  return {
    width: style.cardWidth,
    height: style.cardHeight + highlightBoost + summaryBoost,
  };
}

export function collisionRadiusForNode(
  node: { label: string; tier: VisualMindMapTier; summary?: string; category: VisualMindMapCategory },
): number {
  const { width, height } = nodeDimensions(node);
  return Math.max(width, height) * 0.52;
}

export const LEGEND_CATEGORIES: VisualMindMapCategory[] = [
  "concept",
  "principle",
  "case",
  "example",
  "comparison",
  "article",
];
