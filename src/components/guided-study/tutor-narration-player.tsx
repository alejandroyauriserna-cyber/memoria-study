"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pause, Play, Square, Volume2 } from "lucide-react";
import { buildTutorCacheKey, type TutorCacheScope } from "@/lib/guided-study/tutor-cache";
import {
  loadNarrationCache,
  saveNarrationCache,
} from "@/lib/guided-study/tutor-voice/narration-cache";
import { useTutorSpeech } from "@/hooks/use-tutor-speech";
import type { PageProfessorAnalysis } from "@/types/guided-legal-study";
import type { TutorSpeechRate } from "@/types/tutor-voice";

const RATES: TutorSpeechRate[] = [1, 1.25, 1.5];

export function TutorNarrationPlayer({
  materialId,
  pageNumber,
  scope,
  analysis,
  chapterTitle,
  disabled,
}: {
  materialId: string;
  pageNumber: number;
  scope: TutorCacheScope;
  analysis: PageProfessorAnalysis;
  chapterTitle?: string;
  disabled?: boolean;
}) {
  const scopeKey = buildTutorCacheKey(scope, false);
  const speech = useTutorSpeech();
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchNarration = useCallback(async () => {
    const cached = loadNarrationCache(materialId, scopeKey);
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
          analysis: {
            pageFocus: analysis.pageFocus,
            conceptCards: analysis.conceptCards.map((c) => ({
              concept: c.concept,
              explanation: c.explanation,
              example: c.example,
            })),
            keyLearning: analysis.keyLearning,
          },
        }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "No se pudo generar la narración.");

      saveNarrationCache(materialId, scopeKey, payload.narration);
      speech.loadScript(payload.narration.script, payload.narration.estimatedDurationSec);
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
    analysis,
    speech,
  ]);

  useEffect(() => {
    speech.stop();
    speech.reset();
    setLoadError(null);
  }, [scopeKey, materialId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!speech.supported) {
    return (
      <p className="gs-narration-unsupported text-[10px] text-muted-foreground">
        La narración no está disponible en este navegador.
      </p>
    );
  }

  const showPlayer = speech.status !== "idle" && speech.status !== "error";

  return (
    <section className="gs-narration" aria-label="Escuchar explicación del profesor">
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
          <span>Escuchar explicación</span>
          {speech.status === "loading" ? (
            <span className="gs-narration-trigger-sub">Preparando clase en audio…</span>
          ) : (
            <span className="gs-narration-trigger-sub">Versión narrada del profesor</span>
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
              <p className="gs-narration-title">Profesor IA</p>
              <p className="gs-narration-subtitle">
                ~{speech.durationLabel}
                {speech.isPlaying || speech.isPaused ? ` · ${speech.elapsedSec}s` : null}
                {speech.backgroundMode ? " · Modo podcast" : " · Clase narrada"}
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

          <div className="gs-narration-controls">
            {speech.isPlaying ? (
              <button type="button" className="gs-narration-btn" onClick={speech.pause} aria-label="Pausar">
                <Pause size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="gs-narration-btn gs-narration-btn--primary"
                onClick={() => void speech.play()}
                aria-label={speech.isPaused ? "Continuar" : "Reproducir"}
              >
                <Play size={16} />
              </button>
            )}

            <button type="button" className="gs-narration-btn" onClick={speech.stop} aria-label="Detener">
              <Square size={14} />
            </button>

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
