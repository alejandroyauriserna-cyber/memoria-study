import type { VisualMindMapCategory, VisualMindMapTier } from "@/lib/organizers/visual-mind-map-types";

export type CategoryTheme = {
  id: VisualMindMapCategory;
  label: string;
  color: string;
  glow: string;
  soft: string;
  gradient: string;
};

export const CATEGORY_THEMES: Record<VisualMindMapCategory, CategoryTheme> = {
  concept: {
    id: "concept",
    label: "Concepto",
    color: "#00FFD5",
    glow: "rgba(0,255,213,0.55)",
    soft: "rgba(0,255,213,0.14)",
    gradient: "linear-gradient(135deg, rgba(0,255,213,0.35), rgba(0,191,255,0.12))",
  },
  norm: {
    id: "norm",
    label: "Norma",
    color: "#00BFFF",
    glow: "rgba(0,191,255,0.55)",
    soft: "rgba(0,191,255,0.14)",
    gradient: "linear-gradient(135deg, rgba(0,191,255,0.32), rgba(0,120,255,0.1))",
  },
  principle: {
    id: "principle",
    label: "Principio",
    color: "#34D399",
    glow: "rgba(52,211,153,0.55)",
    soft: "rgba(52,211,153,0.14)",
    gradient: "linear-gradient(135deg, rgba(52,211,153,0.3), rgba(16,185,129,0.1))",
  },
  case: {
    id: "case",
    label: "Caso",
    color: "#FF8A00",
    glow: "rgba(255,138,0,0.55)",
    soft: "rgba(255,138,0,0.14)",
    gradient: "linear-gradient(135deg, rgba(255,138,0,0.32), rgba(255,100,0,0.1))",
  },
  example: {
    id: "example",
    label: "Ejemplo",
    color: "#A78BFA",
    glow: "rgba(167,139,250,0.55)",
    soft: "rgba(167,139,250,0.14)",
    gradient: "linear-gradient(135deg, rgba(167,139,250,0.32), rgba(139,92,246,0.1))",
  },
  comparison: {
    id: "comparison",
    label: "Comparación",
    color: "#FBBF24",
    glow: "rgba(251,191,36,0.55)",
    soft: "rgba(251,191,36,0.14)",
    gradient: "linear-gradient(135deg, rgba(251,191,36,0.28), rgba(245,158,11,0.1))",
  },
};

export type TierStyle = {
  collisionRadius: number;
  thumbSize: number;
  minWidth: number;
  maxWidth: number;
  fontSize: number;
  iconSize: number;
  padding: string;
};

export const TIER_STYLES: Record<VisualMindMapTier, TierStyle> = {
  center: {
    collisionRadius: 96,
    thumbSize: 72,
    minWidth: 168,
    maxWidth: 220,
    fontSize: 15,
    iconSize: 28,
    padding: "20px 22px",
  },
  topic: {
    collisionRadius: 68,
    thumbSize: 52,
    minWidth: 128,
    maxWidth: 168,
    fontSize: 12,
    iconSize: 18,
    padding: "14px 16px",
  },
  subtopic: {
    collisionRadius: 58,
    thumbSize: 44,
    minWidth: 112,
    maxWidth: 148,
    fontSize: 11,
    iconSize: 16,
    padding: "12px 14px",
  },
  detail: {
    collisionRadius: 44,
    thumbSize: 34,
    minWidth: 88,
    maxWidth: 120,
    fontSize: 10,
    iconSize: 13,
    padding: "10px 12px",
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
  return base + Math.min(label.length * 0.6, tier === "detail" ? 8 : 16);
}
