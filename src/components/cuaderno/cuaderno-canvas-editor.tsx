"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Minus, Plus, Type } from "lucide-react";
import { CuadernoRichEditor } from "@/components/cuaderno/cuaderno-rich-editor";
import { CuadernoEditorToolbar } from "@/components/cuaderno/cuaderno-editor-toolbar";
import { CuadernoFloatingToolbar } from "@/components/cuaderno/cuaderno-floating-toolbar";
import { CuadernoInkToolbar } from "@/components/cuaderno/cuaderno-ink-toolbar";
import { CuadernoSideRail, type SideRailTab } from "@/components/cuaderno/cuaderno-side-rail";
import { CuadernoPerfBadge } from "@/components/cuaderno/cuaderno-perf-badge";
import { isCuadernoPerfEnabled, useCuadernoPerf } from "@/hooks/use-cuaderno-perf";
import { CuadernoInkCanvas } from "@/components/cuaderno/cuaderno-ink-canvas";
import { useCuadernoPaperFit } from "@/components/cuaderno/use-cuaderno-paper-fit";
import {
  parseCuadernoDocument,
  serializeCuadernoDocument,
  setActivePageBody,
  setActivePageInk,
  setActivePageDecorations,
  getActivePage,
} from "@/lib/cuaderno/cuaderno-pages";
import { CuadernoDecorationLayer } from "@/components/cuaderno/decoration/cuaderno-decoration-layer";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { parseDecorationDrag } from "@/lib/cuaderno/decoration-drag";
import { createDecorationFromDrop } from "@/lib/cuaderno/decoration-drop-factory";
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
  onOpenStickers,
  onOpenPostits,
  stickerPanelOpen = false,
  postitPanelOpen = false,
  sideRailTab = null,
  onSideRailSelect,
  onToggleAi,
  aiOpen = false,
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
  onOpenStickers?: () => void;
  onOpenPostits?: () => void;
  stickerPanelOpen?: boolean;
  postitPanelOpen?: boolean;
  sideRailTab?: SideRailTab | null;
  onSideRailSelect?: (tab: SideRailTab) => void;
  onToggleAi?: () => void;
  aiOpen?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [panMode, setPanMode] = useState<"write" | "pan">("write");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [inkSettings, setInkSettings] = useState<InkToolSettings>(DEFAULT_INK_SETTINGS);
  const [selectedDecoId, setSelectedDecoId] = useState<string | null>(null);
  const [decoDragOver, setDecoDragOver] = useState(false);
  const paperLayersRef = useRef<HTMLDivElement>(null);

  const doc = parseCuadernoDocument(notes);
  const activePage = getActivePage(doc);
  const templateId = templateIdProp ?? activePage.templateId;
  const paperTone = paperToneProp ?? activePage.paperTone;
  const marginMode = marginModeProp ?? activePage.marginMode;
  const pageSizeMode = pageSizeModeProp ?? activePage.pageSizeMode ?? DEFAULT_PAGE_SIZE_MODE;
  const template = getTemplate(templateId);
  const paperClass = `${getPaperClasses(templateId)} tone-${paperTone} margin-${marginMode}`;
  const inkStrokes = activePage.inkStrokes ?? [];
  const decorations = activePage.decorations ?? [];

  const fitKey = `${doc.activePageId}-${pageSizeMode}-${layoutMode}-${templateId}`;
  const { zoom, setZoom } = useCuadernoPaperFit(viewportRef, shellRef, pageSizeMode, fitKey);
  const perfEnabled = isCuadernoPerfEnabled();
  const perfStats = useCuadernoPerf(perfEnabled, viewportRef);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const syncDecorations = useCallback(
    (items: DecorationObject[]) => {
      onChange(serializeCuadernoDocument(setActivePageDecorations(doc, items)));
    },
    [doc, onChange],
  );

  const handleDecorationDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDecoDragOver(false);
      if (writingMode !== "text") return;
      const payload = parseDecorationDrag(e.dataTransfer);
      if (!payload) return;
      const el = paperLayersRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const ny = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      const item = createDecorationFromDrop(payload, { x: nx, y: ny });
      if (!item) return;
      syncDecorations([...decorations, item]);
      setSelectedDecoId(item.id);
    },
    [writingMode, decorations, syncDecorations],
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
        <div
          ref={paperLayersRef}
          className={`cn-paper-layers${writingMode === "ink" ? " is-ink-mode" : ""}${decoDragOver ? " is-deco-drag-over" : ""}`}
          onDragEnter={(e) => {
            if (writingMode !== "text") return;
            if (e.dataTransfer.types.includes("application/x-cuaderno-decoration")) {
              e.preventDefault();
              setDecoDragOver(true);
            }
          }}
          onDragOver={(e) => {
            if (writingMode !== "text") return;
            if (e.dataTransfer.types.includes("application/x-cuaderno-decoration")) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDecoDragOver(true);
            }
          }}
          onDragLeave={(e) => {
            if (!paperLayersRef.current?.contains(e.relatedTarget as Node)) {
              setDecoDragOver(false);
            }
          }}
          onDrop={handleDecorationDrop}
        >
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
          <CuadernoDecorationLayer
            decorations={decorations}
            onChange={syncDecorations}
            active={writingMode === "text"}
            selectedId={selectedDecoId}
            onSelectId={setSelectedDecoId}
            scrollRef={viewportRef}
          />
        </div>
      </div>
    </div>
  );

  const viewportClass = immersive
    ? `cn-canvas-viewport cn-canvas-viewport--immersive ${panMode === "pan" ? "is-panning" : ""}`
    : `cn-canvas-viewport ${panMode === "pan" ? "is-panning" : ""}`;

  const stageClass = immersive ? "cn-canvas-stage cn-canvas-stage--immersive" : "cn-canvas-stage";

  const handleSideRail = (tab: SideRailTab) => {
    if (tab === "images") {
      imageInputRef.current?.click();
      return;
    }
    onSideRailSelect?.(tab);
    if (tab === "postits") onOpenPostits?.();
    else onOpenStickers?.();
  };

  if (immersive) {
    return (
      <div
        className="cn-immersive-canvas cn-immersive-canvas--studio"
        data-layout={layoutMode}
        data-writing-mode={writingMode}
      >
        {externalToolbar && onToggleAi ? (
          <CuadernoFloatingToolbar
            editor={editor}
            courseAccent={courseAccent}
            writingMode={writingMode}
            onWritingModeChange={(mode) => {
              onWritingModeChange?.(mode);
              if (mode === "ink" && editor) editor.setEditable(false);
              else if (mode === "text" && editor) editor.setEditable(panMode === "write");
            }}
            onToggleAi={onToggleAi}
            aiOpen={aiOpen}
            onOpenSideRail={handleSideRail}
          />
        ) : null}
        {externalToolbar && writingMode === "ink" ? (
          <CuadernoInkToolbar
            variant="float"
            settings={inkSettings}
            onChange={(patch) => setInkSettings((s) => ({ ...s, ...patch }))}
            courseAccent={courseAccent}
          />
        ) : null}
        {onSideRailSelect ? (
          <CuadernoSideRail
            active={sideRailTab}
            panelOpen={stickerPanelOpen || postitPanelOpen}
            onSelect={handleSideRail}
          />
        ) : null}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file || !editor) return;
            const reader = new FileReader();
            reader.onload = () => {
              editor.chain().focus().setImage({ src: reader.result as string }).run();
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
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
        {perfEnabled ? <CuadernoPerfBadge stats={perfStats} /> : null}
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
