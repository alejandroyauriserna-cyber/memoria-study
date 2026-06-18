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
import {
  GUIDED_STUDY_CLIENT_TIMEOUT_MS,
  guidedStudyClientTimeoutSeconds,
} from "@/lib/guided-study/timeouts";
import { filterAnalysisForExamMode } from "@/lib/guided-study/legal-tutor";
import { ensureActiveLearning } from "@/lib/guided-study/ensure-active-learning";
import {
  buildSourceFingerprint,
  findPracticePageCache,
  loadTutorCache,
  saveTutorCache,
  type TutorCacheScope,
} from "@/lib/guided-study/tutor-cache";
import { fetchRemoteTutorCache } from "@/lib/guided-study/tutor-cache-remote";
import {
  appendLocalTutorChatMessage,
  createClientTutorChatMessage,
  findLocalChatAnswer,
  loadLocalTutorChat,
  saveLocalTutorChat,
} from "@/lib/guided-study/tutor-chat-local";
import { fetchRemoteTutorChat } from "@/lib/guided-study/tutor-chat-remote";
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
  appendLearningActivity,
  markSurpriseShown,
  endStudySession,
  saveGuidedStudySession,
} from "@/lib/guided-study/progress";
import {
  computeMasteryPercent,
  getPageLearningStatus,
  shouldShowSurpriseOnPageEnter,
} from "@/lib/guided-study/learning-mastery";
import { loadProfessorStyle } from "@/lib/guided-study/professor-style";
import { isSocraticTrigger } from "@/lib/guided-study/socratic-tutor";
import {
  getDueSpacedReviews,
  markSpacedReviewDone,
} from "@/lib/guided-study/spaced-repetition";
import { getContinuityGreeting } from "@/lib/guided-study/session-continuity";
import { MasteryProgressBadge } from "@/components/guided-study/mastery-progress-badge";
import { SurpriseQuestionOverlay } from "@/components/guided-study/surprise-question-overlay";
import { SessionDiagnosisPanel } from "@/components/guided-study/session-diagnosis-panel";
import { SpacedReviewBanner } from "@/components/guided-study/spaced-review-banner";
import type { GuidedStudySession, OralDefenseEvaluation, ProfessorTeachingStyle, SurpriseQuestion } from "@/types/guided-legal-study";
import {
  fetchCloudGuidedStudySession,
  mergeGuidedStudySessions,
} from "@/lib/guided-study/progress-sync";
import type {
  DocumentStudyIndex,
  GuidedStudyTutorAction,
  PageProfessorAnalysis,
  TutorChatMessage,
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
  const [studySession, setStudySession] = useState<GuidedStudySession | null>(null);
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [surpriseQuestion, setSurpriseQuestion] = useState<SurpriseQuestion | null>(null);
  const [showIndex, setShowIndex] = useState(false);
  const [examOnly, setExamOnly] = useState(false);
  const [practiceExam, setPracticeExam] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"pdf" | "tutor" | "split">("tutor");
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
  const [chatMessages, setChatMessages] = useState<TutorChatMessage[]>([]);
  const [professorStyle, setProfessorStyle] = useState<ProfessorTeachingStyle>("university");
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [continuityDismissed, setContinuityDismissed] = useState(false);
  const [spacedSkippedIds, setSpacedSkippedIds] = useState<string[]>([]);
  const initialAnalysisDone = useRef(false);
  const initProgress = useLoadingProgress(phase === "loading", "guidedStudyInit", {
    stageIntervalMs: 5500,
    tickMs: 800,
    maxSimulatedPercent: 92,
  });
  const tutorProgress = useLoadingProgress(tutorLoading, "aiAnalyze", {
    stageIntervalMs: 6000,
    tickMs: 900,
    maxSimulatedPercent: 92,
  });

  useEffect(() => {
    initialAnalysisDone.current = false;
  }, [materialId]);

  useEffect(() => {
    function clampSplitOnPhone() {
      if (window.matchMedia("(max-width: 639px)").matches && mobilePanel === "split") {
        setMobilePanel("tutor");
      }
    }
    clampSplitOnPhone();
    window.addEventListener("resize", clampSplitOnPhone);
    return () => window.removeEventListener("resize", clampSplitOnPhone);
  }, [mobilePanel]);

  useEffect(() => {
    const local = loadGuidedStudySession(materialId);
    void fetchCloudGuidedStudySession(materialId).then((remote) => {
      const session = mergeGuidedStudySessions(local, remote);
      if (!session) return;
      setCurrentPage(session.currentPage);
      setTutorScope({ type: "page", pageNumber: session.currentPage });
      setUnderstoodPages(session.understoodPages);
      setAnalysisVersion(session.analysisVersion ?? 1);
      setStudySession(session);
    });
    if (local) {
      setCurrentPage(local.currentPage);
      setTutorScope({ type: "page", pageNumber: local.currentPage });
      setUnderstoodPages(local.understoodPages);
      setAnalysisVersion(local.analysisVersion ?? 1);
      setStudySession(local);
    }
    setSourceSettings(loadLegalSourcesSettings());
    setProfessorStyle(loadProfessorStyle());
    void fetchLegalSourcesSettings().then(setSourceSettings);
  }, [materialId]);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      setPhase("loading");
      setError("");

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), GUIDED_STUDY_CLIENT_TIMEOUT_MS);

      try {
        const response = await fetch("/api/guided-study/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId }),
          signal: controller.signal,
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
          const message =
            caught instanceof Error && caught.name === "AbortError"
              ? `El análisis del PDF superó ${guidedStudyClientTimeoutSeconds() / 60} minutos. Intenta de nuevo; la primera carga de un PDF largo puede tardar.`
              : caught instanceof Error
                ? caught.message
                : "Error desconocido.";
          setError(message);
          setPhase("error");
        }
      } finally {
        window.clearTimeout(timeoutId);
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
        customReply: null,
        activeSources: result.activeSources ?? [],
      });
      setAnalyzedScope(scope);
      setTutorScope(scope);
      setSourcesStale(false);
      saveTutorCache(materialId, scope, examOnly, buildSourceFingerprint(settings), {
        analysis: result.analysis,
        activeSources: result.activeSources,
      });
    },
    [materialId, examOnly],
  );

  const tryLoadCachedTutor = useCallback(
    async (scope: TutorCacheScope, settings: LegalSourcesSettings) => {
      const fingerprint = buildSourceFingerprint(settings);
      const local = loadTutorCache(materialId, scope, examOnly, fingerprint);
      if (local) {
        setTutorState({
          analysis: local.analysis ?? null,
          customReply: null,
          activeSources: local.activeSources ?? [],
        });
        setAnalyzedScope(scope);
        setSourcesStale(false);
        return true;
      }

      try {
        const remote = await fetchRemoteTutorCache(materialId, scope, examOnly, settings);
        if (remote) {
          saveTutorCache(materialId, scope, examOnly, fingerprint, remote);
          setTutorState({
            analysis: remote.analysis ?? null,
            customReply: null,
            activeSources: remote.activeSources ?? [],
          });
          setAnalyzedScope(scope);
          setSourcesStale(false);
          return true;
        }
      } catch {
        // Sin conexión o tabla aún no migrada: seguir sin bloquear.
      }

      return false;
    },
    [materialId, examOnly],
  );

  const syncChatForScope = useCallback(
    async (scope: TutorCacheScope, settings: LegalSourcesSettings) => {
      const fingerprint = buildSourceFingerprint(settings);
      const local = loadLocalTutorChat(materialId, scope, examOnly, fingerprint);
      setChatMessages(local);

      try {
        const remote = await fetchRemoteTutorChat(materialId, scope, examOnly, settings);
        if (remote.length) {
          saveLocalTutorChat(materialId, scope, examOnly, fingerprint, remote);
          setChatMessages(remote);
        }
      } catch {
        // Sin conexión: mantener historial local.
      }
    },
    [materialId, examOnly],
  );

  const askCustomQuestion = useCallback(
    async (question: string) => {
      if (!material || !question.trim()) return;

      const settings = sourceSettings ?? loadLegalSourcesSettings();
      const scope = tutorScope;
      const fingerprint = buildSourceFingerprint(settings);

      const localCached = findLocalChatAnswer(
        materialId,
        scope,
        examOnly,
        fingerprint,
        question,
      );
      if (localCached) {
        const message = createClientTutorChatMessage(question, localCached, true);
        setChatMessages(
          appendLocalTutorChatMessage(materialId, scope, examOnly, fingerprint, message),
        );
        return;
      }

      setTutorLoading(true);
      setActiveHighlightId(null);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), GUIDED_STUDY_CLIENT_TIMEOUT_MS);

      try {
        const response = await fetch("/api/guided-study/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId,
            pageNumber: scope.type === "page" ? scope.pageNumber : currentPage,
            action: "custom",
            customPrompt: question,
            index,
            examOnly,
            sourceSettings: settings,
            chapterId: scope.type === "chapter" ? scope.chapterId : undefined,
            teachingStyle: professorStyle,
            caseNarrative: studySession?.caseNarrative,
            socraticMode: isSocraticTrigger(question),
          }),
          signal: controller.signal,
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Error del tutor.");
        }

        const answer = payload.customReply?.trim();
        if (!answer) {
          throw new Error("El profesor IA no devolvió una respuesta.");
        }

        const message =
          payload.chatMessage ??
          createClientTutorChatMessage(question, answer, Boolean(payload.fromChatCache));

        setChatMessages(
          appendLocalTutorChatMessage(materialId, scope, examOnly, fingerprint, message),
        );

        if (payload.activeSources?.length) {
          setTutorState((prev) => ({
            ...prev,
            activeSources: payload.activeSources,
          }));
        }
      } catch (caught) {
        const message =
          caught instanceof Error && caught.name === "AbortError"
            ? `El profesor IA sigue procesando contenido denso. Espera hasta ${guidedStudyClientTimeoutSeconds() / 60} min o inténtalo de nuevo.`
            : caught instanceof Error
              ? caught.message
              : "Error consultando al profesor.";
        setChatMessages((prev) => [
          ...prev,
          createClientTutorChatMessage(question, message),
        ]);
      } finally {
        window.clearTimeout(timeoutId);
        setTutorLoading(false);
      }
    },
    [material, materialId, tutorScope, currentPage, index, examOnly, sourceSettings, professorStyle, studySession?.caseNarrative],
  );

  const askTutorForVoice = useCallback(
    async (question: string): Promise<string> => {
      if (!material || !question.trim()) {
        throw new Error("Escribe o di una pregunta.");
      }

      const settings = sourceSettings ?? loadLegalSourcesSettings();
      const scope = tutorScope;
      const fingerprint = buildSourceFingerprint(settings);

      const localCached = findLocalChatAnswer(
        materialId,
        scope,
        examOnly,
        fingerprint,
        question,
      );
      if (localCached) return localCached;

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), GUIDED_STUDY_CLIENT_TIMEOUT_MS);

      try {
        const response = await fetch("/api/guided-study/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId,
            pageNumber: scope.type === "page" ? scope.pageNumber : currentPage,
            action: "custom",
            customPrompt: question,
            index,
            examOnly,
            sourceSettings: settings,
            chapterId: scope.type === "chapter" ? scope.chapterId : undefined,
            teachingStyle: professorStyle,
            caseNarrative: studySession?.caseNarrative,
            socraticMode: isSocraticTrigger(question),
          }),
          signal: controller.signal,
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Error del tutor.");
        }

        const answer = payload.customReply?.trim();
        if (!answer) {
          throw new Error("El profesor IA no devolvió una respuesta.");
        }

        const message =
          payload.chatMessage ??
          createClientTutorChatMessage(question, answer, Boolean(payload.fromChatCache));

        setChatMessages(
          appendLocalTutorChatMessage(materialId, scope, examOnly, fingerprint, message),
        );

        if (payload.activeSources?.length) {
          setTutorState((prev) => ({
            ...prev,
            activeSources: payload.activeSources,
          }));
        }

        return answer;
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [material, materialId, tutorScope, currentPage, index, examOnly, sourceSettings, professorStyle, studySession?.caseNarrative],
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

      if (action !== "custom" && !options?.skipCache) {
        const cached = loadTutorCache(
          materialId,
          scope,
          examOnly,
          buildSourceFingerprint(settings),
        );
        if (cached) {
          setTutorState({
            analysis: cached.analysis ?? null,
            customReply: null,
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

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), GUIDED_STUDY_CLIENT_TIMEOUT_MS);

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
            skipCache: options?.skipCache ?? false,
            teachingStyle: professorStyle,
            caseNarrative: studySession?.caseNarrative,
          }),
          signal: controller.signal,
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Error del tutor.");
        }

        if (!payload.analysis && !payload.customReply?.trim()) {
          throw new Error("El profesor IA no devolvió contenido para esta página. Intenta de nuevo.");
        }

        if (action === "custom") {
          return;
        }

        applyTutorResult(scope, payload, settings);
      } catch (caught) {
        const message =
          caught instanceof Error && caught.name === "AbortError"
            ? `El profesor IA superó ${guidedStudyClientTimeoutSeconds() / 60} minutos. Las explicaciones profundas pueden tardar; inténtalo de nuevo.`
            : caught instanceof Error
              ? caught.message
              : "Error consultando al profesor.";
        setTutorState((prev) => ({
          ...prev,
          analysis: null,
          customReply: message,
          activeSources: [],
        }));
        setAnalyzedScope(null);
      } finally {
        window.clearTimeout(timeoutId);
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
      professorStyle,
      studySession?.caseNarrative,
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
    if (phase !== "ready" || !material) return;
    const settings = sourceSettings ?? loadLegalSourcesSettings();
    void syncChatForScope(tutorScope, settings);
  }, [phase, material, tutorScope, examOnly, sourceSettings, syncChatForScope]);

  useEffect(() => {
    if (phase !== "ready" || !material || initialAnalysisDone.current) return;

    const scope = { type: "page" as const, pageNumber: currentPage };
    setTutorScope(scope);

    const settings = sourceSettings ?? loadLegalSourcesSettings();
    initialAnalysisDone.current = true;

    void tryLoadCachedTutor(scope, settings);
  }, [phase, material, currentPage, tryLoadCachedTutor, sourceSettings]);

  useEffect(() => {
    if (!initialAnalysisDone.current || phase !== "ready" || !material) return;
    if (tutorScope.type !== "page" || tutorScope.pageNumber !== currentPage) return;
    if (!scopesMatch(analyzedScope, tutorScope)) return;
    void askTutor(defaultTutorAction, { scope: tutorScope, skipCache: true });
  }, [examOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayAnalysis = useMemo(() => {
    if (!tutorState.analysis) return null;
    return filterAnalysisForExamMode(ensureActiveLearning(tutorState.analysis), examOnly);
  }, [tutorState.analysis, examOnly]);

  const practiceWhileLoading = useMemo(() => {
    if (!tutorLoading) return null;
    const settings = sourceSettings ?? loadLegalSourcesSettings();
    const fingerprint = buildSourceFingerprint(settings);
    return findPracticePageCache(materialId, currentPage, examOnly, fingerprint);
  }, [tutorLoading, materialId, currentPage, examOnly, sourceSettings]);

  function handlePageChange(page: number) {
    const previousPage = currentPage;
    const scope = { type: "page" as const, pageNumber: page };
    setCurrentPage(page);
    setTutorScope(scope);
    updateCurrentPage(materialId, page);
    setActiveHighlightId(null);
    setSourcesStale(false);
    setPracticeExam(false);

    const session = loadGuidedStudySession(materialId);
    setStudySession(session);

    if (page > previousPage && session && shouldShowSurpriseOnPageEnter(session, page)) {
      const settings = sourceSettings ?? loadLegalSourcesSettings();
      const fingerprint = buildSourceFingerprint(settings);
      const prevCache = findPracticePageCache(materialId, previousPage, examOnly, fingerprint);
      const q = prevCache?.analysis.surpriseQuestion;
      if (q?.question) {
        setSurpriseQuestion(q);
        setSurpriseOpen(true);
      }
    }

    const settings = sourceSettings ?? loadLegalSourcesSettings();
    void (async () => {
      if (await tryLoadCachedTutor(scope, settings)) return;
      setTutorState({ analysis: null, customReply: null, activeSources: [] });
      setAnalyzedScope(null);
    })();
  }

  function refreshStudySession() {
    const session = loadGuidedStudySession(materialId);
    setStudySession(session);
    if (session) setUnderstoodPages(session.understoodPages);
  }

  function handleApplyComplete(score: number, meta?: { concept?: string }) {
    const applyCase = tutorState.analysis?.activeLearning?.applyConcept;
    const updated = appendLearningActivity(
      materialId,
      {
        type: "apply_concept",
        pageNumber: currentPage,
        score,
        completedAt: new Date().toISOString(),
        concept: meta?.concept ?? applyCase?.studiedConcept,
      },
      { applyDone: true },
      applyCase ? { narrativeCase: applyCase } : undefined,
    );
    setStudySession(updated);
  }

  function handleRetrievalComplete(
    score: number,
    meta?: { concept?: string; strengths?: string[]; gaps?: string[] },
  ) {
    const updated = appendLearningActivity(
      materialId,
      {
        type: "retrieval",
        pageNumber: currentPage,
        score,
        completedAt: new Date().toISOString(),
        concept: meta?.concept,
        strengths: meta?.strengths,
        gaps: meta?.gaps,
      },
      { retrievalDone: true },
    );
    setStudySession(updated);
  }

  function handleFeynmanComplete(
    score: number,
    meta?: { concept?: string; strengths?: string[]; gaps?: string[] },
  ) {
    const updated = appendLearningActivity(
      materialId,
      {
        type: "feynman",
        pageNumber: currentPage,
        score,
        completedAt: new Date().toISOString(),
        concept: meta?.concept,
        strengths: meta?.strengths,
        gaps: meta?.gaps,
      },
      { feynmanDone: true },
    );
    setStudySession(updated);
  }

  function handleOralComplete(score: number, evaluation: OralDefenseEvaluation) {
    const updated = appendLearningActivity(
      materialId,
      {
        type: "oral_defense",
        pageNumber: currentPage,
        score,
        completedAt: new Date().toISOString(),
        concept: tutorState.analysis?.oralExamSeed?.question.slice(0, 80),
        strengths: evaluation.correctConcepts,
        gaps: [...evaluation.omittedConcepts, ...evaluation.errors],
      },
      {},
    );
    setStudySession(updated);
  }

  function dismissSurprise() {
    setSurpriseOpen(false);
    markSurpriseShown(materialId, currentPage);
    refreshStudySession();
  }

  function completeSurprise() {
    const updated = appendLearningActivity(
      materialId,
      {
        type: "surprise",
        pageNumber: currentPage,
        score: 70,
        completedAt: new Date().toISOString(),
      },
      {},
    );
    setStudySession(updated);
    dismissSurprise();
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
    setActiveHighlightId(null);
    setSourcesStale(false);

    const isInsideChapter =
      currentPage >= chapter.startPage && currentPage <= chapter.endPage;

    if (isInsideChapter) {
      updateCurrentPage(materialId, currentPage);
    } else {
      setCurrentPage(chapter.startPage);
      updateCurrentPage(materialId, chapter.startPage);
    }

    void (async () => {
      const settings = sourceSettings ?? loadLegalSourcesSettings();
      if (await tryLoadCachedTutor(scope, settings)) return;
      void askTutor("explain_chapter", { scope, chapterId: chapter.id });
    })();
  }

  function handleMarkUnderstood() {
    const session = markPageUnderstood(materialId, currentPage);
    setUnderstoodPages(session.understoodPages);
    setStudySession(session);
    if (material && currentPage < material.totalPages) {
      handlePageChange(currentPage + 1);
    }
  }

  const masteryPercent = computeMasteryPercent(studySession?.mastery);
  const pageLearningStatus = getPageLearningStatus(studySession, currentPage);

  const progressPercent =
    masteryPercent > 0
      ? masteryPercent
      : material && understoodPages.length
        ? getStudyProgressPercent(
            { materialId, currentPage, understoodPages, lastUpdated: "" },
            material.totalPages,
          )
        : 0;

  const currentChapter = index?.chapters.find(
    (ch) => currentPage >= ch.startPage && currentPage <= ch.endPage,
  );

  const continuityGreeting = useMemo(() => {
    if (continuityDismissed) return null;
    return getContinuityGreeting(studySession);
  }, [studySession, continuityDismissed]);

  const dueSpacedReview = useMemo(() => {
    const due = getDueSpacedReviews(studySession, 1)[0];
    if (!due || spacedSkippedIds.includes(due.id)) return null;
    return due;
  }, [studySession, spacedSkippedIds]);

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
        <p className="mt-4 font-semibold text-foreground">No se pudo iniciar el estudio guiado</p>
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
    <div className="gs-workspace">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            <Sparkles size={11} />
            Estudio guiado
          </p>
          <h1 className="truncate text-base font-bold text-foreground">{material.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <MasteryProgressBadge mastery={studySession?.mastery} />
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Pág. {currentPage}/{material.totalPages}
            {masteryPercent > 0 ? ` · Dominio ${masteryPercent}%` : ` · ${progressPercent}% leído`}
          </span>
          <button
            type="button"
            onClick={() => setShowDiagnosis(true)}
            className="tron-btn-secondary hidden h-8 items-center rounded-lg px-2.5 text-[11px] font-semibold sm:flex"
          >
            Diagnóstico
          </button>
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

      {dueSpacedReview ? (
        <SpacedReviewBanner
          review={dueSpacedReview}
          onComplete={(score) => {
            if (!studySession) return;
            const updated = markSpacedReviewDone(studySession, dueSpacedReview.id, score);
            saveGuidedStudySession(updated);
            setStudySession(updated);
          }}
          onDismiss={() => setSpacedSkippedIds((ids) => [...ids, dueSpacedReview.id])}
        />
      ) : null}

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
          <p className="text-xs text-foreground">
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

      <div className="flex gap-1 px-2 lg:hidden" role="tablist" aria-label="Vista de estudio">
        {(
          [
            { id: "tutor" as const, label: "Profesor IA" },
            { id: "pdf" as const, label: "PDF" },
            { id: "split" as const, label: "Ambos", phoneHidden: true },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={mobilePanel === tab.id}
            onClick={() => setMobilePanel(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${"phoneHidden" in tab && tab.phoneHidden ? "hidden sm:flex sm:flex-1 sm:items-center sm:justify-center" : ""} ${mobilePanel === tab.id ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative min-h-0 min-w-0 max-w-full flex-1 overflow-hidden">
        <div
          className={`h-full min-w-0 max-w-full gap-2 lg:grid lg:grid-cols-[7fr_3fr] ${
            mobilePanel === "split" ? "flex flex-col" : "grid"
          }`}
        >
          <div
            className={`min-h-0 ${
              mobilePanel === "tutor"
                ? "hidden lg:block"
                : mobilePanel === "split"
                  ? "h-36 shrink-0 sm:h-44 lg:h-auto"
                  : ""
            }`}
          >
            <PdfViewerPanel
              fileUrl={material.fileUrl}
              pageNumber={currentPage}
              totalPages={material.totalPages}
              highlightPhrase={highlightPhrase}
              onPageChange={handlePageChange}
            />
          </div>

          <div
            className={`min-h-0 min-w-0 w-full max-w-full overflow-hidden ${
              mobilePanel === "pdf" ? "hidden lg:block" : mobilePanel === "split" ? "min-h-0 flex-1" : ""
            }`}
          >
          <LegalTutorPanel
            loading={tutorLoading}
            loadingPercent={tutorProgress.percent}
            loadingMessage={tutorProgress.message}
            loadingStageLabel={tutorProgress.stageLabel}
            currentPage={currentPage}
            practiceWhileLoading={practiceWhileLoading}
            analysis={displayAnalysis}
            chatMessages={chatMessages}
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
            onCustomAsk={(prompt) => void askCustomQuestion(prompt)}
            onMarkUnderstood={handleMarkUnderstood}
            onGeneratePage={handleGeneratePage}
            pageUnderstood={understoodPages.includes(currentPage)}
            pageLearningStatus={pageLearningStatus}
            onApplyComplete={handleApplyComplete}
            onRetrievalComplete={handleRetrievalComplete}
            onFeynmanComplete={handleFeynmanComplete}
            materialId={materialId}
            tutorScope={tutorScope}
            chapterTitle={currentChapter?.title}
            onVoiceAsk={askTutorForVoice}
            professorStyle={professorStyle}
            onProfessorStyleChange={setProfessorStyle}
            continuityGreeting={continuityGreeting}
            onContinuityReview={() => {
              if (continuityGreeting) {
                setCurrentPage(continuityGreeting.pageNumber);
                setTutorScope({ type: "page", pageNumber: continuityGreeting.pageNumber });
                void askTutor("explain_page", {
                  scope: { type: "page", pageNumber: continuityGreeting.pageNumber },
                  skipCache: false,
                });
              }
              setContinuityDismissed(true);
            }}
            onContinuityDismiss={() => setContinuityDismissed(true)}
            onOralComplete={handleOralComplete}
            caseNarrativeTitle={studySession?.caseNarrative?.title}
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
                className="absolute left-0 top-0 z-30 flex h-full w-[min(100%,300px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <p className="text-sm font-bold text-foreground">Índice</p>
                  <button type="button" onClick={() => setShowIndex(false)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <X size={16} />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  {index.summary ? (
                    <p className="mb-3 rounded-lg border border-border bg-muted px-2.5 py-2 text-xs leading-5 text-muted-foreground">
                      {index.summary}
                    </p>
                  ) : null}
                  <div className="space-y-1.5">
                    {index.chapters.map((ch) => (
                      <div
                        key={ch.id}
                        className={`rounded-lg border px-2.5 py-2 ${
                          currentChapter?.id === ch.id
                            ? "border-accent/35 bg-accent-soft"
                            : "border-border"
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
                            <ChevronRight size={13} className="mt-0.5 shrink-0 text-accent" />
                            <span className="font-medium text-foreground">{ch.title}</span>
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

      {surpriseQuestion ? (
        <SurpriseQuestionOverlay
          open={surpriseOpen}
          question={surpriseQuestion}
          onDismiss={dismissSurprise}
          onAnswered={completeSurprise}
        />
      ) : null}

      {showDiagnosis ? (
        <SessionDiagnosisPanel
          session={studySession}
          onClose={() => setShowDiagnosis(false)}
          onEndSession={() => {
            const updated = endStudySession(materialId);
            setStudySession(updated);
            setShowDiagnosis(false);
          }}
        />
      ) : null}
    </div>
  );
}