"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CuadernoCanvasEditor } from "@/components/cuaderno/cuaderno-canvas-editor";
import { CuadernoAiSidebar } from "@/components/cuaderno/cuaderno-ai-sidebar";
import { CuadernoImmersiveHeader } from "@/components/cuaderno/cuaderno-immersive-header";
import { CuadernoFormatPanel } from "@/components/cuaderno/cuaderno-format-panel";
import { CuadernoStickerPanel } from "@/components/cuaderno/decoration/cuaderno-sticker-panel";
import { CuadernoPostItPanel } from "@/components/cuaderno/decoration/cuaderno-postit-panel";
import { setActivePageDecorations } from "@/lib/cuaderno/cuaderno-pages";
import {
  createStickerFromLibrary,
  createStickerFromSrc,
  type DecorationObject,
} from "@/lib/cuaderno/decoration-objects";
import type { DecorationDragPayload } from "@/lib/cuaderno/decoration-drag";
import { fileToDataUrl, removeBackgroundToPngDataUrl } from "@/lib/cuaderno/sticker-bg-removal";
import {
  buildDemoDecorations,
  markDemoSeeded,
  shouldSeedDemoDecorations,
} from "@/lib/cuaderno/demo-decorations";
import { useEditorChromeState } from "@/components/cuaderno/cuaderno-editor-chrome";
import { CuadernoPageTimeline } from "@/components/cuaderno/cuaderno-page-timeline";
import { CuadernoNotebookGate } from "@/components/cuaderno/cuaderno-notebook-gate";
import { CuadernoFloatingConcepts } from "@/components/cuaderno/cuaderno-floating-concepts";
import { extractLegalConcepts } from "@/lib/cuaderno/page-content-utils";
import { CuadernoBlockInspector } from "@/components/cuaderno/cuaderno-block-inspector";
import {
  CuadernoPageSettingsPanel,
  CuadernoPageSettingsTrigger,
} from "@/components/cuaderno/cuaderno-page-settings-panel";
import { CuadernoTemplatePicker } from "@/components/cuaderno/cuaderno-template-picker";
import { getSelectedBlock } from "@/lib/cuaderno/cuaderno-block-utils";
import {
  addPage,
  getActivePage,
  parseCuadernoDocument,
  serializeCuadernoDocument,
  setActivePageBody,
  switchActivePage,
  updatePage,
  togglePageFavorite,
} from "@/lib/cuaderno/cuaderno-pages";
import {
  saveExamItemAsync,
  saveSummaryItemAsync,
  toggleFavoriteClassAsync,
} from "@/lib/cuaderno/smart-collections";
import { getCourseCoverArt } from "@/lib/cuaderno/course-covers";
import { getCourseVisualPrefs } from "@/lib/cuaderno/preferences";
import { parseNoteContent } from "@/lib/cuaderno/note-meta";
import type { CuadernoTemplateId } from "@/lib/cuaderno/templates";
import { useCuadernoSyncContextOptional } from "@/components/cuaderno/cuaderno-sync-context";
import { isCachedFavorite } from "@/lib/cuaderno/collections-client";
import type { CuadernoAskAction, CuadernoClass, CuadernoDictionaryResponse } from "@/types/cuaderno";
import type { SideRailTab } from "@/components/cuaderno/cuaderno-side-rail";
import "./cuaderno-premium.css";
import "./cuaderno-paper.css";
import "./cuaderno-decorations.css";
import "./cuaderno-studio.css";

