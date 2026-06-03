"use client";

import {
  Brush,
  Eraser,
  Highlighter,
  Lasso,
  Pen,
  Pencil,
} from "lucide-react";
import { INK_COLORS, INK_WIDTHS, type InkTool, type InkToolSettings } from "@/lib/cuaderno/ink-layer";

const TOOLS: Array<{ id: InkTool; label: string; icon: typeof Pen }> = [
  { id: "pen", label: "Lápiz", icon: Pencil },
  { id: "pencil", label: "Pluma", icon: Pen },
  { id: "marker", label: "Marcador", icon: Brush },
  { id: "highlighter", label: "Resaltador", icon: Highlighter },
  { id: "eraser", label: "Borrador", icon: Eraser },
];

export function CuadernoInkToolbar({
  settings,
  onChange,
  courseAccent = "#14b8a6",
  variant = "float",
}: {
  settings: InkToolSettings;
  onChange: (patch: Partial<InkToolSettings>) => void;
  courseAccent?: string;
  variant?: "float" | "rail";
}) {
  const inner = (
    <>
      <div className="cn-ink-toolbar-group" role="group" aria-label="Herramientas">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`cn-ink-tb-btn${settings.tool === t.id ? " is-active" : ""}`}
              title={t.label}
              onClick={() => onChange({ tool: t.id })}
            >
              <Icon size={16} />
            </button>
          );
        })}
        <button type="button" className="cn-ink-tb-btn" title="Selección (próximamente)" disabled>
          <Lasso size={16} />
        </button>
      </div>

      <span className="cn-ink-toolbar-gap" aria-hidden />

      <div className="cn-ink-toolbar-group" role="group" aria-label="Color">
        {INK_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={`cn-ink-color-swatch${settings.color === c ? " is-active" : ""}`}
            style={{ background: c }}
            title="Color"
            onClick={() => onChange({ color: c })}
          />
        ))}
      </div>

      <span className="cn-ink-toolbar-gap" aria-hidden />

      <div className="cn-ink-toolbar-group cn-ink-toolbar-widths" role="group" aria-label="Grosor">
        {INK_WIDTHS.slice(0, 5).map((w) => (
          <button
            key={w}
            type="button"
            className={`cn-ink-width-btn${settings.width === w ? " is-active" : ""}`}
            title={`Grosor ${w}`}
            onClick={() => onChange({ width: w })}
          >
            <span style={{ width: Math.min(16, w + 3), height: Math.min(16, w + 3) }} />
          </button>
        ))}
      </div>

      <span className="cn-ink-toolbar-gap" aria-hidden />

      <label className="cn-ink-opacity">
        Opacidad
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={settings.opacity}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
      </label>
    </>
  );

  if (variant === "float") {
    return (
      <div
        className="cn-ink-toolbar-float"
        style={{ "--cn-studio-accent": courseAccent } as React.CSSProperties}
        role="toolbar"
        aria-label="Herramientas de lápiz"
      >
        <div className="cn-ink-toolbar-glass">{inner}</div>
      </div>
    );
  }

  return (
    <div
      className="cn-ink-toolbar-rail"
      style={{ "--cn-tb-accent": courseAccent } as React.CSSProperties}
      role="toolbar"
      aria-label="Herramientas de tinta"
    >
      <div className="cn-ink-toolbar-scroll">{inner}</div>
    </div>
  );
}
