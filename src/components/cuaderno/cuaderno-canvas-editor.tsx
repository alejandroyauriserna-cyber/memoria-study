"use client";

import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Minus, Plus, Type } from "lucide-react";
import { CuadernoRichEditor } from "@/components/cuaderno/cuaderno-rich-editor";
import { CuadernoEditorToolbar } from "@/components/cuaderno/cuaderno-editor-toolbar";
import {
  parseCuadernoDocument,
  serializeCuadernoDocument,
  setActivePageBody,
  getActivePage,
} from "@/lib/cuaderno/cuaderno-pages";
import { getPaperClasses } from "@/lib/cuaderno/paper-styles";
import type { CuadernoLayoutMode, CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";
import { getTemplate, type CuadernoTemplateId } from "@/lib/cuaderno/templates";
import type { CuadernoAskAction } from "@/types/cuaderno";

type SelectionAction = CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence";

export function CuadernoCanvasEditor({
  notes,
  onChange,
  onSelectionAction,
  placeholder = "Escribe aquí como en tu cuaderno…",
  immersive = false,
  layoutMode = "fullscreen",
  paperTone = "warm",
  templateId: templateIdProp,
  courseAccent = "#0d9488",
  externalToolbar = false,
  onEditorReady,
  onModeChange,
}: {
  notes: string;
  onChange: (value: string) => void;
  onSelectionAction?: (action: SelectionAction, selectedText: string) => void;
  placeholder?: string;
  immersive?: boolean;
  layoutMode?: CuadernoLayoutMode;
  paperTone?: CuadernoPaperTone;
  templateId?: CuadernoTemplateId;
  courseAccent?: string;
  /** Toolbar renderizada por el padre (vista inmersiva) */
  externalToolbar?: boolean;
  onEditorReady?: (editor: Editor | null) => void;
  onModeChange?: (mode: "write" | "pan") => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<"write" | "pan">("write");
  const [editor, setEditor] = useState<Editor | null>(null);

  const doc = parseCuadernoDocument(notes);
  const activePage = getActivePage(doc);
  const templateId = templateIdProp ?? activePage.templateId;
  const template = getTemplate(templateId);
  const paperClass = `${getPaperClasses(templateId)} tone-${paperTone}`;

  const syncBody = useCallback(
    (html: string) => {
      onChange(serializeCuadernoDocument(setActivePageBody(doc, html)));
    },
    [doc, onChange],
  );

  const handleEditorReady = useCallback(
    (ed: Editor | null) => {
      setEditor(ed);
      onEditorReady?.(ed);
    },
    [onEditorReady],
  );

  const setWriteMode = (next: "write" | "pan") => {
    setMode(next);
    onModeChange?.(next);
  };

  const toolbar =
    !externalToolbar ? (
      <CuadernoEditorToolbar
        editor={editor}
        courseAccent={courseAccent}
        disabled={mode !== "write"}
        onAiAction={onSelectionAction}
      />
    ) : null;

  const paperOnly = (
    <div
      className={paperClass}
      data-template={templateId}
      style={{ "--cn-course-accent": courseAccent } as React.CSSProperties}
    >
      <CuadernoRichEditor
        body={activePage.body}
        onBodyChange={syncBody}
        onEditorReady={handleEditorReady}
        placeholder={placeholder || template.description}
        editable={mode === "write"}
        courseAccent={courseAccent}
        className="cn-paper-editor cn-paper-editor--rich"
        onSelectionAction={onSelectionAction}
      />
    </div>
  );

  const viewportClass = immersive
    ? `cn-canvas-viewport cn-canvas-viewport--immersive ${mode === "pan" ? "is-panning" : ""}`
    : `cn-canvas-viewport ${mode === "pan" ? "is-panning" : ""}`;

  const stageClass = immersive ? "cn-canvas-stage cn-canvas-stage--immersive" : "cn-canvas-stage";

  if (immersive) {
    return (
      <div className="cn-immersive-canvas" data-layout={layoutMode}>
        <div className={viewportClass}>
          <div className={stageClass} style={{ transform: `scale(${zoom})` }}>
            {paperOnly}
          </div>
        </div>
        <div className="cn-immersive-zoom">
          <button
            type="button"
            onClick={() => setWriteMode(mode === "write" ? "pan" : "write")}
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
    <div className="cn-canvas-workspace" data-layout={layoutMode}>
      {toolbar}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-black/25 px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setWriteMode("write")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "write" ? "bg-[#00FFD5]/15 text-[#00FFD5]" : "text-muted-foreground"}`}
          >
            <Type size={14} className="mr-1 inline" />
            Escribir
          </button>
          <button
            type="button"
            onClick={() => setWriteMode("pan")}
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

      <div className={viewportClass}>
        <div className={stageClass} style={{ transform: `scale(${zoom})` }}>
          {paperOnly}
        </div>
      </div>
    </div>
  );
}
