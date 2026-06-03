"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, Type } from "lucide-react";
import { parseNoteContent, serializeNoteContent } from "@/lib/cuaderno/note-meta";
import { getPaperClasses } from "@/lib/cuaderno/paper-styles";
import type { CuadernoLayoutMode, CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";
import { getTemplate, type CuadernoTemplateId } from "@/lib/cuaderno/templates";
import { CuadernoSelectionMenu } from "@/components/cuaderno/cuaderno-selection-menu";
import type { CuadernoAskAction } from "@/types/cuaderno";

export function CuadernoCanvasEditor({
  notes,
  onChange,
  onSelectionAction,
  placeholder = "Escribe aquí como en tu cuaderno físico…",
  immersive = false,
  layoutMode = "fullscreen",
  paperTone = "warm",
  templateId: templateIdProp,
  onTemplateChange,
}: {
  notes: string;
  onChange: (value: string) => void;
  onSelectionAction?: (
    action: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence",
    selectedText: string,
  ) => void;
  placeholder?: string;
  immersive?: boolean;
  layoutMode?: CuadernoLayoutMode;
  paperTone?: CuadernoPaperTone;
  templateId?: CuadernoTemplateId;
  onTemplateChange?: (id: CuadernoTemplateId) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<"write" | "pan">("write");
  const [selectionMenu, setSelectionMenu] = useState<{ x: number; y: number } | null>(null);

  const { meta, body } = parseNoteContent(notes);
  const templateId = templateIdProp ?? meta.templateId;
  const template = getTemplate(templateId);
  const paperClass = `${getPaperClasses(templateId)} tone-${paperTone}`;

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
    onChange(serializeNoteContent({ ...meta, templateId }, el.innerText));
  }, [meta, templateId, onChange]);

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

  const viewportClass = immersive
    ? `cn-canvas-viewport cn-canvas-viewport--immersive ${mode === "pan" ? "is-panning" : ""}`
    : `cn-canvas-viewport ${mode === "pan" ? "is-panning" : ""}`;

  const stageClass = immersive ? "cn-canvas-stage cn-canvas-stage--immersive" : "cn-canvas-stage";

  const paperInner = (
    <div className={paperClass} data-template={templateId}>
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
  );

  if (immersive) {
    return (
      <div className="cn-immersive-canvas" data-layout={layoutMode}>
        <div className={viewportClass} onMouseUp={mode === "write" ? handleMouseUp : undefined}>
          <div className={stageClass} style={{ transform: `scale(${zoom})` }}>
            {paperInner}
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
          <button
            type="button"
            onClick={() => setMode(mode === "write" ? "pan" : "write")}
            className="cn-immersive-zoom-btn"
          >
            {mode === "write" ? "Mover" : "Escribir"}
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.max(0.75, z - 0.08))} aria-label="Alejar">
            <Minus size={14} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(1.2, z + 0.08))} aria-label="Acercar">
            <Plus size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-layout={layoutMode}>
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
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.08))}
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
            onClick={() => setZoom((z) => Math.min(1.2, z + 0.08))}
            aria-label="Acercar"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className={viewportClass} onMouseUp={mode === "write" ? handleMouseUp : undefined}>
        <div className={stageClass} style={{ transform: `scale(${zoom})` }}>
          {paperInner}
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
    </div>
  );
}
