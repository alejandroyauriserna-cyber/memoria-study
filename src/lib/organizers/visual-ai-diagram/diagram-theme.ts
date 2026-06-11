export type DiagramThemeMode = "light" | "dark";

export type DiagramTheme = {
  mode: DiagramThemeMode;
  bg: string;
  bgGradientStart: string;
  bgGradientEnd: string;
  ambientGlow: string;
  grid: string;
  surface: string;
  surfaceElevated: string;
  foreground: string;
  muted: string;
  accent: string;
  accentBorder: string;
  accentGlow: string;
  violet: string;
  gold: string;
  nodeFillTop: string;
  nodeFillBottom: string;
  nodeBorder: string;
  nodeShadow: string;
  connector: string;
  connectorGlow: string;
  font: string;
};

export const DIAGRAM_LIGHT: DiagramTheme = {
  mode: "light",
  bg: "#f0faff",
  bgGradientStart: "rgba(255,255,255,0.98)",
  bgGradientEnd: "rgba(240,250,255,0.95)",
  ambientGlow: "rgba(0,255,213,0.12)",
  grid: "rgba(15,23,42,0.04)",
  surface: "rgba(255,255,255,0.92)",
  surfaceElevated: "rgba(248,252,255,0.95)",
  foreground: "#0f172a",
  muted: "#64748b",
  accent: "#0d9488",
  accentBorder: "rgba(0,255,213,0.18)",
  accentGlow: "rgba(0,255,213,0.28)",
  violet: "#7c3aed",
  gold: "#b45309",
  nodeFillTop: "rgba(255,255,255,0.95)",
  nodeFillBottom: "rgba(248,252,255,0.9)",
  nodeBorder: "rgba(0,255,213,0.18)",
  nodeShadow: "rgba(15,23,42,0.08)",
  connector: "#0d9488",
  connectorGlow: "rgba(0,255,213,0.35)",
  font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

export const DIAGRAM_DARK: DiagramTheme = {
  mode: "dark",
  bg: "#040d12",
  bgGradientStart: "#07131a",
  bgGradientEnd: "#040d12",
  ambientGlow: "rgba(0,255,213,0.1)",
  grid: "rgba(0,255,213,0.04)",
  surface: "rgba(10,22,40,0.88)",
  surfaceElevated: "rgba(17,31,51,0.92)",
  foreground: "#f5f7fa",
  muted: "#64748b",
  accent: "#00ffd5",
  accentBorder: "rgba(0,255,213,0.22)",
  accentGlow: "rgba(0,255,213,0.32)",
  violet: "#a78bfa",
  gold: "#fbbf24",
  nodeFillTop: "rgba(14,28,48,0.95)",
  nodeFillBottom: "rgba(8,18,32,0.92)",
  nodeBorder: "rgba(0,255,213,0.2)",
  nodeShadow: "rgba(0,0,0,0.35)",
  connector: "#00ffd5",
  connectorGlow: "rgba(0,255,213,0.4)",
  font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

/** Default for stored SVG — premium glass readable in both viewers. */
export function getDiagramTheme(mode: DiagramThemeMode = "light"): DiagramTheme {
  return mode === "dark" ? DIAGRAM_DARK : DIAGRAM_LIGHT;
}

export type NodeTier = "root" | "primary" | "secondary" | "tertiary";

export const NODE_TIER_SIZE: Record<NodeTier, { w: number; h: number; fontSize: number; maxChars: number; icon: string }> = {
  root: { w: 288, h: 88, fontSize: 16, maxChars: 28, icon: "◆" },
  primary: { w: 232, h: 72, fontSize: 14, maxChars: 24, icon: "●" },
  secondary: { w: 208, h: 64, fontSize: 13, maxChars: 22, icon: "○" },
  tertiary: { w: 180, h: 56, fontSize: 11, maxChars: 20, icon: "·" },
};