export function CuadernoImmersiveEditor({ initialClass }: { initialClass: CuadernoClass }) {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chrome = useEditorChromeState();

  const [cuadernoClass, setCuadernoClass] = useState(initialClass);
  const [notes, setNotes] = useState(initialClass.notes);
  const [title, setTitle] = useState(initialClass.title);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [favorite, setFavorite] = useState(false);
  const [notebookGateOpen, setNotebookGateOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [favoritePulse, setFavoritePulse] = useState(false);

  const [dictTerm, setDictTerm] = useState("");
  const [dictLoading, setDictLoading] = useState(false);
  const [dictEntry, setDictEntry] = useState<CuadernoDictionaryResponse | null>(null);

  const [customPrompt, setCustomPrompt] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tiptapEditor, setTiptapEditor] = useState<Editor | null>(null);
  const [canvasWriteMode, setCanvasWriteMode] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [formatPanelOpen, setFormatPanelOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [lineHeight, setLineHeight] = useState("1.78");
  const [writingMode, setWritingMode] = useState<"text" | "ink">("text");
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [templateTargetPageId, setTemplateTargetPageId] = useState<string | null>(null);
  const [stickerPanelOpen, setStickerPanelOpen] = useState(false);
  const [stickerPanelTab, setStickerPanelTab] = useState<
    import("@/lib/cuaderno/sticker-panel").StickerPanelTab
  >("biblioteca");
  const [postitPanelOpen, setPostitPanelOpen] = useState(false);
  const [sideRailTab, setSideRailTab] = useState<SideRailTab | null>(null);
  const placeDecorationRef = useRef<((item: DecorationObject) => void) | null>(null);
  const placePayloadRef = useRef<
    ((payload: DecorationDragPayload, clientX: number, clientY: number) => void) | null
  >(null);

  const sync = useCuadernoSyncContextOptional();
  const doc = useMemo(() => parseCuadernoDocument(notes), [notes]);
  const activePage = getActivePage(doc);
  const meta = doc.meta;
  const activePageIndex = doc.pages.findIndex((p) => p.id === doc.activePageId);
  const pageNumber = activePageIndex >= 0 ? activePageIndex + 1 : 1;
  const progressPercent =
    doc.pages.length > 0 ? Math.round((pageNumber / doc.pages.length) * 100) : 0;
  const detectedConcepts = useMemo(
    () => extractLegalConcepts(activePage.body),
    [activePage.body, doc.activePageId],
  );

  const prefs = getCourseVisualPrefs(cuadernoClass.courseId);
  const coverArt = getCourseCoverArt(cuadernoClass.courseId, prefs);

  useEffect(() => {
    setFavorite(sync?.isFavorite(cuadernoClass.id) ?? isCachedFavorite(cuadernoClass.id));
  }, [cuadernoClass.id, sync]);

  useEffect(() => {
    setNotebookGateOpen(true);
    setAiOpen(false);
    setStudyMode(false);
    setFocusMode(false);
  }, [cuadernoClass.id]);

  const persist = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaveState("saving");
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error al guardar");
      setCuadernoClass(payload.cuadernoClass as CuadernoClass);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
    },
    [cuadernoClass.id],
  );

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (notes === cuadernoClass.notes) return;
      persist({ notes }).catch((e) => setError(e instanceof Error ? e.message : "Error al guardar"));
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [notes, cuadernoClass.notes, persist]);

  function applyDoc(next: ReturnType<typeof parseCuadernoDocument>) {
    setNotes(serializeCuadernoDocument(next));
  }

  useEffect(() => {
    if (!shouldSeedDemoDecorations(cuadernoClass.id, activePage.id, activePage.decorations ?? [])) {
      return;
    }
    const demos = buildDemoDecorations();
    if (demos.length === 0) return;
    markDemoSeeded(cuadernoClass.id, activePage.id);
    applyDoc(setActivePageDecorations(doc, demos));
  }, [cuadernoClass.id, activePage.id, activePage.decorations?.length]);

  function applyTemplateToPage(pageId: string, templateId: CuadernoTemplateId) {
    applyDoc(updatePage(doc, pageId, { templateId }));
    setTemplateGalleryOpen(false);
    setTemplateTargetPageId(null);
  }

  function openTemplateGalleryFor(pageId: string) {
    setTemplateTargetPageId(pageId);
    setTemplateGalleryOpen(true);
  }

  function handleNewPage() {
    setTemplateTargetPageId(null);
    setTemplateGalleryOpen(true);
  }

  function onGallerySelect(templateId: CuadernoTemplateId) {
    if (templateTargetPageId) {
      applyTemplateToPage(templateTargetPageId, templateId);
    } else {
      applyDoc(addPage(doc, templateId, "<p></p>"));
      setTemplateGalleryOpen(false);
    }
  }

  useEffect(() => {
    if (!tiptapEditor) return;
    const syncInspector = () => {
      setInspectorOpen(!!getSelectedBlock(tiptapEditor)?.kind);
    };
    syncInspector();
    tiptapEditor.on("selectionUpdate", syncInspector);
    return () => {
      tiptapEditor.off("selectionUpdate", syncInspector);
    };
  }, [tiptapEditor]);

  async function lookupTerm(term: string) {
    const query = term.trim();
    if (!query) return;
    setDictTerm(query);
    setDictLoading(true);
    setAiOpen(true);
    setError(null);
    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/dictionary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: query }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error en diccionario");
      setDictEntry(payload.entry as CuadernoDictionaryResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error en diccionario");
    } finally {
      setDictLoading(false);
    }
  }

  async function handleAsk(
    action: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence" | "simplify",
    promptText?: string,
    saveAs?: "summary" | "exam",
  ) {
    setAskLoading(true);
    setAiOpen(true);
    setError(null);

    let apiAction: CuadernoAskAction = "explain";
    let custom = promptText;

    if (action === "legislation") {
      apiAction = "explain";
      custom = `Busca legislación peruana aplicable: «${promptText ?? ""}»`;
    } else if (action === "jurisprudence") {
      apiAction = "explain";
      custom = `Jurisprudencia y precedentes peruanos relevantes: «${promptText ?? ""}»`;
    } else if (action === "mind_map") {
      apiAction = "relate";
      custom = `Estructura de mapa mental: «${promptText ?? ""}»`;
    } else if (action === "simplify" || promptText?.startsWith("Explica de forma simple")) {
      apiAction = "explain";
      custom =
        promptText?.startsWith("Explica de forma simple")
          ? promptText
          : `Explica de forma simple y breve: «${promptText ?? ""}»`;
    } else if (promptText) {
      apiAction =
        action === "summarize"
          ? "summarize"
          : action === "exam_questions"
            ? "exam_questions"
            : action === "flashcards"
              ? "flashcards"
              : action === "explain" ||
                  action === "examples" ||
                  action === "relate" ||
                  action === "key_concepts"
                ? action
                : "explain";
      custom = promptText;
    }

    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: apiAction, prompt: custom }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error IA");
      const answer = payload.answer as string;
      setAskAnswer(answer);

      if (saveAs === "summary" || apiAction === "summarize") {
        void saveSummaryItemAsync({
          classId: cuadernoClass.id,
          courseName: cuadernoClass.courseName,
          classTitle: cuadernoClass.title,
          title: `Resumen · ${cuadernoClass.title}`,
          content: answer,
        });
      }
      if (saveAs === "exam" || apiAction === "exam_questions") {
        void saveExamItemAsync({
          classId: cuadernoClass.id,
          courseName: cuadernoClass.courseName,
          classTitle: cuadernoClass.title,
          title: `Preguntas · ${cuadernoClass.title}`,
          content: answer,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error IA");
    } finally {
      setAskLoading(false);
    }
  }

  async function generateOrganizer() {
    setGenLoading("organizer");
    try {
      const response = await fetch(
        `/api/cuaderno/classes/${cuadernoClass.id}/generate-organizer`,
        { method: "POST" },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error");
      router.push(payload.redirectUrl ?? "/organizers");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setGenLoading(null);
    }
  }

  async function generateDeck() {
    setGenLoading("deck");
    try {
      const response = await fetch(`/api/cuaderno/classes/${cuadernoClass.id}/generate-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "deck" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error");
      const saveRes = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: { ...payload.deck, academic: payload.academic } }),
      });
      const saved = await saveRes.json();
      if (saveRes.ok && saved.deck?.id) router.push(`/decks/${saved.deck.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setGenLoading(null);
    }
  }

  function openPageFromGate() {
    setNotebookGateOpen(false);
  }

  function toggleStudyMode() {
    setStudyMode((current) => {
      const next = !current;
      setFocusMode(next);
      if (next) {
        setStickerPanelOpen(false);
        setPostitPanelOpen(false);
        setFormatPanelOpen(false);
        setAiOpen(true);
      }
      return next;
    });
  }

  return (
    <motion.div
      className={`cn-immersive-root cn-immersive-root--studio cn-immersive-root--luxury cn-ambient-bg cuaderno-shell ${aiOpen ? "cn-immersive-root--ai-open" : ""}${stickerPanelOpen ? " cn-immersive-root--side-open" : ""}${focusMode || studyMode ? " cn-immersive-root--focus cn-immersive-root--study" : ""}${notebookGateOpen ? " cn-immersive-root--gate" : ""}`}
      data-layout={chrome.layoutMode}
      data-focus={focusMode ? "true" : "false"}
      style={
        {
          "--cn-course-accent": coverArt.accent,
          "--cn-course-glow": `${coverArt.accent}22`,
        } as React.CSSProperties
      }
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <CuadernoImmersiveHeader
        courseId={cuadernoClass.courseId}
        courseName={cuadernoClass.courseName}
        saveState={saveState}
        favorite={favorite}
        favoritePulse={favoritePulse}
        aiOpen={aiOpen}
        studyMode={studyMode}
        compact={chrome.layoutMode === "fullscreen"}
        onToggleStudy={toggleStudyMode}
        onGenerateExam={() =>
          void handleAsk("exam_questions", "Genera un simulacro de examen con mis apuntes", "exam")
        }
        onToggleFavorite={() => {
          void toggleFavoriteClassAsync(cuadernoClass.id).then((next) => {
            setFavorite(next);
            setFavoritePulse(true);
            window.setTimeout(() => setFavoritePulse(false), 400);
            void sync?.refresh();
          });
        }}
        onToggleAi={() => setAiOpen((v) => !v)}
        layoutMode={chrome.layoutMode}
        onLayoutChange={chrome.setLayoutMode}
        pageSizeMode={activePage.pageSizeMode}
        onPageSizeChange={(mode) => applyDoc(updatePage(doc, activePage.id, { pageSizeMode: mode }))}
        onOpenFormatPanel={() => setFormatPanelOpen(true)}
        onOpenPageSettings={() => setPageSettingsOpen(true)}
        stickersOpen={stickerPanelOpen}
        onOpenStickers={() => {
          setSideRailTab("stickers");
          setPostitPanelOpen(false);
          setStickerPanelTab("biblioteca");
          setStickerPanelOpen(true);
        }}
      />

      <CuadernoStickerPanel
        open={stickerPanelOpen}
        initialTab={stickerPanelTab}
        onClose={() => {
          setStickerPanelOpen(false);
          setSideRailTab(null);
        }}
        onPlaceItem={(item) => placeDecorationRef.current?.(item)}
      />

      <CuadernoPostItPanel
        open={postitPanelOpen}
        onClose={() => {
          setPostitPanelOpen(false);
          if (sideRailTab === "postits") setSideRailTab(null);
        }}
        onPlaceItem={(item) => placeDecorationRef.current?.(item)}
      />

      <CuadernoFormatPanel
        open={formatPanelOpen}
        onClose={() => setFormatPanelOpen(false)}
        editor={tiptapEditor}
        paperTone={activePage.paperTone}
        onPaperToneChange={(tone) => applyDoc(updatePage(doc, activePage.id, { paperTone: tone }))}
        lineHeight={lineHeight}
        onLineHeightChange={setLineHeight}
        courseAccent={coverArt.accent}
      />

      <CuadernoTemplatePicker
        open={templateGalleryOpen}
        onClose={() => {
          setTemplateGalleryOpen(false);
          setTemplateTargetPageId(null);
        }}
        onSelect={onGallerySelect}
      />

      <CuadernoPageSettingsPanel
        open={pageSettingsOpen}
        onClose={() => setPageSettingsOpen(false)}
        page={activePage}
        onChange={(patch) => applyDoc(updatePage(doc, activePage.id, patch))}
        onOpenTemplateGallery={() => {
          setPageSettingsOpen(false);
          openTemplateGalleryFor(activePage.id);
        }}
      />

      <div
        className="cn-immersive-workspace"
        onPointerDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest(".cn-immersive-header, .cn-format-panel, .cn-ai-sidebar")) return;
          if (!t.closest(".cn-paper, .cn-rich-editor, .cn-prosemirror")) setFocusMode(false);
        }}
      >
        {!studyMode ? (
          <CuadernoPageTimeline
            pages={doc.pages}
            activePageId={doc.activePageId}
            onSelect={(id) => applyDoc(switchActivePage(doc, id))}
            onAdd={handleNewPage}
            onToggleFavorite={(id) => applyDoc(togglePageFavorite(doc, id))}
          />
        ) : null}

        <div className="cn-immersive-editor-column">
      <main className="cn-immersive-main">
        {notebookGateOpen ? (
          <CuadernoNotebookGate
            title={title}
            courseName={cuadernoClass.courseName}
            pageLabel={activePage.title || `Página ${pageNumber}`}
            pageNumber={pageNumber}
            progressPercent={progressPercent}
            coverArt={coverArt}
            onOpenPage={openPageFromGate}
          />
        ) : (
        <motion.div
          className="cn-immersive-paper-shell"
          key={doc.activePageId}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {!studyMode ? (
            <CuadernoFloatingConcepts
              concepts={detectedConcepts}
              onExpand={(term) => {
                setAiOpen(true);
                void handleAsk("explain", `Explica el concepto «${term}» con base en mis apuntes`);
              }}
            />
          ) : null}
          <CuadernoCanvasEditor
            immersive
            externalToolbar
            notes={notes}
            onChange={(raw) => applyDoc(parseCuadernoDocument(raw))}
            registerAddDecoration={(fn) => {
              placeDecorationRef.current = fn;
            }}
            registerPlacePayload={(fn) => {
              placePayloadRef.current = fn;
            }}
            layoutMode={chrome.layoutMode}
            paperTone={activePage.paperTone}
            marginMode={activePage.marginMode}
            pageSizeMode={activePage.pageSizeMode}
            templateId={activePage.templateId}
            courseAccent={coverArt.accent}
            lineHeight={lineHeight}
            writingMode={writingMode}
            onWritingModeChange={(mode) => {
              setWritingMode(mode);
              if (mode === "ink") setFocusMode(true);
            }}
            focusMode={focusMode || studyMode}
            onPaperFocus={() => setFocusMode(true)}
            onOpenFormatPanel={() => setFormatPanelOpen(true)}
            onOpenStickers={() => {
              setSideRailTab("stickers");
              setPostitPanelOpen(false);
              setStickerPanelTab("biblioteca");
              setStickerPanelOpen(true);
            }}
            onOpenPostits={() => {
              setSideRailTab("postits");
              setStickerPanelOpen(false);
              setPostitPanelOpen(true);
            }}
            stickerPanelOpen={stickerPanelOpen}
            postitPanelOpen={postitPanelOpen}
            sideRailTab={sideRailTab}
            onOpenImportSticker={() => {
              setSideRailTab("import-sticker");
              setPostitPanelOpen(false);
              setStickerPanelTab("importar");
              setStickerPanelOpen(true);
            }}
            onDropStickerFile={async (file, at) => {
              try {
                const raw = await fileToDataUrl(file);
                const png = await removeBackgroundToPngDataUrl(raw);
                const item = createStickerFromSrc(png, file.name.replace(/\.\w+$/, "") || "Sticker", {
                  at,
                  aspectRatio: 1,
                });
                const next = [...(activePage.decorations ?? []), item];
                applyDoc(setActivePageDecorations(doc, next));
              } catch {
                /* ignore */
              }
            }}
            onSideRailSelect={(tab) => {
              setSideRailTab(tab);
              if (tab === "postits") {
                setStickerPanelOpen(false);
                setPostitPanelOpen(true);
              } else if (tab === "stickers") {
                setPostitPanelOpen(false);
                setStickerPanelTab("biblioteca");
                setStickerPanelOpen(true);
              } else if (tab === "import-sticker") {
                setPostitPanelOpen(false);
                setStickerPanelTab("importar");
                setStickerPanelOpen(true);
              }
            }}
            onToggleAi={() => setAiOpen((v) => !v)}
            aiOpen={aiOpen}
            pageSettingsSlot={
              <CuadernoPageSettingsTrigger
                page={activePage}
                onClick={() => setPageSettingsOpen(true)}
              />
            }
            onEditorReady={setTiptapEditor}
            onModeChange={(m) => setCanvasWriteMode(m === "write")}
            onSelectionAction={(action, text) => {
              setAiOpen(true);
              if (action === "summarize") {
                void handleAsk("summarize", `Resume: «${text}»`, "summary");
              } else if (action === "exam_questions") {
                void handleAsk("exam_questions", `Preguntas sobre: «${text}»`, "exam");
              } else if (action === "legislation") {
                void handleAsk("legislation", text);
              } else if (action === "jurisprudence") {
                void handleAsk("jurisprudence", text);
              } else if (action === "mind_map") {
                void handleAsk("mind_map", text);
              } else if (action === "flashcards") {
                void handleAsk("flashcards", `Crea flashcards sobre: «${text}»`);
              } else if (text.startsWith("Explica de forma simple")) {
                void handleAsk("explain", text);
              } else {
                void handleAsk(action, `Sobre: «${text}»`);
              }
            }}
          />
        </motion.div>
        )}
      </main>
        </div>

        {!focusMode && !studyMode && chrome.layoutMode !== "fullscreen" ? (
          <CuadernoBlockInspector
            editor={tiptapEditor}
            open={inspectorOpen}
            onClose={() => setInspectorOpen(false)}
            courseAccent={coverArt.accent}
          />
        ) : null}
      </div>

      <CuadernoAiSidebar
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        dictTerm={dictTerm}
        onDictTermChange={setDictTerm}
        dictLoading={dictLoading}
        dictEntry={dictEntry}
        onLookup={lookupTerm}
        customPrompt={customPrompt}
        onCustomPromptChange={setCustomPrompt}
        onAskCustom={() => {
          const p = customPrompt.trim();
          if (!p) return;
          const saveAs = /resum/i.test(p) ? "summary" : /pregunta|examen|simulacro/i.test(p) ? "exam" : undefined;
          void handleAsk("explain", p, saveAs);
        }}
        onAction={(action, prompt) => {
          if (action === "explain") void handleAsk("explain", prompt);
          else if (action === "summarize") void handleAsk("summarize", prompt, "summary");
          else if (action === "exam_questions") void handleAsk("exam_questions", prompt, "exam");
          else if (action === "flashcards") void handleAsk("flashcards", prompt);
          else if (action === "mind_map") void handleAsk("mind_map", prompt);
          else if (action === "relate") void handleAsk("relate", prompt);
          else if (action === "legislation") void handleAsk("legislation", prompt);
          else if (action === "jurisprudence") void handleAsk("jurisprudence", prompt);
        }}
        askLoading={askLoading}
        askAnswer={askAnswer}
        onGenerateOrganizer={generateOrganizer}
        onGenerateDeck={generateDeck}
        onGenerateExam={() =>
          handleAsk("exam_questions", "Genera un simulacro de examen con mis apuntes", "exam")
        }
        genLoading={genLoading}
        courseAccent={coverArt.accent}
        detectedConcepts={detectedConcepts}
        onExplainPage={() => {
          const topics = detectedConcepts.map((c) => c.term).join(", ");
          void handleAsk(
            "explain",
            topics
              ? `Explica estos temas de la página actual: ${topics}`
              : "Explica los conceptos principales de esta página",
          );
        }}
      />

      {error ? <p className="cn-immersive-error">{error}</p> : null}
    </motion.div>
  );
}
