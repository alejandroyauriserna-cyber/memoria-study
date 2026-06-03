"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Sparkles, Star } from "lucide-react";
import { CuadernoCanvasEditor } from "@/components/cuaderno/cuaderno-canvas-editor";
import { CuadernoEditorToolbar } from "@/components/cuaderno/cuaderno-editor-toolbar";
import { CuadernoAiSidebar } from "@/components/cuaderno/cuaderno-ai-sidebar";
import {
  CuadernoEditorChrome,
  useEditorChromeState,
} from "@/components/cuaderno/cuaderno-editor-chrome";
import { CuadernoPageSidebar } from "@/components/cuaderno/cuaderno-page-sidebar";
import { CuadernoBlockInspector } from "@/components/cuaderno/cuaderno-block-inspector";
import {
  CuadernoPageSettingsPanel,
  CuadernoPageSettingsTrigger,
} from "@/components/cuaderno/cuaderno-page-settings-panel";
import { CuadernoTemplatePicker } from "@/components/cuaderno/cuaderno-template-picker";
import { getSelectedBlock } from "@/lib/cuaderno/cuaderno-block-utils";
import {
  addPage,
  duplicatePage,
  getActivePage,
  movePage,
  parseCuadernoDocument,
  removePage,
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
import "./cuaderno-premium.css";
import "./cuaderno-paper.css";

export function CuadernoImmersiveEditor({ initialClass }: { initialClass: CuadernoClass }) {
  const router = useRouter();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chrome = useEditorChromeState();

  const [cuadernoClass, setCuadernoClass] = useState(initialClass);
  const [notes, setNotes] = useState(initialClass.notes);
  const [title, setTitle] = useState(initialClass.title);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [favorite, setFavorite] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
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
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [templateTargetPageId, setTemplateTargetPageId] = useState<string | null>(null);

  const sync = useCuadernoSyncContextOptional();
  const doc = useMemo(() => parseCuadernoDocument(notes), [notes]);
  const activePage = getActivePage(doc);
  const meta = doc.meta;

  const prefs = getCourseVisualPrefs(cuadernoClass.courseId);
  const coverArt = getCourseCoverArt(cuadernoClass.courseId, prefs);

  useEffect(() => {
    setFavorite(sync?.isFavorite(cuadernoClass.id) ?? isCachedFavorite(cuadernoClass.id));
  }, [cuadernoClass.id, sync]);

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
    action: CuadernoAskAction | "legislation" | "mind_map" | "jurisprudence",
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
    } else if (promptText) {
      apiAction =
        action === "summarize"
          ? "summarize"
          : action === "exam_questions"
            ? "exam_questions"
            : action;
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

  return (
    <motion.div
      className={`cn-immersive-root ${aiOpen ? "cn-immersive-root--ai-open" : ""}`}
      data-layout={chrome.layoutMode}
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
      <header className="cn-immersive-toolbar">
        <Link
          href={`/cuaderno/curso/${cuadernoClass.courseId}`}
          className="cn-immersive-back"
          aria-label="Volver al curso"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="cn-immersive-course-badge" aria-hidden>
          {coverArt.icon}
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => persist({ title: title.trim() })}
          className="cn-immersive-title"
          aria-label="Título de la clase"
        />
        <span className="cn-immersive-status">
          {saveState === "saving" ? (
            <>
              <Loader2 size={12} className="animate-spin" /> Guardando
            </>
          ) : saveState === "saved" ? (
            "Guardado"
          ) : (
            cuadernoClass.courseName
          )}
        </span>
        <motion.button
          type="button"
          animate={favoritePulse ? { scale: [1, 1.25, 1] } : {}}
          onClick={() => {
            void toggleFavoriteClassAsync(cuadernoClass.id).then((next) => {
              setFavorite(next);
              setFavoritePulse(true);
              window.setTimeout(() => setFavoritePulse(false), 400);
              void sync?.refresh();
            });
          }}
          className={`cn-immersive-icon-btn ${favorite ? "is-active" : ""}`}
          title="Favoritos"
        >
          <Star size={18} fill={favorite ? "currentColor" : "none"} />
        </motion.button>
        <button
          type="button"
          onClick={() => setAiOpen((v) => !v)}
          className={`cn-immersive-ai-toggle ${aiOpen ? "is-open" : ""}`}
        >
          <Sparkles size={16} />
          IA Jurídica
        </button>
      </header>

      <CuadernoEditorChrome
        layoutMode={chrome.layoutMode}
        onLayoutChange={chrome.setLayoutMode}
        pageSizeMode={activePage.pageSizeMode}
        onPageSizeChange={(mode) => applyDoc(updatePage(doc, activePage.id, { pageSizeMode: mode }))}
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

      <div className="cn-immersive-workspace">
        <CuadernoPageSidebar
          pages={doc.pages}
          activePageId={doc.activePageId}
          onSelect={(id) => applyDoc(switchActivePage(doc, id))}
          onAdd={handleNewPage}
          onDuplicate={(id) => applyDoc(duplicatePage(doc, id))}
          onRemove={(id) => applyDoc(removePage(doc, id))}
          onMove={(id, dir) => applyDoc(movePage(doc, id, dir))}
          onRename={(id, title) => applyDoc(updatePage(doc, id, { title }))}
          onToggleFavorite={(id) => applyDoc(togglePageFavorite(doc, id))}
          onOpenSettings={(id) => {
            applyDoc(switchActivePage(doc, id));
            setPageSettingsOpen(true);
          }}
          onChangeTemplate={(id) => openTemplateGalleryFor(id)}
        />

        <div className="cn-immersive-editor-column">
      <CuadernoEditorToolbar
        editor={tiptapEditor}
        courseAccent={coverArt.accent}
        disabled={!canvasWriteMode}
        onAiAction={(action, text) => {
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
            void handleAsk("flashcards", text);
          } else if (action === "relate") {
            void handleAsk("relate", text);
          } else {
            void handleAsk(action, `Sobre: «${text}»`);
          }
        }}
      />

      <main className="cn-immersive-main">
        <motion.div
          className="cn-immersive-paper-shell"
          key={`${doc.activePageId}-${activePage.templateId}-${activePage.paperTone}-${activePage.pageSizeMode}-${chrome.layoutMode}`}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <CuadernoCanvasEditor
            immersive
            externalToolbar
            notes={notes}
            onChange={(raw) => applyDoc(parseCuadernoDocument(raw))}
            layoutMode={chrome.layoutMode}
            paperTone={activePage.paperTone}
            marginMode={activePage.marginMode}
            pageSizeMode={activePage.pageSizeMode}
            templateId={activePage.templateId}
            courseAccent={coverArt.accent}
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
              } else {
                void handleAsk(action, `Sobre: «${text}»`);
              }
            }}
          />
        </motion.div>
      </main>
        </div>

        <CuadernoBlockInspector
          editor={tiptapEditor}
          open={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          courseAccent={coverArt.accent}
        />
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
      />

      {error ? <p className="cn-immersive-error">{error}</p> : null}
    </motion.div>
  );
}
