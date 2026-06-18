"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Mic, MoreHorizontal, Pause, Play, Volume2 } from "lucide-react";
import { buildTutorCacheKey, type TutorCacheScope } from "@/lib/guided-study/tutor-cache";
import {
  buildNarrationMemoryPrompt,
  getNarrationMemory,
} from "@/lib/guided-study/tutor-voice/narration-session-memory";
import {
  loadNarrationCache,
  saveNarrationCache,
} from "@/lib/guided-study/tutor-voice/narration-cache";
import {
  loadNarrationClassMode,
  NARRATION_CLASS_MODE_META,
  saveNarrationClassMode,
} from "@/lib/guided-study/tutor-voice/narration-class-mode";
import { buildNarrationCheckpoints, type NarrationCheckpoint } from "@/lib/guided-study/tutor-voice/narration-checkpoints";
import {
  lessonStartupLabel,
  parseNarrationFetchError,
  type LessonStartupPhase,
} from "@/lib/guided-study/tutor-voice/lesson-startup";
import {
  loadNarrationStyle,
  saveNarrationStyle,
  NARRATION_STYLE_META,
  NARRATION_STYLES,
} from "@/lib/guided-study/tutor-voice/narration-style";
import { primeSpanishVoice } from "@/lib/guided-study/tutor-voice/speech-synthesis";
import { useTutorSpeech } from "@/hooks/use-tutor-speech";
import { useTutorVoiceSession } from "@/hooks/use-tutor-voice-session";
import { ProfessorHelpSheet } from "@/components/guided-study/professor-help-sheet";
import { ProfessorPracticeCheckpoint } from "@/components/guided-study/professor-practice-checkpoint";
import { ProfessorSettingsSheet } from "@/components/guided-study/professor-settings-sheet";
import { ProfessorVoiceOrb } from "@/components/guided-study/professor-voice-orb";
import type { GuidedStudySession, PageProfessorAnalysis } from "@/types/guided-legal-study";
import type {
  NarrationClassMode,
  NarrationInterruptAction,
  NarrationMicroAction,
  NarrationStyle,
  TutorNarrationScript,
} from "@/types/tutor-voice";
import "./professor-ai.css";

function pickPrimaryConcept(analysis: PageProfessorAnalysis): string {
  return analysis.conceptCards[0]?.concept ?? analysis.pageFocus;
}

function shortStyleLabel(style: NarrationStyle): string {
  const meta = NARRATION_STYLE_META[style];
  if (style === "quick") return `${meta.emoji} Rápida`;
  if (style === "magistral") return `${meta.emoji} Magistral`;
  return `${meta.emoji} Normal`;
}

function formatRemaining(estimatedSec: number, elapsedSec: number): string {
  const rem = Math.max(0, estimatedSec - elapsedSec);
  if (rem < 60) return `~${rem} s restantes`;
  const m = Math.floor(rem / 60);
  const s = rem % 60;
  return s > 0 ? `~${m} min ${s} s restantes` : `~${m} min restantes`;
}

function statusLabel(
  voice: ReturnType<typeof useTutorVoiceSession>,
  micPressed: boolean,
  interruptLoading: boolean,
): string | null {
  if (voice.isListening || micPressed) return "Escuchando tu pregunta…";
  if (voice.isTranscribing) return "Transcribiendo…";
  if (voice.isProcessing || interruptLoading) return "El profesor está pensando…";
  if (voice.isSpeaking) return "El profesor te responde…";
  if (voice.interimTranscript) return `«${voice.interimTranscript}»`;
  return null;
}

