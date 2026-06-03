"use client";

import {
  Brush,
  Eraser,
  Highlighter,
  Lasso,
  Minus,
  Pen,
  Pencil,
} from "lucide-react";
import { INK_COLORS, INK_WIDTHS, type InkTool, type InkToolSettings } from "@/lib/cuaderno/ink-layer";

const TOOLS: Array<{ id: InkTool; label: string; icon: typeof Pen }> = [
  { id: "pen", label: "Lápiz fino", icon: Pen },
  { id: "pencil", label: "Pluma", icon: Pencil },
  { id: "marker", label: "Marcador", icon: Brush },
  { id: "highlighter", label: "Resaltador", icon: Highlighter },
  { id: "eraser", label: "Borrador", icon: Eraser },
];

export function CuadernoInkToolbar({
  settings,
  onChange,
  courseAccent = "#00E5C3",
}: {
  settings: InkToolSettings;
  onChange: (patch: Partial<InkToolSettings>) => void;
  courseAccent?: string;
}) {
  return (
    <div
      className="cn-ink-toolbar-rail"
      style={{ "--cn-tb-accent": courseAccent } as React.CSSProperties}
      role="toolbar"
      aria-label="Herramientas de tinta"
    >
      <div className="cn-ink-toolbar-scroll">
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
          <button
            type="button"
            className="cn-ink-tb-btn"
            title="Selección (próximamente)"
            disabled
          >
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
          {INK_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              className={`cn-ink-width-btn${settings.width === w ? " is-active" : ""}`}
              title={`Grosor ${w}`}
              onClick={() => onChange({ width: w })}
            >
              <span style={{ width: Math.min(18, w + 4), height: Math.min(18, w + 4) }} />
            </button>
          ))}
          <span className="cn-ink-width-label">
            <Minus size={10} /> {settings.width}px
          </span>
        </div>
      </div>
    </div>
  );
}
