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
  buildSourceFingerprint,
  loadTutorCache,
  saveTutorCache,
  type TutorCacheScope,
} from "@/lib/guided-study/tutor-cache";
import { getLibrarySetupStatus } from "@/lib/legal-sources/library-setup";
import {
  fetchLegalSourcesSettings,
  getEnabledSources,
  getManageableSources,
  loadLegalSourcesSettings,
  saveLegalSourcesSettings,
  syncLegalSourcesSettings,
  updateSourceInSettings,
} from "@/lib/legal-sources/storage";
import {
  GUIDED_STUDY_ANALYSIS_VERSION,
  isAnalysisStale,
} from "@/lib/guided-study/analysis-version";
import {
  getStudyProgressPercent,
  loadGuidedStudySession,
  markPageUnderstood,
  updateCurrentPage,
} from "@/lib/guided-study/progress";
import {
  fetchCloudGuidedStudySession,
  mergeGuidedStudySessions,
} from "@/lib/guided-study/progress-sync";
import type {
  DocumentStudyIndex,
  GuidedStudyTutorAction,
  PageProfessorAnalysis,
  TutorResponse,
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
  const [practiceExam, setPracticeExam] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"pdf" | "tutor">("pdf");
  const [analysisVersion, setAnalysisVersion] = useState(GUIDED_STUDY_ANALYSIS_VERSION);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [sourceSettings, setSourceSettings] = useState<LegalSourcesSettings | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorState, setTutorState] = useState<TutorState>({
    analysis: null,
    customReply: null,
    activeSources: [],
  });
  const [analyzedScope, setAnalyzedScope] = useState<TutorCacheScope | null>(null);
  const [tutorScope, setTutorScope] = useState<TutorCacheScope>({ type: "page", pageNumber: 1 });
  const [sourcesStale, setSourcesStale] = useState(false);
  const initialAnalysisDone = useRef(false);
  const initProgress = useLoadingProgress(phase === "loading", "guidedStudyInit");
  const tutorProgress = useLoadingProgress(tutorLoading, "aiAnalyze");

  useEffect(() => {
    const local = loadGuidedStudySession(materialId);
    void fetchCloudGuidedStudySession(materialId).then((remote) => {
      const session = mergeGuidedStudySessions(local, remote);
      if (!session) return;
      setCurrentPage(session.currentPage);
      setTutorScope({ type: "page", pageNumber: session.currentPage });
      setUnderstoodPages(session.understoodPages);
      setAnalysisVersion(session.analysisVersion ?? 1);
    });
    if (local) {
      setCurrentPage(local.currentPage);
      setTutorScope({ type: "page", pageNumber: local.currentPage });
      setUnderstoodPages(local.understoodPages);
      setAnalysisVersion(local.analysisVersion ?? 1);
    }
    setSourceSettings(loadLegalSourcesSettings());
    void fetchLegalSourcesSettings().then(setSourceSettings);
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

  const applyTutorResult = useCallback(
    (
      scope: TutorCacheScope,
      payload: {
        analysis?: PageProfessorAnalysis | null;
        customReply?: string | null;
        activeSources?: LegalSourceAttribution[];
      },
      settings: LegalSourcesSettings,
    ) => {
      const result: Pick<TutorResponse, "analysis" | "customReply" | "activeSources"> = {
        analysis: payload.analysis ?? undefined,
        customReply: payload.customReply ?? undefined,
        activeSources: payload.activeSources,
      };
      setTutorState({
        analysis: result.analysis ?? null,
        customReply: result.customReply ?? null,
        activeSources: result.activeSources ?? [],
      });
      setAnalyzedScope(scope);
      setTutorScope(scope);
      setSourcesStale(false);
      saveTutorCache(materialId, scope, examOnly, buildSourceFingerprint(settings), result);
    },
    [materialId, examOnly],
  );

  const tryLoadCachedTutor = useCallback(
    (scope: TutorCacheScope, settings: LegalSourcesSettings) => {
      const cached = loadTutorCache(
        materialId,
        scope,
        examOnly,
        buildSourceFingerprint(settings),
      );
      if (!cached) return false;
      setTutorState({
        analysis: cached.analysis ?? null,
        customReply: cached.customReply ?? null,
        activeSources: cached.activeSources ?? [],
      });
      setAnalyzedScope(scope);
      setSourcesStale(false);
      return true;
    },
    [materialId, examOnly],
  );

  const askTutor = useCallback(
    async (
      action: GuidedStudyTutorAction,
      options?: {
        customPrompt?: string;
        settingsOverride?: LegalSourcesSettings;
        scope?: TutorCacheScope;
        chapterId?: string;
        skipCache?: boolean;
      },
    ) => {
      if (!material) return;

      const settings = options?.settingsOverride ?? sourceSettings ?? loadLegalSourcesSettings();
      const scope =
        options?.scope ??
        (options?.chapterId
          ? { type: "chapter" as const, chapterId: options.chapterId }
          : { type: "page" as const, pageNumber: currentPage });

      if (!options?.skipCache) {
        const cached = loadTutorCache(
          materialId,
          scope,
          examOnly,
          buildSourceFingerprint(settings),
        );
        if (cached) {
          setTutorState({
            analysis: cached.analysis ?? null,
            customReply: cached.customReply ?? null,
            activeSources: cached.activeSources ?? [],
          });
          setAnalyzedScope(scope);
          setTutorScope(scope);
          setSourcesStale(false);
          return;
        }
      }

      setTutorLoading(true);
      setActiveHighlightId(null);

      try {
        const response = await fetch("/api/guided-study/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId,
            pageNumber: scope.type === "page" ? scope.pageNumber : currentPage,
            action,
            customPrompt: options?.customPrompt,
            index,
            examOnly,
            sourceSettings: settings,
            chapterId: options?.chapterId ?? (scope.type === "chapter" ? scope.chapterId : undefined),
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Error del tutor.");
        }

        applyTutorResult(scope, payload, settings);
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
    [
      material,
      materialId,
      currentPage,
      index,
      examOnly,
      sourceSettings,
      applyTutorResult,
    ],
  );

  const manageableSources = useMemo(
    () => (sourceSettings ? getManageableSources(sourceSettings) : []),
    [sourceSettings],
  );

  const enabledSources = useMemo(
    () => (sourceSettings ? getEnabledSources(sourceSettings) : []),
    [sourceSettings],
  );

  const librarySetup = useMemo(
    () => getLibrarySetupStatus(sourceSettings),
    [sourceSettings],
  );

  const scopesMatch = useCallback((a: TutorCacheScope | null, b: TutorCacheScope) => {
    if (!a) return false;
    if (a.type !== b.type) return false;
    return a.type === "page"
      ? b.type === "page" && a.pageNumber === b.pageNumber
      : b.type === "chapter" && a.chapterId === b.chapterId;
  }, []);

  const needsGeneration = !scopesMatch(analyzedScope, tutorScope);

  const chapterMode =
    tutorScope.type === "chapter" && scopesMatch(analyzedScope, tutorScope);

  const highlightPhrase = useMemo(() => {
    if (!activeHighlightId || !tutorState.analysis) return null;
    return (
      tutorState.analysis.highlights.find((h) => h.id === activeHighlightId)?.phrase ?? null
    );
  }, [activeHighlightId, tutorState.analysis]);

  function persistSourceEnabled(sourceId: string) {
    const current = sourceSettings ?? loadLegalSourcesSettings();
    const source = current.sources.find((s) => s.id === sourceId);
    if (!source) return;

    const next = updateSourceInSettings(current, sourceId, { enabled: !source.enabled });
    setSourceSettings(next);
    saveLegalSourcesSettings(next);
    void syncLegalSourcesSettings(next);

    if (scopesMatch(analyzedScope, tutorScope)) {
      setSourcesStale(true);
    }
  }

  function enableAllSources() {
    const current = sourceSettings ?? loadLegalSourcesSettings();
    let next = current;
    for (const source of getManageableSources(current)) {
      if (!source.enabled) {
        next = updateSourceInSettings(next, source.id, { enabled: true });
      }
    }
    if (next === current) return;

    setSourceSettings(next);
    saveLegalSourcesSettings(next);
    void syncLegalSourcesSettings(next);

    if (scopesMatch(analyzedScope, tutorScope)) {
      setSourcesStale(true);
    }
  }

  const defaultTutorAction = examOnly ? "exam_essentials" : "explain_page";

  function handleRefreshExplanation() {
    void askTutor(
      tutorScope.type === "chapter" ? "explain_chapter" : defaultTutorAction,
      {
        scope: tutorScope,
        chapterId: tutorScope.type === "chapter" ? tutorScope.chapterId : undefined,
        skipCache: true,
      },
    );
  }

  useEffect(() => {
    if (phase !== "ready" || !material || initialAnalysisDone.current) return;
    initialAnalysisDone.current = true;
    const scope = { type: "page" as const, pageNumber: currentPage };
    setTutorScope(scope);
    void askTutor(defaultTutorAction, { scope });
  }, [phase, material?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialAnalysisDone.current || phase !== "ready" || !material) return;
    if (tutorScope.type !== "page" || tutorScope.pageNumber !== currentPage) return;
    if (!scopesMatch(analyzedScope, tutorScope)) return;
    void askTutor(defaultTutorAction, { scope: tutorScope, skipCache: true });
  }, [examOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayAnalysis = useMemo(() => {
    if (!tutorState.analysis) return null;
    return filterAnalysisForExamMode(tutorState.analysis, examOnly);
  }, [tutorState.analysis, examOnly]);

  function handlePageChange(page: number) {
    const scope = { type: "page" as const, pageNumber: page };
    setCurrentPage(page);
    setTutorScope(scope);
    updateCurrentPage(materialId, page);
    setActiveHighlightId(null);
    setSourcesStale(false);
    setPracticeExam(false);

    const settings = sourceSettings ?? loadLegalSourcesSettings();
    if (!tryLoadCachedTutor(scope, settings)) {
      setTutorState({ analysis: null, customReply: null, activeSources: [] });
      setAnalyzedScope(null);
    }
  }

  function handleGeneratePage() {
    const scope = { type: "page" as const, pageNumber: currentPage };
    setTutorScope(scope);
    void askTutor(defaultTutorAction, { scope, skipCache: true });
  }

  function handleExplainChapter(chapterId?: string) {
    const chapter = chapterId
      ? index?.chapters.find((ch) => ch.id === chapterId)
      : currentChapter;
    if (!chapter) return;

    const scope = { type: "chapter" as const, chapterId: chapter.id };
    setTutorScope(scope);
    setPracticeExam(false);
    setCurrentPage(chapter.startPage);
    updateCurrentPage(materialId, chapter.startPage);
    void askTutor("explain_chapter", { scope, chapterId: chapter.id, skipCache: true });
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
        onExplainChapter={() => handleExplainChapter()}
        showExplainChapter={Boolean(currentChapter)}
        pageUnderstood={understoodPages.includes(currentPage)}
      />

      {isAnalysisStale(analysisVersion) ? (
        <div className="gs-stale-analysis-banner mx-2 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[rgba(255,138,0,0.25)] bg-[rgba(255,138,0,0.08)] px-3 py-2">
          <p className="text-xs text-[#F5F7FA]">
            Este material fue analizado con una versión anterior del profesor IA.
          </p>
          <button
            type="button"
            disabled={tutorLoading}
            onClick={() => {
              setAnalysisVersion(GUIDED_STUDY_ANALYSIS_VERSION);
              void askTutor(defaultTutorAction, { scope: tutorScope, skipCache: true });
            }}
            className="gs-refresh-explanation-btn"
          >
            <Sparkles size={12} />
            Re-analizar página
          </button>
        </div>
      ) : null}

      <div className="flex gap-1 px-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePanel("pdf")}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${mobilePanel === "pdf" ? "bg-[rgba(0,255,213,0.15)] text-[#00FFD5]" : "bg-[rgba(0,0,0,0.25)] text-muted-foreground"}`}
        >
          PDF
        </button>
        <button
          type="button"
          onClick={() => setMobilePanel("tutor")}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${mobilePanel === "tutor" ? "bg-[rgba(0,255,213,0.15)] text-[#00FFD5]" : "bg-[rgba(0,0,0,0.25)] text-muted-foreground"}`}
        >
          Profesor IA
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="grid h-full gap-2 lg:grid-cols-[7fr_3fr]">
          <div className={`min-h-0 ${mobilePanel === "tutor" ? "hidden lg:block" : ""}`}>
            <PdfViewerPanel
              fileUrl={material.fileUrl}
              pageNumber={currentPage}
              totalPages={material.totalPages}
              highlightPhrase={highlightPhrase}
              onPageChange={handlePageChange}
            />
          </div>

          <div className={`min-h-0 ${mobilePanel === "pdf" ? "hidden lg:block" : ""}`}>
          <LegalTutorPanel
            loading={tutorLoading}
            loadingPercent={tutorProgress.percent}
            loadingMessage={tutorProgress.message}
            loadingStageLabel={tutorProgress.stageLabel}
            analysis={displayAnalysis}
            customReply={tutorState.customReply}
            examOnly={examOnly}
            practiceExam={practiceExam}
            sourceSettings={sourceSettings}
            activeSources={tutorState.activeSources}
            manageableSources={manageableSources}
            onToggleSource={persistSourceEnabled}
            onEnableAllSources={enableAllSources}
            hasEnabledSources={enabledSources.length > 0}
            sourcesStale={sourcesStale}
            onRefreshExplanation={handleRefreshExplanation}
            setupSteps={librarySetup.steps}
            needsSetup={librarySetup.needsSetup}
            chapterMode={chapterMode}
            needsGeneration={needsGeneration}
            onExamOnlyChange={setExamOnly}
            activeHighlightId={activeHighlightId}
            onHighlightFocus={setActiveHighlightId}
            onAction={(action) => {
              if (action === "exam_mode") setPracticeExam(true);
              void askTutor(action, {
                scope: tutorScope,
                chapterId: tutorScope.type === "chapter" ? tutorScope.chapterId : undefined,
                skipCache: true,
              });
            }}
            onCustomAsk={(prompt) =>
              void askTutor("custom", {
                customPrompt: prompt,
                scope: tutorScope,
                chapterId: tutorScope.type === "chapter" ? tutorScope.chapterId : undefined,
                skipCache: true,
              })
            }
            onMarkUnderstood={handleMarkUnderstood}
            onGeneratePage={handleGeneratePage}
            pageUnderstood={understoodPages.includes(currentPage)}
          />
          </div>
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
                      <div
                        key={ch.id}
                        className={`rounded-lg border px-2.5 py-2 ${
                          currentChapter?.id === ch.id
                            ? "border-[rgba(0,255,213,0.35)] bg-[rgba(0,255,213,0.08)]"
                            : "border-[rgba(0,255,213,0.08)]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handlePageChange(ch.startPage);
                            setShowIndex(false);
                          }}
                          className="flex w-full flex-col gap-1 text-left text-sm"
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
                        <button
                          type="button"
                          disabled={tutorLoading}
                          onClick={() => {
                            handleExplainChapter(ch.id);
                            setShowIndex(false);
                          }}
                          className="gs-index-chapter-btn mt-2 w-full"
                        >
                          <Sparkles size={12} />
                          Explicar capítulo
                        </button>
                      </div>
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
