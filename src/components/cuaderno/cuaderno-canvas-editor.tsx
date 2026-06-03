"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCuadernoViewport } from "@/hooks/use-cuaderno-viewport";
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
import {
  CuadernoGroupSelectionBox,
  CuadernoMarqueeOverlay,
} from "@/components/cuaderno/decoration/cuaderno-marquee-overlay";
import { deleteTableComplete, isTableNodeSelected } from "@/lib/cuaderno/delete-table-complete";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import {
  endDecorationDrag,
  isDecorationDragTransfer,
  parseDecorationDrag,
  type DecorationDragPayload,
} from "@/lib/cuaderno/decoration-drag";
import { createDecorationFromDrop } from "@/lib/cuaderno/decoration-drop-factory";
import {
  fileToDataUrl,
  readImagePayloadFromClipboard,
} from "@/lib/cuaderno/decoration-clipboard";
import { createFloatingImage, loadImageNaturalSize } from "@/lib/cuaderno/floating-image";
import {
  buildFloatingImageFromUrl,
  ensureDecorationReady,
  withPlaceProgress,
  type PlaceProgress,
} from "@/lib/cuaderno/place-decoration";
import { CuadernoPlacementOverlay } from "@/components/cuaderno/cuaderno-placement-overlay";
import { NodeSelection } from "@tiptap/pm/state";
import { migrateInlineImagesFromHtml } from "@/lib/cuaderno/migrate-inline-images";
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
  onOpenImportSticker,
  onDropStickerFile,
  registerAddDecoration,
  registerPlacePayload,
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
  onOpenImportSticker?: () => void;
  onDropStickerFile?: (file: File, at: { x: number; y: number }) => void;
  /** Registra función para añadir decoración desde paneles externos (stickers/post-its). */
  registerAddDecoration?: (fn: ((item: DecorationObject) => void) | null) => void;
  registerPlacePayload?: (fn: ((payload: DecorationDragPayload, clientX: number, clientY: number) => void) | null) => void;
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
  const [selectedDecoIds, setSelectedDecoIds] = useState<string[]>([]);
  const [decoDragOver, setDecoDragOver] = useState(false);
  const [placeProgress, setPlaceProgress] = useState<PlaceProgress | null>(null);
  const paperLayersRef = useRef<HTMLDivElement>(null);
  const viewportBounds = useCuadernoViewport(viewportRef, paperLayersRef, 0.15);

  const doc = useMemo(() => parseCuadernoDocument(notes), [notes]);
  const activePage = useMemo(() => getActivePage(doc), [doc]);
  const docRef = useRef(doc);
  docRef.current = doc;

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
  const migratedPagesRef = useRef<Set<string>>(new Set());

  const syncBody = useCallback(
    (html: string) => {
      onChange(serializeCuadernoDocument(setActivePageBody(docRef.current, html)));
    },
    [onChange],
  );

  const syncInk = useCallback(
    (strokes: typeof inkStrokes) => {
      onChange(serializeCuadernoDocument(setActivePageInk(docRef.current, strokes)));
    },
    [onChange],
  );

  const syncDecorations = useCallback(
    (items: DecorationObject[]) => {
      onChange(serializeCuadernoDocument(setActivePageDecorations(docRef.current, items)));
    },
    [onChange],
  );

  const focusEditor = useCallback(() => {
    if (editor && writingMode === "text" && panMode === "write") {
      editor.chain().focus().run();
    }
  }, [editor, writingMode, panMode]);

  const liveDecorationsRef = useRef(decorations);
  liveDecorationsRef.current = decorations;
  const selectedDecoIdsRef = useRef(selectedDecoIds);
  selectedDecoIdsRef.current = selectedDecoIds;

  const clearCanvasSelection = useCallback(() => {
    setSelectedDecoIds([]);
    if (editor) {
      const sel = editor.state.selection;
      if (sel instanceof NodeSelection && sel.node.type.name === "table") {
        const after = Math.min(sel.from + sel.node.nodeSize, editor.state.doc.content.size - 1);
        editor.chain().focus().setTextSelection(after).run();
      }
    }
  }, [editor]);

  const deleteCanvasSelection = useCallback(() => {
    const ids = selectedDecoIdsRef.current;
    if (ids.length) {
      const drop = new Set(ids);
      syncDecorations(liveDecorationsRef.current.filter((d) => !drop.has(d.id)));
      setSelectedDecoIds([]);
    }
    if (editor && isTableNodeSelected(editor)) {
      deleteTableComplete(editor);
    }
  }, [editor, syncDecorations]);

  const visibleCenterNorm = useCallback(() => {
    const vp = viewportRef.current?.getBoundingClientRect();
    const paper = paperLayersRef.current?.getBoundingClientRect();
    if (!vp || !paper || paper.width < 1 || paper.height < 1) {
      return { x: 0.34, y: 0.28 };
    }
    const cx = (vp.left + vp.right) / 2;
    const cy = (vp.top + vp.bottom) / 2;
    return {
      x: Math.min(0.88, Math.max(0.06, (cx - paper.left) / paper.width)),
      y: Math.min(0.88, Math.max(0.06, (cy - paper.top) / paper.height)),
    };
  }, []);

  const addDecoration = useCallback(
    (item: DecorationObject) => {
      syncDecorations([...liveDecorationsRef.current, item]);
      setSelectedDecoIds([item.id]);
    },
    [syncDecorations],
  );

  const placeDecorationItem = useCallback(
    async (item: DecorationObject, at?: { x: number; y: number }) => {
      const centered = at
        ? {
            ...item,
            x: Math.min(0.88, Math.max(0.02, at.x - item.w / 2)),
            y: Math.min(0.88, Math.max(0.02, at.y - item.h / 2)),
          }
        : {
            ...item,
            x: Math.min(0.88, Math.max(0.02, item.x)),
            y: Math.min(0.88, Math.max(0.02, item.y)),
          };
      setPlaceProgress({ percent: 5, label: "Colocando en la hoja…" });
      try {
        const ready = await withPlaceProgress(
          item.kind === "sticker" ? "Cargando sticker…" : "Cargando imagen…",
          setPlaceProgress,
          () => ensureDecorationReady(centered, setPlaceProgress),
        );
        addDecoration(ready);
      } catch (err) {
        console.error("[cuaderno] place decoration", err);
      } finally {
        window.setTimeout(() => setPlaceProgress(null), 450);
      }
    },
    [addDecoration],
  );

  const clientToPaperNorm = useCallback((clientX: number, clientY: number) => {
    const el = paperLayersRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    return {
      x: Math.min(0.95, Math.max(0.02, (clientX - r.left) / r.width)),
      y: Math.min(0.95, Math.max(0.02, (clientY - r.top) / r.height)),
    };
  }, []);

  const placeFromPayload = useCallback(
    async (payload: DecorationDragPayload, clientX: number, clientY: number) => {
      const at = clientToPaperNorm(clientX, clientY);
      if (!at) return;
      const draft = createDecorationFromDrop(payload, at);
      if (!draft) return;
      await placeDecorationItem(draft, at);
    },
    [clientToPaperNorm, placeDecorationItem],
  );

  useEffect(() => {
    registerAddDecoration?.((item) => {
      void placeDecorationItem(item, visibleCenterNorm());
    });
    return () => registerAddDecoration?.(null);
  }, [registerAddDecoration, placeDecorationItem, visibleCenterNorm]);

  useEffect(() => {
    registerPlacePayload?.((payload, clientX, clientY) => {
      void placeFromPayload(payload, clientX, clientY);
    });
    return () => registerPlacePayload?.(null);
  }, [registerPlacePayload, placeFromPayload]);

  const insertFloatingImageAt = useCallback(
    async (file: File, at?: { x: number; y: number }) => {
      const center = at ?? visibleCenterNorm();
      setPlaceProgress({ percent: 8, label: "Cargando imagen…" });
      try {
        const item = await withPlaceProgress("Procesando imagen…", setPlaceProgress, async () => {
          const src = await fileToDataUrl(file);
          try {
            const size = await loadImageNaturalSize(src);
            return createFloatingImage(src, center, size);
          } catch {
            return createFloatingImage(src, center);
          }
        });
        addDecoration(item);
      } catch (err) {
        console.error("[cuaderno] insert image", err);
      } finally {
        window.setTimeout(() => setPlaceProgress(null), 450);
      }
    },
    [addDecoration, visibleCenterNorm],
  );

  const insertFloatingImageFile = useCallback(
    (file: File) => {
      void insertFloatingImageAt(file);
    },
    [insertFloatingImageAt],
  );

  useEffect(() => {
    if (migratedPagesRef.current.has(activePage.id)) return;
    const { html, images } = migrateInlineImagesFromHtml(activePage.body);
    migratedPagesRef.current.add(activePage.id);
    if (images.length === 0) return;
    const nextDoc = setActivePageDecorations(
      setActivePageBody(docRef.current, html),
      [...(activePage.decorations ?? []), ...images],
    );
    onChange(serializeCuadernoDocument(nextDoc));
  }, [activePage.id, activePage.body, activePage.decorations, doc, onChange]);

  const dropPosition = useCallback((e: React.DragEvent) => {
    const el = paperLayersRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  }, []);

  const handleDecorationDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDecoDragOver(false);
      if (writingMode !== "text") return;

      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        const pos = dropPosition(e);
        if (pos) {
          void insertFloatingImageAt(file, pos);
          return;
        }
      }

      const payload = parseDecorationDrag(e.dataTransfer);
      if (!payload) return;
      endDecorationDrag();
      void placeFromPayload(payload, e.clientX, e.clientY);
    },
    [writingMode, insertFloatingImageAt, placeFromPayload],
  );

  useEffect(() => {
    const el = paperLayersRef.current;
    if (!el || writingMode !== "text") return;

    const onDragOverCapture = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (!dt || !isDecorationDragTransfer(dt)) return;
      e.preventDefault();
      e.stopPropagation();
      dt.dropEffect = "copy";
      setDecoDragOver(true);
    };

    const onDropCapture = (e: DragEvent) => {
      const dt = e.dataTransfer;
      if (!dt) return;
      const payload = parseDecorationDrag(dt);
      if (!payload) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setDecoDragOver(false);
      endDecorationDrag();
      void placeFromPayload(payload, e.clientX, e.clientY);
    };

    el.addEventListener("dragover", onDragOverCapture, true);
    el.addEventListener("drop", onDropCapture, true);
    return () => {
      el.removeEventListener("dragover", onDragOverCapture, true);
      el.removeEventListener("drop", onDropCapture, true);
    };
  }, [writingMode, placeFromPayload, activePage.id]);

  const handleDecorationDragOver = useCallback(
    (e: React.DragEvent) => {
      if (writingMode !== "text") return;
      const hasDeco = isDecorationDragTransfer(e.dataTransfer);
      const hasFile = Array.from(e.dataTransfer.types).includes("Files");
      if (hasDeco || hasFile) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        setDecoDragOver(true);
      }
    },
    [writingMode],
  );

  const handleDecorationDragEnter = useCallback(
    (e: React.DragEvent) => {
      handleDecorationDragOver(e);
    },
    [handleDecorationDragOver],
  );

  const handleDecorationDragLeave = useCallback((e: React.DragEvent) => {
    const rel = e.relatedTarget as Node | null;
    const zone = e.currentTarget as HTMLElement;
    if (rel && zone.contains(rel)) return;
    setDecoDragOver(false);
  }, []);

  useEffect(() => {
    if (writingMode !== "text") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("textarea, input, .cn-postit-text")) return;
      const inProse = t.closest(".cn-prosemirror");
      if (inProse && !(e.key === "Delete" || e.key === "Backspace")) return;
      if (inProse && (e.key === "Delete" || e.key === "Backspace") && !isTableNodeSelected(editor)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        if (t.closest("textarea, .cn-postit-text")) return;
        e.preventDefault();
        setSelectedDecoIds(liveDecorationsRef.current.map((d) => d.id));
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedDecoIdsRef.current.length || isTableNodeSelected(editor)) {
          e.preventDefault();
          deleteCanvasSelection();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [writingMode, editor, deleteCanvasSelection]);

  useEffect(() => {
    if (writingMode !== "text") return;
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("textarea, input, .cn-postit-text")) return;
      const payload = readImagePayloadFromClipboard(e.clipboardData);
      if (!payload) return;
      e.preventDefault();
      const at = visibleCenterNorm();
      if (payload.kind === "file") {
        void insertFloatingImageAt(payload.file, at);
        return;
      }
      setPlaceProgress({ percent: 10, label: "Importando imagen…" });
      void (async () => {
        try {
          const item = await withPlaceProgress("Descargando imagen…", setPlaceProgress, () =>
            buildFloatingImageFromUrl(payload.url, at),
          );
          addDecoration(item);
        } catch (err) {
          console.error("[cuaderno] paste image url", err);
        } finally {
          window.setTimeout(() => setPlaceProgress(null), 450);
        }
      })();
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [writingMode, insertFloatingImageAt, visibleCenterNorm, addDecoration]);

  const handleEditorReady = useCallback(
    (ed: Editor | null) => {
      setEditor(ed);
      onEditorReady?.(ed);
    },
    [onEditorReady],
  );

  useEffect(() => {
    if (!editor) return;
    const onSel = () => {
      const sel = editor.state.selection;
      if (sel instanceof NodeSelection && sel.node.type.name === "table") {
        setSelectedDecoIds([]);
      }
    };
    editor.on("selectionUpdate", onSel);
    return () => {
      editor.off("selectionUpdate", onSel);
    };
  }, [editor]);

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
        onInsertImageFile={insertFloatingImageFile}
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
          onPointerDown={(e) => {
            const t = e.target as HTMLElement;
            if (t.closest(".cn-decoration-item")) return;
            if (
              t === paperLayersRef.current ||
              t.classList.contains("cn-prosemirror") ||
              t.closest(".cn-rich-editor-content")
            ) {
              focusEditor();
            }
          }}
          onDragEnter={handleDecorationDragEnter}
          onDragOver={handleDecorationDragOver}
          onDragLeave={handleDecorationDragLeave}
          onDrop={handleDecorationDrop}
        >
          <CuadernoMarqueeOverlay
            active={writingMode === "text" && panMode === "write"}
            paperRef={paperLayersRef}
            decorations={decorations}
            editor={editor}
            onSelectDecorations={setSelectedDecoIds}
            onSelectTable={() => setSelectedDecoIds([])}
            onClearTableSelection={() => {}}
            onEmptyClick={clearCanvasSelection}
          />
          <CuadernoGroupSelectionBox decorations={decorations} selectedIds={selectedDecoIds} />
          <CuadernoDecorationLayer
            decorations={decorations}
            onChange={syncDecorations}
            active={writingMode === "text"}
            selectedIds={selectedDecoIds}
            onSelectIds={(ids) => {
              setSelectedDecoIds(ids);
              if (ids.length && editor) {
                const sel = editor.state.selection;
                if (sel instanceof NodeSelection && sel.node.type.name === "table") {
                  const after = Math.min(sel.from + sel.node.nodeSize, editor.state.doc.content.size - 1);
                  editor.chain().focus().setTextSelection(after).run();
                }
              }
            }}
            scrollRef={viewportRef}
            layerRootRef={paperLayersRef}
            viewportBounds={viewportBounds}
            placement="behind"
          />
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
            selectedIds={selectedDecoIds}
            onSelectIds={(ids) => {
              setSelectedDecoIds(ids);
              if (ids.length && editor) {
                const sel = editor.state.selection;
                if (sel instanceof NodeSelection && sel.node.type.name === "table") {
                  const after = Math.min(sel.from + sel.node.nodeSize, editor.state.doc.content.size - 1);
                  editor.chain().focus().setTextSelection(after).run();
                }
              }
            }}
            scrollRef={viewportRef}
            layerRootRef={paperLayersRef}
            viewportBounds={viewportBounds}
            placement="front"
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
    if (tab === "import-sticker") {
      onOpenImportSticker?.();
      return;
    }
    onSideRailSelect?.(tab);
    if (tab === "postits") onOpenPostits?.();
    else if (tab === "stickers") onOpenStickers?.();
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
            onInsertImageFile={insertFloatingImageFile}
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
            if (!file) return;
            insertFloatingImageFile(file);
            e.target.value = "";
          }}
        />
        <div
          ref={viewportRef}
          className={viewportClass}
          onDragEnter={handleDecorationDragEnter}
          onDragOver={handleDecorationDragOver}
          onDragLeave={handleDecorationDragLeave}
          onDrop={handleDecorationDrop}
        >
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
        <CuadernoPlacementOverlay progress={placeProgress} />
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

      <div
        ref={viewportRef}
        className={viewportClass}
        onDragEnter={handleDecorationDragEnter}
        onDragOver={handleDecorationDragOver}
        onDragLeave={handleDecorationDragLeave}
        onDrop={handleDecorationDrop}
      >
        <div className={stageClass} style={{ transform: `scale(${zoom})` }}>
          {paperOnly}
        </div>
      </div>
      <CuadernoPlacementOverlay progress={placeProgress} />
    </div>
  );
}
