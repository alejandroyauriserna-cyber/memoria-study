"use client";

import { useCallback } from "react";
import { Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { useTutorVoiceSession } from "@/hooks/use-tutor-voice-session";
import { useTutorSpeech } from "@/hooks/use-tutor-speech";
import {
  countWords,
  estimateSpeechDurationSec,
} from "@/lib/guided-study/tutor-voice/estimate-duration";

/**
 * Fase 2 — shell reutilizable para conversación por voz con el Tutor.
 * Flujo: STT → pregunta al tutor (custom) → TTS de la respuesta.
 */
export function TutorVoiceSessionShell({
  onAskTutor,
  disabled,
}: {
  onAskTutor: (prompt: string) => Promise<string>;
  disabled?: boolean;
}) {
  const speech = useTutorSpeech();

  const speakReply = useCallback(
    async (reply: string) => {
      const wc = countWords(reply);
      const dur = estimateSpeechDurationSec(wc, speech.rate);
      speech.loadScript(reply, dur);
      await speech.play();
    },
    [speech],
  );

  const voiceSession = useTutorVoiceSession({
    onStudentTranscript: onAskTutor,
    onProfessorReply: speakReply,
  });

  if (!voiceSession.supported) {
    return null;
  }

  return (
    <section className="gs-voice-session" aria-label="Conversación por voz con el profesor">
      <p className="gs-voice-session-label">
        <Volume2 size={13} />
        Pregunta por voz
        <span className="gs-voice-session-badge">Beta</span>
      </p>
      <p className="gs-voice-session-hint">
        Mantén pulsado el micrófono, pregunta y escucha la respuesta del profesor.
      </p>

      <button
        type="button"
        disabled={disabled || voiceSession.isProcessing || speech.isPlaying}
        className={`gs-voice-mic-btn ${voiceSession.isListening ? "is-listening" : ""}`}
        onPointerDown={() => voiceSession.startListening()}
        onPointerUp={() => voiceSession.stopListening()}
        onPointerLeave={() => {
          if (voiceSession.isListening) voiceSession.stopListening();
        }}
      >
        {voiceSession.isProcessing ? (
          <Loader2 size={22} className="animate-spin" />
        ) : voiceSession.isListening ? (
          <MicOff size={22} />
        ) : (
          <Mic size={22} />
        )}
        <span>
          {voiceSession.isListening
            ? "Escuchando…"
            : voiceSession.isProcessing
              ? "Pensando…"
              : speech.isPlaying
                ? "Reproduciendo…"
                : "Mantener para hablar"}
        </span>
      </button>

      {voiceSession.turns.length ? (
        <ul className="gs-voice-turns">
          {voiceSession.turns.slice(-4).map((turn) => (
            <li key={turn.id} className={`gs-voice-turn gs-voice-turn--${turn.role}`}>
              <span>{turn.role === "student" ? "Tú" : "Profesor"}</span>
              <p>{turn.text}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {voiceSession.error ? (
        <p className="text-[10px] text-red-500">{voiceSession.error}</p>
      ) : null}
    </section>
  );
}
