"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pause, Play, Volume2 } from "lucide-react";
import { useTutorSpeech } from "@/hooks/use-tutor-speech";
import { estimateSpeechDurationSec } from "@/lib/guided-study/tutor-voice/estimate-duration";
import { normalizeSpeechScript } from "@/lib/guided-study/tutor-voice/speech-chunks";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function OrganizerSpeakButton({
  script,
  label = "Leer y explicar",
  compact = false,
}: {
  script: string;
  label?: string;
  compact?: boolean;
}) {
  const speech = useTutorSpeech();
  const [preparing, setPreparing] = useState(false);
  const normalized = normalizeSpeechScript(script);

  useEffect(() => {
    return () => {
      speech.stop();
      speech.reset();
    };
  }, [normalized]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = useCallback(async () => {
    if (!normalized.trim() || preparing) return;

    if (speech.isPlaying) {
      speech.pause();
      return;
    }

    if (speech.isPaused && speech.canPlay) {
      await speech.play();
      return;
    }

    setPreparing(true);
    try {
      const durationSec = estimateSpeechDurationSec(countWords(normalized), speech.rate);
      speech.loadScript(normalized, durationSec);
      await speech.play();
    } catch {
      // error surfaced via speech.error
    } finally {
      setPreparing(false);
    }
  }, [normalized, preparing, speech]);

  if (!speech.supported || !normalized.trim()) return null;

  const loading = preparing || speech.status === "loading";
  const playing = speech.isPlaying;
  const canPress = !loading;

  return (
    <div className={`org-speak${compact ? " org-speak--compact" : ""}`}>
      <button
        type="button"
        className={`org-speak__btn${playing ? " is-playing" : ""}${loading ? " is-loading" : ""}`}
        disabled={!canPress}
        aria-busy={loading}
        aria-live="polite"
        onClick={() => void handlePlay()}
      >
        {loading ? (
          <>
            <Loader2 size={15} className="animate-spin" aria-hidden />
            Preparando voz…
          </>
        ) : playing ? (
          <>
            <Pause size={15} aria-hidden />
            Pausar
          </>
        ) : speech.isPaused ? (
          <>
            <Play size={15} aria-hidden />
            Continuar
          </>
        ) : (
          <>
            <Volume2 size={15} aria-hidden />
            {label}
          </>
        )}
      </button>
      {speech.error ? (
        <p className="org-speak__error" role="alert">
          {speech.error}
        </p>
      ) : null}
    </div>
  );
}
