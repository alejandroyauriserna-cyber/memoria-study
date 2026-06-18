"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pause, Play, Square, Volume2 } from "lucide-react";
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
  loadNarrationStyle,
  saveNarrationStyle,
  NARRATION_STYLE_META,
} from "@/lib/guided-study/tutor-voice/narration-style";
import { useTutorSpeech } from "@/hooks/use-tutor-speech";
import { NarrationStylePicker } from "@/components/guided-study/narration-style-picker";
import type { GuidedStudySession, PageProfessorAnalysis } from "@/types/guided-legal-study";
import {
  NARRATION_MICRO_ACTION_LABELS,
  type NarrationMicroAction,
  type NarrationStyle,
} from "@/types/tutor-voice";

const MICRO_ACTIONS: NarrationMicroAction[] = [
  "example",
  "simpler",
  "casacion",
  "exam",
  "repeat_main",
];

const RATES = [1, 1.25, 1.5] as const;

function pickPrimaryConcept(analysis: PageProfessorAnalysis): string {
  return analysis.conceptCards[0]?.concept ?? analysis.pageFocus;
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
    action: NarrationMicroAction,
    primaryConcept: string,
  ) => void;
}) {
  const scopeKey = buildTutorCacheKey(scope, false);
  const speech = useTutorSpeech();
  const [narrationStyle, setNarrationStyle] = useState<NarrationStyle>("normal");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [microLoading, setMicroLoading] = useState<NarrationMicroAction | null>(null);
  const [lastMicroReply, setLastMicroReply] = useState<string | null>(null);

  useEffect(() => {
    setNarrationStyle(loadNarrationStyle());
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

  const fetchNarration = useCallback(async () => {
    const cached = loadNarrationCache(materialId, scopeKey, narrationStyle);
    if (cached) {
      speech.loadScript(cached.script, cached.estimatedDurationSec);
      return;
    }

    speech.setStatus("loading");
    setLoadError(null);

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

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "No se pudo generar la clase.");

      const narration = { ...payload.narration, style: narrationStyle };
      saveNarrationCache(materialId, scopeKey, narration, narrationStyle);
      speech.loadScript(narration.script, narration.estimatedDurationSec);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Error de narración";
      setLoadError(message);
      speech.setStatus("error");
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

  const handleStyleChange = useCallback(
    (style: NarrationStyle) => {
      setNarrationStyle(style);
      saveNarrationStyle(style);
      speech.stop();
      speech.reset();
      setLastMicroReply(null);
    },
    [speech],
  );

  const handleMicroAction = useCallback(
    async (action: NarrationMicroAction) => {
      if (microLoading) return;
      const primaryConcept = pickPrimaryConcept(analysis);

      if (speech.isPlaying && !speech.isSnippet) {
        speech.suspendLesson();
      } else if (speech.status === "ready") {
        speech.suspendLesson();
      }

      setMicroLoading(action);
      setLoadError(null);
      setLastMicroReply(null);

      try {
        const res = await fetch("/api/guided-study/tutor/narration/microaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            pageFocus: analysis.pageFocus,
            primaryConcept,
            analysis: analysisPayload,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "No se pudo responder.");

        setLastMicroReply(payload.reply);
        onNarrationMemoryUpdate?.(action, primaryConcept);
        await speech.playSnippet(payload.reply);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Error en microacción";
        setLoadError(message);
      } finally {
        setMicroLoading(null);
      }
    },
    [analysis, analysisPayload, microLoading, onNarrationMemoryUpdate, speech],
  );

  useEffect(() => {
    speech.stop();
    speech.reset();
    setLoadError(null);
    setLastMicroReply(null);
  }, [scopeKey, materialId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!speech.supported) {
    return (
      <p className="gs-narration-unsupported text-[10px] text-muted-foreground">
        La narración no está disponible en este navegador.
      </p>
    );
  }

  const showPlayer = speech.status !== "idle" && speech.status !== "error";
  const styleMeta = NARRATION_STYLE_META[narrationStyle];
  const showMicroActions =
    showPlayer && (speech.isPlaying || speech.isPaused || speech.awaitingResume || speech.lessonSuspended);

  return (
    <section className="gs-narration" aria-label="Profesor particular narrado">
      <NarrationStylePicker
        value={narrationStyle}
        onChange={handleStyleChange}
        disabled={disabled || speech.status === "loading" || speech.isPlaying}
        compact={showPlayer}
      />

      {!showPlayer ? (
        <button
          type="button"
          disabled={disabled || speech.status === "loading"}
          className="gs-narration-trigger"
          onClick={() => void fetchNarration().then(() => speech.play())}
        >
          {speech.status === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Volume2 size={16} />
          )}
          <span>Escuchar al profesor</span>
          {speech.status === "loading" ? (
            <span className="gs-narration-trigger-sub">
              Preparando {styleMeta.label.toLowerCase()}…
            </span>
          ) : (
            <span className="gs-narration-trigger-sub">
              Clase hablada desde la explicación del Tutor IA · {styleMeta.duration}
            </span>
          )}
        </button>
      ) : (
        <div
          className={`gs-narration-player ${speech.isPlaying ? "is-playing" : ""} ${speech.isPaused ? "is-paused" : ""}`}
        >
          <div className="gs-narration-header">
            <div className="gs-narration-avatar" aria-hidden>
              <Volume2 size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="gs-narration-title">Profesor particular</p>
              <p className="gs-narration-subtitle">
                {styleMeta.emoji} {styleMeta.label} · ~{speech.durationLabel}
                {speech.isPlaying || speech.isPaused ? ` · ${speech.elapsedSec}s` : null}
                {speech.isSnippet ? " · Respondiendo…" : null}
                {speech.backgroundMode ? " · Modo podcast" : null}
              </p>
            </div>
          </div>

          <div className="gs-wave" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>

          <div
            className="gs-narration-progress"
            role="progressbar"
            aria-valuenow={speech.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${speech.progressPercent}%` }} />
          </div>

          {showMicroActions ? (
            <div className="gs-narration-microactions" role="group" aria-label="Preguntas rápidas al profesor">
              {MICRO_ACTIONS.map((action) => {
                const meta = NARRATION_MICRO_ACTION_LABELS[action];
                const busy = microLoading === action;
                return (
                  <button
                    key={action}
                    type="button"
                    className="gs-narration-micro"
                    disabled={Boolean(microLoading) || speech.isSnippet}
                    onClick={() => void handleMicroAction(action)}
                  >
                    {busy ? <Loader2 size={12} className="animate-spin" /> : meta.emoji}
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {lastMicroReply && speech.awaitingResume ? (
            <p className="gs-narration-micro-reply">{lastMicroReply}</p>
          ) : null}

          <div className="gs-narration-controls">
            {speech.awaitingResume ? (
              <button
                type="button"
                className="gs-narration-btn gs-narration-btn--primary gs-narration-btn--wide"
                onClick={() => void speech.resumeLesson()}
              >
                <Play size={16} />
                <span>Continuar explicación</span>
              </button>
            ) : speech.isPlaying ? (
              <button type="button" className="gs-narration-btn" onClick={speech.pause} aria-label="Pausar">
                <Pause size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="gs-narration-btn gs-narration-btn--primary"
                onClick={() => void (speech.lessonSuspended ? speech.resumeLesson() : speech.play())}
                aria-label={speech.isPaused ? "Continuar" : "Reproducir"}
              >
                <Play size={16} />
              </button>
            )}

            {!speech.awaitingResume ? (
              <button type="button" className="gs-narration-btn" onClick={speech.stop} aria-label="Detener">
                <Square size={14} />
              </button>
            ) : null}

            <div className="gs-narration-rates" role="group" aria-label="Velocidad">
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`gs-narration-rate ${speech.rate === r ? "is-active" : ""}`}
                  onClick={() => speech.setSpeechRate(r)}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loadError || speech.error ? (
        <p className="mt-1 text-[10px] text-red-500">{loadError ?? speech.error}</p>
      ) : null}
    </section>
  );
}
