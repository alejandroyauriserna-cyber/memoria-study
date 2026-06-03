"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Type } from "lucide-react";
import { parseNoteContent, serializeNoteContent } from "@/lib/cuaderno/note-meta";
import { getTemplate } from "@/lib/cuaderno/templates";
import { CuadernoSelectionMenu } from "@/components/cuaderno/cuaderno-selection-menu";
import type { CuadernoAskAction } from "@/types/cuaderno";

export function CuadernoCanvasEditor({
  notes,
  onChange,
  onSelectionAction,
  placeholder = "Escribe tus apuntes como en un cuaderno físico…",
  immersive = false,
}: {
  notes: string;
  onChange: (value: string) => void;
  onSelectionAction?: (
    action: CuadernoAskAction | "legislation" | "mind_map",
    selectedText: string,
  ) => void;
  placeholder?: string;
  immersive?: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<"write" | "pan">("write");
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number } | null>(null);

  const { meta, body } = parseNoteContent(notes);
  const template = getTemplate(meta.templateId);
  const patternClass = `pattern-${template.pattern}`;

  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    if (el.innerText !== body) {
      el.innerText = body;
    }
  }, [body]);

  const syncContent = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    onChange(serializeNoteContent(meta, el.innerText));
  }, [meta, onChange]);

  function handleMouseUp() {
    if (!onSelectionAction) return;
    const text = window.getSelection()?.toString().trim();
    if (!text || text.length < 3) {
      setSelectionMenu(null);
      return;
    }
    const range = window.getSelection()?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();
    if (rect) {
      setSelectionMenu({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    }
  }

  if (immersive) {
    return (
      <div className="cn-immersive-canvas">
        <div
          ref={viewportRef}
          className={`cn-canvas-viewport cn-canvas-viewport--immersive ${mode === "pan" ? "is-panning" : ""}`}
          onMouseUp={mode === "write" ? handleMouseUp : undefined}
        >
          <div className="cn-canvas-stage cn-canvas-stage--immersive" style={{ transform: `scale(${zoom})` }}>
            <div className={`cn-paper ${patternClass}`}>
              <div
                ref={editorRef}
                role="textbox"
                aria-multiline
                contentEditable={mode === "write"}
                suppressContentEditableWarning
                className="cn-paper-editor"
                data-placeholder={placeholder}
                onInput={syncContent}
                onBlur={syncContent}
              />
            </div>
          </div>
        </div>
        {selectionMenu && onSelectionAction ? (
          <CuadernoSelectionMenu
            x={selectionMenu.x}
            y={selectionMenu.y}
            onAction={(action, text) => {
              setSelectionMenu(null);
              onSelectionAction(action, text);
            }}
          />
        ) : null}
        <div className="cn-immersive-zoom">
          <button type="button" onClick={() => setMode(mode === "write" ? "pan" : "write")} className="cn-immersive-zoom-btn">
            {mode === "write" ? "Mover" : "Escribir"}
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))} aria-label="Alejar">
            <Minus size={14} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(1.25, z + 0.1))} aria-label="Acercar">
            <Plus size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-black/25 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "write" ? "bg-[#00FFD5]/15 text-[#00FFD5]" : "text-muted-foreground"}`}
          >
            <Type size={14} className="mr-1 inline" />
            Escribir
          </button>
          <button
            type="button"
            onClick={() => setMode("pan")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "pan" ? "bg-[#00FFD5]/15 text-[#00FFD5]" : "text-muted-foreground"}`}
          >
            Mover lienzo
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 p-1.5 text-muted-foreground hover:text-[#00FFD5]"
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
            aria-label="Alejar"
          >
            <Minus size={16} />
          </button>
          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="rounded-lg border border-white/10 p-1.5 text-muted-foreground hover:text-[#00FFD5]"
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            aria-label="Acercar"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`cn-canvas-viewport ${mode === "pan" ? "is-panning" : ""}`}
        onMouseUp={mode === "write" ? handleMouseUp : undefined}
      >
        <div className="cn-canvas-stage" style={{ transform: `scale(${zoom})` }}>
          <div className={`cn-paper ${patternClass}`}>
            <div
              ref={editorRef}
              role="textbox"
              aria-multiline
              contentEditable={mode === "write"}
              suppressContentEditableWarning
              className="cn-paper-editor"
              data-placeholder={placeholder}
              onInput={syncContent}
              onBlur={syncContent}
            />
          </div>
        </div>
      </div>

      {selectionMenu && onSelectionAction ? (
        <CuadernoSelectionMenu
          x={selectionMenu.x}
          y={selectionMenu.y}
          onAction={(action, text) => {
            setSelectionMenu(null);
            onSelectionAction(action, text);
          }}
        />
      ) : null}

      <p className="text-[11px] text-muted-foreground">
        Plantilla: {template.label} · Selecciona texto para acciones de IA
      </p>
    </div>
  );
}