export function TutorNarrationPlayer({
  materialId,
  pageNumber,
  scope,
  analysis,
  chapterTitle,
  disabled,
  studySession,
  onNarrationMemoryUpdate,
}: {
  materialId: string;
  pageNumber: number;
  scope: TutorCacheScope;
  analysis: PageProfessorAnalysis;
  chapterTitle?: string;
  disabled?: boolean;
  studySession?: GuidedStudySession | null;
  onNarrationMemoryUpdate?: (
    action: NarrationInterruptAction,
    primaryConcept: string,
    studentMessage?: string,
  ) => void;
}) {
  const scopeKey = buildTutorCacheKey(scope, false);
  const speech = useTutorSpeech();
  const [narrationStyle, setNarrationStyle] = useState<NarrationStyle>("normal");
  const [classMode, setClassMode] = useState<NarrationClassMode>("listen");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [interruptLoading, setInterruptLoading] = useState(false);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [askText, setAskText] = useState("");
  const [micPressed, setMicPressed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [playbackUiPaused, setPlaybackUiPaused] = useState(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<NarrationCheckpoint | null>(null);
  const [startupPhase, setStartupPhase] = useState<LessonStartupPhase | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const micPressRef = useRef(false);
  const firedCheckpointsRef = useRef(new Set<string>());
  const activeCheckpointRef = useRef<NarrationCheckpoint | null>(null);
  activeCheckpointRef.current = activeCheckpoint;

  useEffect(() => {
    if (speech.isPlaying) setPlaybackUiPaused(false);
  }, [speech.isPlaying]);

  const handlePause = useCallback(() => {
    setPlaybackUiPaused(true);
    speech.pause();
  }, [speech]);

  const handleResume = useCallback(() => {
    setPlaybackUiPaused(false);
    void (speech.lessonSuspended ? speech.resumeLesson() : speech.play());
  }, [speech]);

  useEffect(() => {
    setNarrationStyle(loadNarrationStyle());
    setClassMode(loadNarrationClassMode());
    void primeSpanishVoice();
  }, []);

  const sessionMemoryHint = useMemo(
    () => buildNarrationMemoryPrompt(getNarrationMemory(studySession ?? null)),
    [studySession],
  );

  const analysisPayload = useMemo(
    () => ({
      pageFocus: analysis.pageFocus,
      conceptCards: analysis.conceptCards.map((c) => ({
        id: c.id,
        concept: c.concept,
        explanation: c.explanation,
        example: c.example,
        examImportance: c.examImportance,
        peruLaw: c.peruLaw,
      })),
      keyLearning: analysis.keyLearning.map((k) => ({ id: k.id, label: k.label })),
      secondaryMentions: analysis.secondaryMentions,
      examMode: {
        memorableConcepts: analysis.examMode.memorableConcepts,
        commonErrors: analysis.examMode.commonErrors,
        oral: analysis.examMode.oral.map((o) => ({ question: o.question })),
      },
      citations: analysis.citations.map((c) => ({
        norm: c.norm,
        article: c.article,
        text: c.text,
        fragment: c.fragment,
      })),
      comprehensionQuestion: analysis.comprehensionQuestion,
    }),
    [analysis],
  );

  const referenceContext = useMemo(
    () =>
      `${analysis.pageFocus}\n${analysis.conceptCards.map((c) => `${c.concept}: ${c.explanation}`).join("\n")}`.slice(
        0,
        6000,
      ),
    [analysis],
  );

  const checkpoints = useMemo(
    () => buildNarrationCheckpoints(analysis, narrationStyle, classMode),
    [analysis, narrationStyle, classMode],
  );

  const fetchInterruptReply = useCallback(
    async (input: { action: NarrationInterruptAction; studentMessage?: string }) => {
      const primaryConcept = pickPrimaryConcept(analysis);
      const res = await fetch("/api/guided-study/tutor/narration/microaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: input.action,
          studentMessage: input.studentMessage,
          pageFocus: analysis.pageFocus,
          primaryConcept,
          analysis: analysisPayload,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "No se pudo responder.");
      return { reply: payload.reply as string, primaryConcept };
    },
    [analysis, analysisPayload],
  );

  const runInterrupt = useCallback(
    async (input: { action: NarrationInterruptAction; studentMessage?: string }) => {
      if (interruptLoading) return;

      setActiveCheckpoint(null);

      if (speech.isPlaying && !speech.isSnippet) {
        speech.suspendLesson();
      } else if (!speech.lessonSuspended && speech.status !== "idle") {
        speech.suspendLesson();
      }

      setInterruptLoading(true);
      setLoadError(null);
      setLastReply(null);

      try {
        const { reply, primaryConcept } = await fetchInterruptReply(input);
        setLastReply(reply);
        onNarrationMemoryUpdate?.(input.action, primaryConcept, input.studentMessage);
        await speech.playSnippet(reply);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Error al interrumpir la clase";
        setLoadError(message);
      } finally {
        setInterruptLoading(false);
      }
    },
    [interruptLoading, fetchInterruptReply, onNarrationMemoryUpdate, speech],
  );

  const voiceSession = useTutorVoiceSession({
    onStudentTranscript: async (text) => {
      if (!speech.lessonSuspended && speech.status !== "idle") {
        speech.suspendLesson();
      }
      const { reply } = await fetchInterruptReply({ action: "free", studentMessage: text });
      setLastReply(reply);
      onNarrationMemoryUpdate?.("free", pickPrimaryConcept(analysis), text);
      return reply;
    },
    onProfessorReply: async (reply) => {
      setLastReply(reply);
      await speech.playSnippet(reply);
    },
  });

  const handleVoicePress = useCallback(() => {
    micPressRef.current = true;
    setMicPressed(true);
    if (speech.isPlaying && !speech.isSnippet) {
      speech.suspendLesson();
    }
    voiceSession.startListening();
  }, [speech, voiceSession]);

  const handleVoiceRelease = useCallback(() => {
    micPressRef.current = false;
    setMicPressed(false);
    voiceSession.stopListening();
  }, [voiceSession]);

  const loadNarrationScript = useCallback(async (): Promise<boolean> => {
    setLoadError(null);
    speech.setStatus("loading");

    try {
      const res = await fetch("/api/guided-study/tutor/narration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          pageNumber,
          scopeKey,
          chapterTitle,
          narrationStyle,
          sessionMemoryHint: sessionMemoryHint || undefined,
          analysis: analysisPayload,
        }),
      });

      let payload: { narration?: { script: string; estimatedDurationSec: number }; error?: string } =
        {};
      try {
        payload = await res.json();
      } catch {
        payload = {};
      }

      if (!res.ok) {
        throw new Error(parseNarrationFetchError(res.status, payload));
      }

      if (!payload.narration?.script?.trim()) {
        throw new Error("La clase llegó vacía. Intenta de nuevo en unos segundos.");
      }

      const narration = {
        ...payload.narration,
        style: narrationStyle,
      } as TutorNarrationScript;
      saveNarrationCache(materialId, scopeKey, narration, narrationStyle);
      speech.loadScript(narration.script, narration.estimatedDurationSec);
      return true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Error de narración";
      setLoadError(message);
      speech.setStatus("error");
      return false;
    }
  }, [
    materialId,
    scopeKey,
    pageNumber,
    chapterTitle,
    narrationStyle,
    sessionMemoryHint,
    analysisPayload,
    speech,
  ]);

  const handleStartLesson = useCallback(async () => {
    if (disabled || isStarting) return;

    setIsStarting(true);
    setLoadError(null);
    speech.setStatus("loading");

    try {
      const cached = loadNarrationCache(materialId, scopeKey, narrationStyle);
      if (cached?.script?.trim()) {
        speech.loadScript(cached.script, cached.estimatedDurationSec);
        setStartupPhase("preparing_audio");
      } else {
        setStartupPhase("generating");
        const loaded = await loadNarrationScript();
        if (!loaded) return;
        setStartupPhase("preparing_audio");
      }

      await primeSpanishVoice();

      setStartupPhase("starting");
      await speech.play();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "No se pudo iniciar la clase narrada.";
      setLoadError(message);
      speech.setStatus("error");
    } finally {
      setStartupPhase(null);
      setIsStarting(false);
    }
  }, [disabled, isStarting, materialId, scopeKey, narrationStyle, loadNarrationScript, speech]);

  const handleStyleChange = useCallback(
    (style: NarrationStyle) => {
      setNarrationStyle(style);
      saveNarrationStyle(style);
      speech.stop();
      speech.reset();
      setLastReply(null);
      setAskText("");
      setActiveCheckpoint(null);
      firedCheckpointsRef.current.clear();
    },
    [speech],
  );

  const handleClassModeChange = useCallback(
    (mode: NarrationClassMode) => {
      setClassMode(mode);
      saveNarrationClassMode(mode);
      speech.stop();
      speech.reset();
      setLastReply(null);
      setAskText("");
      setActiveCheckpoint(null);
      firedCheckpointsRef.current.clear();
    },
    [speech],
  );

  const handleContinueCheckpoint = useCallback(() => {
    setActiveCheckpoint(null);
    void speech.resumeLesson();
  }, [speech]);

  const handleSpeakClarification = useCallback(
    async (text: string) => {
      await speech.playSnippet(text);
    },
    [speech],
  );

  const submitFreeQuestion = useCallback(() => {
    const text = askText.trim();
    if (text.length < 3 || interruptLoading) return;
    setAskText("");
    void runInterrupt({ action: "free", studentMessage: text });
  }, [askText, interruptLoading, runInterrupt]);

  const handleMicroAction = useCallback(
    (action: NarrationMicroAction) => {
      void runInterrupt({ action });
    },
    [runInterrupt],
  );

  const handleStop = useCallback(() => {
    speech.stop();
    speech.reset();
    setLastReply(null);
    setAskText("");
    setActiveCheckpoint(null);
    firedCheckpointsRef.current.clear();
    setSettingsOpen(false);
  }, [speech]);

  useEffect(() => {
    speech.stop();
    speech.reset();
    setLoadError(null);
    setLastReply(null);
    setAskText("");
    setActiveCheckpoint(null);
    firedCheckpointsRef.current.clear();
    voiceSession.reset();
  }, [scopeKey, materialId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    firedCheckpointsRef.current.clear();
    setActiveCheckpoint(null);
  }, [scopeKey, materialId, narrationStyle, classMode]);

  useEffect(() => {
    if (classMode !== "practice") return;
    if (activeCheckpointRef.current) return;
    if (!speech.isPlaying || speech.isSnippet || interruptLoading) return;
    if (speech.lessonSuspended || speech.awaitingResume || playbackUiPaused) return;

    const percent = speech.progressPercent;
    const next = checkpoints.find(
      (cp) => !firedCheckpointsRef.current.has(cp.id) && percent >= cp.atPercent,
    );
    if (!next) return;

    firedCheckpointsRef.current.add(next.id);
    speech.suspendLesson();
    setActiveCheckpoint(next);
  }, [
    classMode,
    checkpoints,
    speech,
    speech.isPlaying,
    speech.isSnippet,
    speech.lessonSuspended,
    speech.awaitingResume,
    speech.progressPercent,
    interruptLoading,
    playbackUiPaused,
  ]);

  if (!speech.supported) {
    return <p className="professor-ai-unsupported">La narración no está disponible en este navegador.</p>;
  }

  const showPlayer = speech.status !== "idle" && speech.status !== "error";
  const isBootstrapping = isStarting || speech.status === "loading" || startupPhase !== null;
  const startupMessage = startupPhase ? lessonStartupLabel(startupPhase, classMode) : null;
  const displayError = loadError ?? speech.error ?? voiceSession.error;
  const styleMeta = NARRATION_STYLE_META[narrationStyle];
  const busy =
    interruptLoading ||
    voiceSession.isProcessing ||
    voiceSession.isTranscribing ||
    voiceSession.isSpeaking ||
    speech.isSnippet;
  const inPracticePause = Boolean(activeCheckpoint);
  const liveStatus = statusLabel(voiceSession, micPressed, interruptLoading);
  const orbSpeaking =
    speech.isPlaying &&
    !playbackUiPaused &&
    !speech.isSnippet &&
    !voiceSession.isListening &&
    !micPressed;
  const orbListening = voiceSession.isListening || micPressed;
  const orbThinking =
    isBootstrapping ||
    interruptLoading ||
    voiceSession.isProcessing ||
    voiceSession.isTranscribing ||
    speech.status === "loading";

  const canInteract =
    showPlayer &&
    !inPracticePause &&
    (speech.isPlaying || speech.isPaused || speech.awaitingResume || speech.lessonSuspended);

  return (
    <section className="professor-ai" aria-label="Profesor IA">
      {!showPlayer ? (
        <div className="professor-ai-card">
          <div className="professor-ai-header">
            <div className="professor-ai-avatar" aria-hidden>
              <Volume2 size={22} strokeWidth={2.25} />
            </div>
            <div className="professor-ai-header__body">
              <p className="professor-ai-title">Profesor IA</p>
              <p className="professor-ai-subtitle">Explicando esta página</p>
              <div className="professor-ai-meta">
                <span className="professor-ai-meta-pill">{shortStyleLabel(narrationStyle)}</span>
                <span>{styleMeta.duration}</span>
              </div>
            </div>
          </div>

          <div className="professor-ai-idle-styles" role="radiogroup" aria-label="Profundidad de la explicación">
            {NARRATION_STYLES.map((style) => {
              const meta = NARRATION_STYLE_META[style];
              const active = narrationStyle === style;
              return (
                <button
                  key={style}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled || isBootstrapping}
                  className={`professor-ai-style-chip${active ? " is-active" : ""}`}
                  onClick={() => handleStyleChange(style)}
                >
                  <strong>
                    {meta.emoji} {meta.label.replace("Explicación ", "").replace("Clase ", "")}
                  </strong>
                  <small>{meta.duration}</small>
                </button>
              );
            })}
          </div>

          <p className="professor-ai-section-label">Modo de clase</p>
          <div className="professor-ai-class-modes" role="radiogroup" aria-label="Modo de clase">
            {(["listen", "practice"] as const).map((mode) => {
              const meta = NARRATION_CLASS_MODE_META[mode];
              const active = classMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled || isBootstrapping}
                  className={`professor-ai-class-mode${active ? " is-active" : ""}`}
                  onClick={() => handleClassModeChange(mode)}
                >
                  <strong>
                    {meta.emoji} {meta.label}
                  </strong>
                  <small>{meta.description}</small>
                </button>
              );
            })}
          </div>

          <ProfessorVoiceOrb active={isBootstrapping} thinking={isBootstrapping} />

          {displayError && !showPlayer ? (
            <div className="professor-ai-alert professor-ai-alert--error" role="alert">
              <p>{displayError}</p>
              <button
                type="button"
                className="professor-ai-alert__action"
                disabled={isBootstrapping}
                onClick={() => void handleStartLesson()}
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {isBootstrapping && startupMessage ? (
            <p className="professor-ai-startup" role="status" aria-live="polite">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              {startupMessage}
            </p>
          ) : null}

          <button
            type="button"
            className="professor-ai-start"
            disabled={disabled || isBootstrapping}
            onClick={() => void handleStartLesson()}
          >
            {isBootstrapping ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {startupMessage ?? "Preparando…"}
              </>
            ) : classMode === "practice" ? (
              <>
                <Play size={16} />
                Iniciar clase interactiva
              </>
            ) : (
              <>
                <Play size={16} />
                Escuchar explicación
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="professor-ai-card">
          <div className="professor-ai-header">
            <div className="professor-ai-avatar" aria-hidden>
              <Volume2 size={22} strokeWidth={2.25} />
            </div>
            <div className="professor-ai-header__body">
              <p className="professor-ai-title">Profesor IA</p>
              <p className="professor-ai-subtitle">Explicando esta página</p>
              <div className="professor-ai-meta">
                <span className="professor-ai-meta-pill">{shortStyleLabel(narrationStyle)}</span>
                {classMode === "practice" ? (
                  <span className="professor-ai-meta-pill professor-ai-meta-pill--practice">
                    {NARRATION_CLASS_MODE_META.practice.emoji} Interactiva
                  </span>
                ) : null}
                <span>{formatRemaining(speech.estimatedDurationSec, speech.elapsedSec)}</span>
              </div>
            </div>
            <div className="professor-ai-header__actions">
              <button
                type="button"
                className="professor-ai-icon-btn"
                aria-label="Ajustes de audio"
                onClick={() => setSettingsOpen(true)}
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          <ProfessorVoiceOrb
            active={orbSpeaking}
            listening={orbListening}
            thinking={orbThinking && !orbSpeaking}
          />

          <div
            className="professor-ai-progress"
            role="progressbar"
            aria-valuenow={speech.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${speech.progressPercent}%` }} />
          </div>

          <div className="professor-ai-divider" />

          {activeCheckpoint ? (
            <ProfessorPracticeCheckpoint
              checkpoint={activeCheckpoint}
              referenceContext={referenceContext}
              onContinue={handleContinueCheckpoint}
              onSpeakClarification={handleSpeakClarification}
              disabled={busy}
            />
          ) : speech.awaitingResume ? (
            <button
              type="button"
              className="professor-ai-playback professor-ai-playback--primary"
              onClick={() => void speech.resumeLesson()}
            >
              <Play size={16} />
              Continuar explicación
            </button>
          ) : speech.isPlaying && !playbackUiPaused ? (
            <button type="button" className="professor-ai-playback" onClick={handlePause}>
              <Pause size={16} />
              Pausar
            </button>
          ) : (
            <button
              type="button"
              className="professor-ai-playback professor-ai-playback--primary"
              onClick={handleResume}
              disabled={busy}
            >
              <Play size={16} />
              Continuar
            </button>
          )}

          {canInteract ? (
            <>
              <div className="professor-ai-divider" />

              <button
                type="button"
                className="help-button"
                disabled={busy || speech.isSnippet}
                onClick={() => setHelpOpen(true)}
              >
                ✨ Ayúdame a entender
              </button>

              <form
                className="professor-ai-ask"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitFreeQuestion();
                }}
              >
                <input
                  type="text"
                  className="professor-ai-input"
                  placeholder="Pregúntale al profesor sobre esta página…"
                  value={askText}
                  disabled={busy || speech.isSnippet || voiceSession.isListening}
                  onChange={(e) => setAskText(e.target.value)}
                  aria-label="Pregunta al profesor"
                />
                {voiceSession.supported ? (
                  <button
                    type="button"
                    className={`professor-ai-mic${orbListening ? " is-active" : ""}`}
                    disabled={disabled || busy || speech.isSnippet}
                    aria-label="Mantén pulsado para preguntar con voz"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleVoicePress();
                    }}
                    onPointerUp={handleVoiceRelease}
                    onPointerCancel={handleVoiceRelease}
                    onPointerLeave={() => {
                      if (micPressRef.current) handleVoiceRelease();
                    }}
                  >
                    {voiceSession.isProcessing || voiceSession.isTranscribing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Mic size={18} />
                    )}
                  </button>
                ) : null}
              </form>

              {liveStatus ? (
                <p
                  className={`professor-ai-status${orbListening ? " is-live" : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  {liveStatus}
                </p>
              ) : null}

              {lastReply && speech.awaitingResume ? (
                <p className="professor-ai-reply">{lastReply}</p>
              ) : null}
            </>
          ) : null}
        </div>
      )}

      <ProfessorHelpSheet
        open={helpOpen}
        loading={interruptLoading}
        onClose={() => setHelpOpen(false)}
        onSelect={handleMicroAction}
      />

      <ProfessorSettingsSheet
        open={settingsOpen}
        style={narrationStyle}
        rate={speech.rate}
        onClose={() => setSettingsOpen(false)}
        onStyleChange={(style) => {
          handleStyleChange(style);
          setSettingsOpen(false);
        }}
        onRateChange={(rate) => speech.setSpeechRate(rate)}
        onStop={handleStop}
      />

      {displayError && showPlayer ? (
        <p className="professor-ai-error" role="alert">
          {displayError}
        </p>
      ) : null}
    </section>
  );
}
