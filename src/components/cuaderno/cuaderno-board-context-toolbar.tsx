"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bold, Italic, Sparkles, Trash2, Underline } from "lucide-react";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { CUADERNO_TEXT_COLORS } from "@/lib/cuaderno/editor-colors";

const SHAPE_COLORS = ["#0d9488", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#1e293b"];

function isTextDeco(d: DecorationObject | null): d is DecorationObject {
  return !!d && (d.kind === "free-text" || d.kind === "shape" || d.kind === "textbox");
}

export function CuadernoBoardContextToolbar({
  paperRef,
  decoration,
  onTextFormat,
  onTextColor,
  onShapeColor,
  onShapeShadow,
  onOpenAi,
  onDelete,
}: {
  paperRef: React.RefObject<HTMLElement | null>;
  decoration: DecorationObject | null;
  onTextFormat?: (cmd: "bold" | "italic" | "underline") => void;
  onTextColor?: (color: string) => void;
  onShapeColor?: (color: string) => void;
  onShapeShadow?: (enabled: boolean) => void;
  onOpenAi?: () => void;
  onDelete?: () => void;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!decoration || !paperRef.current) {
      setPos(null);
      return;
    }
    const el = paperRef.current.querySelector(
      `[data-deco-id="${CSS.escape(decoration.id)}"]`,
    ) as HTMLElement | null;
    if (!el) {
      setPos(null);
      return;
    }
    const update = () => {
      const r = el.getBoundingClientRect();
      setPos({ top: Math.max(8, r.top - 44), left: r.left + r.width / 2 });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [decoration, paperRef]);

  const showTextTools = useMemo(() => isTextDeco(decoration), [decoration]);
  const showShapeTools = decoration?.kind === "shape";

  if (!decoration || !pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="cn-board-context-toolbar cn-glass"
      style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
      role="toolbar"
      aria-label="Herramientas del elemento"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {showTextTools ? (
        <>
          <button
            type="button"
            className="cn-board-ctx-btn"
            title="Negrita"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onTextFormat?.("bold")}
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            className="cn-board-ctx-btn"
            title="Cursiva"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onTextFormat?.("italic")}
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            className="cn-board-ctx-btn"
            title="Subrayado"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onTextFormat?.("underline")}
          >
            <Underline size={15} />
          </button>
          <span className="cn-board-ctx-sep" aria-hidden />
          {CUADERNO_TEXT_COLORS.slice(0, 6).map((color) => (
            <button
              key={color}
              type="button"
              className="cn-board-ctx-color"
              title="Color de texto"
              style={{ background: color }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onTextColor?.(color)}
            />
          ))}
          <span className="cn-board-ctx-sep" aria-hidden />
        </>
      ) : null}

      {showShapeTools ? (
        <>
          {SHAPE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`cn-board-ctx-color${decoration.color === color ? " is-on" : ""}`}
              style={{ background: color }}
              title="Color de forma"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onShapeColor?.(color)}
            />
          ))}
          <button
            type="button"
            className={`cn-board-ctx-btn${decoration.shapeShadow ? " is-active" : ""}`}
            title="Sombra"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onShapeShadow?.(!decoration.shapeShadow)}
          >
            S
          </button>
          <span className="cn-board-ctx-sep" aria-hidden />
        </>
      ) : null}

      {onOpenAi ? (
        <button
          type="button"
          className="cn-board-ctx-btn cn-board-ctx-btn--ai"
          title="IA"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenAi}
        >
          <Sparkles size={15} />
        </button>
      ) : null}

      {onDelete ? (
        <button
          type="button"
          className="cn-board-ctx-btn cn-board-ctx-btn--danger"
          title="Eliminar"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onDelete}
        >
          <Trash2 size={15} />
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
