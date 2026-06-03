export type InkTool = "pen" | "pencil" | "marker" | "highlighter" | "eraser";

export type InkPoint = {
  /** Coordenada normalizada 0–1 respecto al lienzo */
  nx: number;
  ny: number;
  pressure?: number;
};

export type InkStroke = {
  id: string;
  tool: InkTool;
  color: string;
  width: number;
  opacity?: number;
  points: InkPoint[];
};

export type InkToolSettings = {
  tool: InkTool;
  color: string;
  width: number;
  /** 0–1 multiplicador de opacidad del trazo */
  opacity: number;
};

export const DEFAULT_INK_SETTINGS: InkToolSettings = {
  tool: "pen",
  color: "#1c1917",
  width: 2.5,
  opacity: 1,
};

export const INK_COLORS = [
  "#1c1917",
  "#1e3a5f",
  "#7f1d1d",
  "#14532d",
  "#5b21b6",
  "#0f766e",
  "#ea580c",
  "#fef08a",
];

export const INK_WIDTHS = [1, 2, 3, 5, 8, 12, 18];

export function strokeId(): string {
  return `ink_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Opacidad y grosor efectivo según herramienta */
export function inkStrokeStyle(
  tool: InkTool,
  baseWidth: number,
  color: string,
  opacityMul = 1,
): {
  color: string;
  width: number;
  globalAlpha: number;
  lineCap: CanvasLineCap;
  composite: GlobalCompositeOperation;
} {
  const mul = Math.min(1, Math.max(0.05, opacityMul));
  switch (tool) {
    case "pencil":
      return { color, width: baseWidth * 0.85, globalAlpha: 0.55 * mul, lineCap: "round", composite: "source-over" };
    case "marker":
      return { color, width: baseWidth * 2.2, globalAlpha: 0.92 * mul, lineCap: "round", composite: "source-over" };
    case "highlighter":
      return { color, width: baseWidth * 4, globalAlpha: 0.35 * mul, lineCap: "butt", composite: "multiply" };
    case "eraser":
      return { color: "#000000", width: baseWidth * 3, globalAlpha: 1, lineCap: "round", composite: "destination-out" };
    default:
      return { color, width: baseWidth, globalAlpha: 1 * mul, lineCap: "round", composite: "source-over" };
  }
}

/** Elimina trazos que intersectan con el trazo borrador (coords normalizadas) */
export function eraseStrokesNearPath(strokes: InkStroke[], eraser: InkPoint[], threshold = 0.012): InkStroke[] {
  if (eraser.length < 2) return strokes;
  return strokes.filter((s) => {
    if (s.tool === "eraser") return false;
    return !s.points.some((p) =>
      eraser.some((e) => Math.hypot(p.nx - e.nx, p.ny - e.ny) < threshold * (s.width / 4 + 1)),
    );
  });
}
