"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { PdfViewerPanel } from "@/components/guided-study/pdf-viewer-panel";
import { LegalTutorPanel } from "@/components/guided-study/legal-tutor-panel";
import { StudyPageNavigator } from "@/components/guided-study/study-page-navigator";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { filterAnalysisForExamMode } from "@/lib/guided-study/legal-tutor";
import {
  fetchLegalSourcesSettings,
  getEnabledSources,
  loadLegalSourcesSettings,
} from "@/lib/legal-sources/storage";
import {
  getStudyProgressPercent,
  loadGuidedStudySession,
  markPageUnderstood,
  updateCurrentPage,
} from "@/lib/guided-study/progress";
import type {
  DocumentStudyIndex,
  GuidedStudyTutorAction,
  PageProfessorAnalysis,
} from "@/types/guided-legal-study";
import type { LegalSourceAttribution, LegalSourcesSettings } from "@/types/legal-sources";
import "./guided-study.css";

type MaterialInfo = {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  courseName: string;
  cycleLabel: string;
  totalPages: number;
};

type TutorState = {
  analysis: PageProfessorAnalysis | null;
  customReply: string | null;
  activeSources: LegalSourceAttribution[];
};

export function GuidedLegalStudyWorkspace({ materialId }: { materialId: string }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [material, setMaterial] = useState<MaterialInfo | null>(null);
  const [index, setIndex] = useState<DocumentStudyIndex | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [understoodPages, setUnderstoodPages] = useState<number[]>([]);
  const [showIndex, setShowIndex] = useState(false);
  const [examOnly, setExamOnly] = useState(false);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [sourceSettings, setSourceSettings] = useState<LegalSourcesSettings | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorState, setTutorState] = useState<TutorState>({
    analysis: null,
    customReply: null,
    activeSources: [],
  });
  const [analyzedPage, setAnalyzedPage] = useState<number | null>(null);
  const initialAnalysisDone = useRef(false);
  const initProgress = useLoadingProgress(phase === "loading", "guidedStudyInit");
  const tutorProgress = useLoadingProgress(tutorLoading, "aiAnalyze");

  useEffect(() => {
    const session = loadGuidedStudySession(materialId);
    if (session) {
      setCurrentPage(session.currentPage);
      setUnderstoodPages(session.understoodPages);
    }
    const local = loadLegalSourcesSettings();
    setSourceSettings(local);
    setSelectedSourceIds(getEnabledSources(local).map((s) => s.id));
    void fetchLegalSourcesSettings().then((remote) => {
      setSourceSettings(remote);
      setSelectedSourceIds(getEnabledSources(remote).map((s) => s.id));
    });
  }, [materialId]);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      setPhase("loading");
      setError("");

      try {
        const response = await fetch("/api/guided-study/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo analizar el documento.");
        }

        if (cancelled) return;

        setMaterial(payload.material);
        setIndex(payload.index);
        setPhase("ready");

        const session = loadGuidedStudySession(materialId);
        if (session?.currentPage) {
          setCurrentPage(Math.min(session.currentPage, payload.material.totalPages));
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Error desconocido.");
          setPhase("error");
        }
      }
    }

    void analyze();
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  const askTutor = useCallback(
    async (action: GuidedStudyTutorAction, customPrompt?: string) => {
      if (!material) return;

      setTutorLoading(true);
      setActiveHighlightId(null);
      const settings = sourceSettings ?? loadLegalSourcesSettings();

      try {
        const response = await fetch("/api/guided-study/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId,
            pageNumber: currentPage,
            action,
            customPrompt,
            index,
            examOnly,
            sourceSettings: settings,
            sourceIds: selectedSourceIds.length ? selectedSourceIds : undefined,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Error del tutor.");
        }

        setTutorState({
          analysis: payload.analysis ?? null,
          customReply: payload.customReply ?? null,
          activeSources: payload.activeSources ?? [],
        });
        setAnalyzedPage(currentPage);
      } catch (caught) {
        setTutorState({
          analysis: null,
          customReply: caught instanceof Error ? caught.message : "Error consultando al profesor.",
          activeSources: [],
        });
      } finally {
        setTutorLoading(false);
      }
    },
    [material, materialId, currentPage, index, examOnly, sourceSettings, selectedSourceIds],
  );

  const availableSources = useMemo(
    () => (sourceSettings ? getEnabledSources(sourceSettings) : []),
    [sourceSettings],
  );

  function toggleSourceSelection(sourceId: string) {
    setSelectedSourceIds((prev) => {
      if (prev.includes(sourceId)) {
        const next = prev.filter((id) => id !== sourceId);
        return next.length ? next : availableSources.map((s) => s.id);
      }
      return [...prev, sourceId];
    });
  }

  function selectAllSources() {
    setSelectedSourceIds(availableSources.map((s) => s.id));
  }

  const defaultTutorAction = examOnly ? "exam_essentials" : "explain_page";

  useEffect(() => {
    if (phase !== "ready" || !material || initialAnalysisDone.current) return;
    initialAnalysisDone.current = true;
    void askTutor(defaultTutorAction);
  }, [phase, material?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialAnalysisDone.current || phase !== "ready" || !material) return;
    if (analyzedPage !== currentPage) return;
    void askTutor(defaultTutorAction);
  }, [examOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialAnalysisDone.current || phase !== "ready" || !material) return;
    if (analyzedPage !== currentPage) return;
    void askTutor(defaultTutorAction);
  }, [selectedSourceIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayAnalysis = useMemo(() => {
    if (!tutorState.analysis) return null;
    return filterAnalysisForExamMode(tutorState.analysis, examOnly);
  }, [tutorState.analysis, examOnly]);

  function handlePageChange(page: number) {
    setCurrentPage(page);
    updateCurrentPage(materialId, page);
    setActiveHighlightId(null);
    if (page !== analyzedPage) {
      setTutorState({ analysis: null, customReply: null, activeSources: [] });
    }
  }

  function handleGeneratePage() {
    void askTutor(defaultTutorAction);
  }

  function handleMarkUnderstood() {
    const session = markPageUnderstood(materialId, currentPage);
    setUnderstoodPages(session.understoodPages);
    if (material && currentPage < material.totalPages) {
      handlePageChange(currentPage + 1);
    }
  }

  const progressPercent =
    material && understoodPages.length
      ? getStudyProgressPercent(
          { materialId, currentPage, understoodPages, lastUpdated: "" },
          material.totalPages,
        )
      : 0;

  const currentChapter = index?.chapters.find(
    (ch) => currentPage >= ch.startPage && currentPage <= ch.endPage,
  );

  if (phase === "loading") {
    return (
      <LoadingState
        active
        preset="guidedStudyInit"
        percent={initProgress.percent}
        message={initProgress.message}
        stageLabel={initProgress.stageLabel}
        variant="overlay"
        className="min-h-[60vh]"
      />
    );
  }

  if (phase === "error" || !material || !index) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-red-400" />
        <p className="mt-4 font-semibold text-[#F5F7FA]">No se pudo iniciar el estudio guiado</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Link
          href={`/materials/${materialId}`}
          className="tron-btn-secondary mt-6 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold"
        >
          Volver al material
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4.5rem)] min-h-[32rem] flex-col gap-2">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.45)] px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
            <Sparkles size={11} />
            Estudio guiado
          </p>
          <h1 className="truncate text-base font-bold text-[#F5F7FA]">{material.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Pág. {currentPage}/{material.totalPages} · {progressPercent}%
          </span>
          <button
            type="button"
            onClick={() => setShowIndex(true)}
            className="tron-btn-secondary flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold"
          >
            <BookOpen size={13} />
            Índice
          </button>
        </div>
      </header>

      <StudyPageNavigator
        currentPage={currentPage}
        totalPages={material.totalPages}
        loading={tutorLoading}
        loadingPercent={tutorProgress.percent}
        onPageChange={handlePageChange}
        onGenerate={handleGeneratePage}
        pageUnderstood={understoodPages.includes(currentPage)}
      />

      <div className="relative min-h-0 flex-1">
        <div className="grid h-full gap-2 lg:grid-cols-[7fr_3fr]">
          <PdfViewerPanel
            fileUrl={material.fileUrl}
            pageNumber={currentPage}
            totalPages={material.totalPages}
            onPageChange={handlePageChange}
          />

          <LegalTutorPanel
            loading={tutorLoading}
            loadingPercent={tutorProgress.percent}
            loadingMessage={tutorProgress.message}
            loadingStageLabel={tutorProgress.stageLabel}
            analysis={displayAnalysis}
            customReply={tutorState.customReply}
            examOnly={examOnly}
            activeSources={tutorState.activeSources}
            availableSources={availableSources}
            selectedSourceIds={selectedSourceIds}
            onToggleSource={toggleSourceSelection}
            onSelectAllSources={selectAllSources}
            needsGeneration={analyzedPage !== currentPage}
            onExamOnlyChange={setExamOnly}
            activeHighlightId={activeHighlightId}
            onHighlightFocus={setActiveHighlightId}
            onAction={(action) => void askTutor(action)}
            onCustomAsk={(prompt) => void askTutor("custom", prompt)}
            onMarkUnderstood={handleMarkUnderstood}
            onGeneratePage={handleGeneratePage}
            pageUnderstood={understoodPages.includes(currentPage)}
          />
        </div>

        <AnimatePresence>
          {showIndex ? (
            <>
              <motion.div
                className="absolute inset-0 z-20 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowIndex(false)}
              />
              <motion.aside
                className="absolute left-0 top-0 z-30 flex h-full w-[min(100%,300px)] flex-col overflow-hidden rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[#07131a] shadow-2xl"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
              >
                <div className="flex items-center justify-between border-b border-[rgba(0,255,213,0.1)] px-3 py-2">
                  <p className="text-sm font-bold text-[#F5F7FA]">Índice</p>
                  <button type="button" onClick={() => setShowIndex(false)} className="rounded p-1 text-muted-foreground hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  {index.summary ? (
                    <p className="mb-3 rounded-lg border border-[rgba(0,255,213,0.1)] bg-[rgba(0,0,0,0.2)] px-2.5 py-2 text-xs leading-5 text-muted-foreground">
                      {index.summary}
                    </p>
                  ) : null}
                  <div className="space-y-1.5">
                    {index.chapters.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          handlePageChange(ch.startPage);
                          setShowIndex(false);
                        }}
                        className={`flex w-full flex-col gap-1 rounded-lg border px-2.5 py-2 text-left text-sm ${
                          currentChapter?.id === ch.id
                            ? "border-[rgba(0,255,213,0.35)] bg-[rgba(0,255,213,0.08)]"
                            : "border-[rgba(0,255,213,0.08)]"
                        }`}
                      >
                        <span className="flex items-start gap-2">
                          <ChevronRight size={13} className="mt-0.5 shrink-0 text-[#00FFD5]" />
                          <span className="font-medium text-[#F5F7FA]">{ch.title}</span>
                        </span>
                        {ch.learningOverview ? (
                          <span className="pl-5 text-[11px] leading-4 text-muted-foreground">
                            {ch.learningOverview}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
