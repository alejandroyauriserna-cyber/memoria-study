"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Minus, Plus, Type } from "lucide-react";
import { CuadernoRichEditor } from "@/components/cuaderno/cuaderno-rich-editor";
import { CuadernoEditorToolbar } from "@/components/cuaderno/cuaderno-editor-toolbar";
import { CuadernoCompactFormatToolbar } from "@/components/cuaderno/cuaderno-compact-format-toolbar";
import { CuadernoInkToolbar } from "@/components/cuaderno/cuaderno-ink-toolbar";
import { CuadernoInkCanvas } from "@/components/cuaderno/cuaderno-ink-canvas";
import { useCuadernoPaperFit } from "@/components/cuaderno/use-cuaderno-paper-fit";
import {
  parseCuadernoDocument,
  serializeCuadernoDocument,
  setActivePageBody,
  setActivePageInk,
  getActivePage,
} from "@/lib/cuaderno/cuaderno-pages";
import { getPaperClasses } from "@/lib/cuaderno/paper-styles";
import type { CuadernoLayoutMode, CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";
import { DEFAULT_PAGE_SIZE_MODE, type CuadernoPageSizeMode } from "@/lib/cuaderno/page-size";
import { DEFAULT_INK_SETTINGS, type InkToolSettings } from "@/lib/cuaderno/ink-layer";
import { getTemplate, type CuadernoTemplateId } from "@/lib/cuaderno/templates";
import type { CuadernoAskAction } from "@/types/cuaderno";

export type CuadernoWritingMode = "text" | "ink";

type SelectionAction = CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence";

export function CuadernoCanvasEditor({
  notes,
  onChange,
  onSelectionAction,
  placeholder = "Escribe aquí como en tu cuaderno…",
  immersive = false,
  layoutMode = "fullscreen",
  paperTone: paperToneProp,
  marginMode: marginModeProp,
  pageSizeMode: pageSizeModeProp,
  templateId: templateIdProp,
  courseAccent = "#00E5C3",
  pageSettingsSlot,
  externalToolbar = false,
  writingMode = "text",
  onWritingModeChange,
  lineHeight = "1.78",
  onOpenFormatPanel,
  focusMode = false,
  onPaperFocus,
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
  marginMode?: import("@/lib/cuaderno/page-settings").CuadernoPageMargin;
  pageSizeMode?: CuadernoPageSizeMode;
  templateId?: CuadernoTemplateId;
  courseAccent?: string;
  pageSettingsSlot?: React.ReactNode;
  externalToolbar?: boolean;
  writingMode?: CuadernoWritingMode;
  onWritingModeChange?: (mode: CuadernoWritingMode) => void;
  lineHeight?: string;
  onOpenFormatPanel?: () => void;
  focusMode?: boolean;
  onPaperFocus?: () => void;
  onEditorReady?: (editor: Editor | null) => void;
  onModeChange?: (mode: "write" | "pan") => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [panMode, setPanMode] = useState<"write" | "pan">("write");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [inkSettings, setInkSettings] = useState<InkToolSettings>(DEFAULT_INK_SETTINGS);

  const doc = parseCuadernoDocument(notes);
  const activePage = getActivePage(doc);
  const templateId = templateIdProp ?? activePage.templateId;
  const paperTone = paperToneProp ?? activePage.paperTone;
  const marginMode = marginModeProp ?? activePage.marginMode;
  const pageSizeMode = pageSizeModeProp ?? activePage.pageSizeMode ?? DEFAULT_PAGE_SIZE_MODE;
  const template = getTemplate(templateId);
  const paperClass = `${getPaperClasses(templateId)} tone-${paperTone} margin-${marginMode}`;
  const inkStrokes = activePage.inkStrokes ?? [];

  const fitKey = `${doc.activePageId}-${pageSizeMode}-${layoutMode}-${templateId}`;
  const { zoom, setZoom } = useCuadernoPaperFit(viewportRef, shellRef, pageSizeMode, fitKey);

  const syncBody = useCallback(
    (html: string) => {
      onChange(serializeCuadernoDocument(setActivePageBody(doc, html)));
    },
    [doc, onChange],
  );

  const syncInk = useCallback(
    (strokes: typeof inkStrokes) => {
      onChange(serializeCuadernoDocument(setActivePageInk(doc, strokes)));
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

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(writingMode === "text" && panMode === "write");
  }, [editor, writingMode, panMode]);

  const setWriteMode = (next: "write" | "pan") => {
    setPanMode(next);
    onModeChange?.(next);
  };

  const toggleWritingMode = () => {
    const next = writingMode === "text" ? "ink" : "text";
    onWritingModeChange?.(next);
    if (next === "ink" && editor) {
      editor.setEditable(false);
    } else if (next === "text" && editor) {
      editor.setEditable(true);
    }
  };

  const toolbar =
    !externalToolbar ? (
      <CuadernoEditorToolbar
        editor={editor}
        courseAccent={courseAccent}
        disabled={panMode !== "write"}
        onAiAction={onSelectionAction}
      />
    ) : null;

  const showPageChrome = pageSettingsSlot && !focusMode && writingMode === "text";

  const paperOnly = (
    <div
      ref={shellRef}
      className="cn-paper-stage-wrap"
      data-page-size={pageSizeMode}
      data-layout={layoutMode}
      data-writing-mode={writingMode}
      onPointerDown={() => {
        if (writingMode === "text") onPaperFocus?.();
      }}
    >
      {showPageChrome ? <div className="cn-paper-stage-chrome">{pageSettingsSlot}</div> : null}
      <div
        className={paperClass}
        data-template={templateId}
        data-page-size={pageSizeMode}
        style={{ "--cn-course-accent": courseAccent } as React.CSSProperties}
      >
        <div className={`cn-paper-layers${writingMode === "ink" ? " is-ink-mode" : ""}`}>
          <CuadernoRichEditor
            body={activePage.body}
            onBodyChange={syncBody}
            onEditorReady={handleEditorReady}
            placeholder={placeholder || template.description}
            editable={writingMode === "text" && panMode === "write"}
            courseAccent={courseAccent}
            className="cn-paper-editor cn-paper-editor--rich cn-paper-layer-text"
            lineHeight={lineHeight}
            onSelectionAction={onSelectionAction}
          />
          <CuadernoInkCanvas
            strokes={inkStrokes}
            onChange={syncInk}
            active={writingMode === "ink"}
            settings={inkSettings}
          />
        </div>
      </div>
    </div>
  );

  const viewportClass = immersive
    ? `cn-canvas-viewport cn-canvas-viewport--immersive ${panMode === "pan" ? "is-panning" : ""}`
    : `cn-canvas-viewport ${panMode === "pan" ? "is-panning" : ""}`;

  const stageClass = immersive ? "cn-canvas-stage cn-canvas-stage--immersive" : "cn-canvas-stage";

  const modeRail =
    immersive && externalToolbar ? (
      writingMode === "text" ? (
        <CuadernoCompactFormatToolbar editor={editor} courseAccent={courseAccent} />
      ) : (
        <CuadernoInkToolbar
          settings={inkSettings}
          onChange={(patch) => setInkSettings((s) => ({ ...s, ...patch }))}
          courseAccent={courseAccent}
        />
      )
    ) : null;

  const handwritingFab =
    immersive && externalToolbar ? (
      <button
        type="button"
        className={`cn-handwriting-fab${writingMode === "ink" ? " is-ink-active" : ""}`}
        onClick={toggleWritingMode}
      >
        {writingMode === "text" ? (
          <>
            <span aria-hidden>✏️</span> Escribir a mano
          </>
        ) : (
          <>
            <Type size={16} /> Modo texto
          </>
        )}
      </button>
    ) : null;

  if (immersive) {
    return (
      <div className="cn-immersive-canvas" data-layout={layoutMode} data-writing-mode={writingMode}>
        {modeRail}
        <div ref={viewportRef} className={viewportClass}>
          <div className={stageClass} style={{ transform: `scale(${zoom})` }}>
            {paperOnly}
          </div>
        </div>
        {!focusMode ? (
          <div className="cn-immersive-zoom">
            <button
              type="button"
              onClick={() => setWriteMode(panMode === "write" ? "pan" : "write")}
              className="cn-immersive-zoom-btn"
            >
              {panMode === "write" ? "Mover" : "Escribir"}
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.max(0.75, z - 0.08))} aria-label="Alejar">
              <Minus size={14} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(1.35, z + 0.08))} aria-label="Acercar">
              <Plus size={14} />
            </button>
          </div>
        ) : null}
        {handwritingFab}
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
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${panMode === "write" ? "bg-[#00E5C3]/15 text-[#00E5C3]" : "text-muted-foreground"}`}
          >
            <Type size={14} className="mr-1 inline" />
            Escribir
          </button>
          <button
            type="button"
            onClick={() => setWriteMode("pan")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${panMode === "pan" ? "bg-[#00E5C3]/15 text-[#00E5C3]" : "text-muted-foreground"}`}
          >
            Mover lienzo
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 p-1.5 text-muted-foreground hover:text-[#00E5C3]"
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
            className="rounded-lg border border-white/10 p-1.5 text-muted-foreground hover:text-[#00E5C3]"
            onClick={() => setZoom((z) => Math.min(1.35, z + 0.08))}
            aria-label="Acercar"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div ref={viewportRef} className={viewportClass}>
        <div className={stageClass} style={{ transform: `scale(${zoom})` }}>
          {paperOnly}
        </div>
      </div>
    </div>
  );
}
