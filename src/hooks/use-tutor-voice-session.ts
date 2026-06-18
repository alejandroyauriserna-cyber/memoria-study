"use client";

import { useCallback, useRef, useState } from "react";
import { isSpeechRecognitionSupported } from "@/lib/guided-study/tutor-voice/speech-synthesis";
import type { TutorVoiceSessionPhase, TutorVoiceTurn } from "@/types/tutor-voice";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Fase 2 — arquitectura STT → Tutor → TTS.
 * Reutilizable para preguntas orales y modo conversación.
 */
export function useTutorVoiceSession({
  onStudentTranscript,
  onProfessorReply,
}: {
  onStudentTranscript: (text: string) => Promise<string>;
  onProfessorReply?: (text: string) => void | Promise<void>;
}) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [phase, setPhase] = useState<TutorVoiceSessionPhase>("idle");
  const [turns, setTurns] = useState<TutorVoiceTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supported = isSpeechRecognitionSupported();

  const appendTurn = useCallback((role: TutorVoiceTurn["role"], text: string) => {
    const turn: TutorVoiceTurn = {
      id: `${Date.now()}-${role}`,
      role,
      text,
      createdAt: new Date().toISOString(),
    };
    setTurns((prev) => [...prev, turn]);
    return turn;
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Tu navegador no soporta dictado por voz.");
      setPhase("error");
      return;
    }

    setError(null);
    const recognition = new Ctor();
    recognition.lang = "es-PE";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setPhase("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setPhase("idle");
        return;
      }

      appendTurn("student", transcript);
      setPhase("processing");

      void onStudentTranscript(transcript)
        .then(async (reply) => {
          appendTurn("professor", reply);
          setPhase("speaking");
          try {
            await onProfessorReply?.(reply);
          } finally {
            setPhase("idle");
          }
        })
        .catch((caught) => {
          setError(caught instanceof Error ? caught.message : "Error del tutor");
          setPhase("error");
        });
    };

    recognition.onerror = () => {
      setPhase("idle");
      setError("No se pudo escuchar. Intenta de nuevo.");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [appendTurn, onStudentTranscript, onProfessorReply]);

  const markSpeakingDone = useCallback(() => {
    setPhase("idle");
  }, []);

  const reset = useCallback(() => {
    stopListening();
    setTurns([]);
    setPhase("idle");
    setError(null);
  }, [stopListening]);

  return {
    supported,
    phase,
    turns,
    error,
    startListening,
    stopListening,
    markSpeakingDone,
    reset,
    isListening: phase === "listening",
    isProcessing: phase === "processing",
    isSpeaking: phase === "speaking",
  };
}
