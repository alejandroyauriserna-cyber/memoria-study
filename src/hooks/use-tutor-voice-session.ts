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
  const pendingStopRef = useRef(false);
  const gotResultRef = useRef(false);
  const [phase, setPhase] = useState<TutorVoiceSessionPhase>("idle");
  const [turns, setTurns] = useState<TutorVoiceTurn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
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
    const recognition = recognitionRef.current;
    if (!recognition) {
      pendingStopRef.current = true;
      return;
    }

    setPhase("transcribing");
    setInterimTranscript("");
    recognition.stop();
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Tu navegador no soporta dictado por voz.");
      setPhase("error");
      return;
    }

    if (recognitionRef.current) return;

    setError(null);
    setInterimTranscript("");
    gotResultRef.current = false;
    pendingStopRef.current = false;
    setPhase("arming");

    const recognition = new Ctor();
    recognition.lang = "es-PE";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setPhase("listening");
      if (pendingStopRef.current) {
        pendingStopRef.current = false;
        setPhase("transcribing");
        recognition.stop();
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let finalText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += text;
        else interim += text;
      }

      if (interim.trim()) setInterimTranscript(interim.trim());

      const transcript = (finalText || interim).trim();
      if (!transcript || !event.results[event.results.length - 1]?.isFinal) return;

      gotResultRef.current = true;
      setInterimTranscript(transcript);
      appendTurn("student", transcript);
      setPhase("processing");

      void onStudentTranscript(transcript)
        .then(async (reply) => {
          appendTurn("professor", reply);
          setInterimTranscript("");
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

    recognition.onerror = (event: Event) => {
      const code = (event as Event & { error?: string }).error ?? "unknown";
      if (code === "no-speech") {
        setError("No se detectó voz. Mantén pulsado el micrófono un poco más.");
      } else if (code === "aborted") {
        setError(null);
      } else {
        setError("No se pudo escuchar. Intenta de nuevo o escribe tu pregunta.");
      }
      setInterimTranscript("");
      setPhase(code === "aborted" ? "idle" : "error");
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      if (gotResultRef.current) return;
      setPhase((current) => {
        if (current === "processing" || current === "speaking") return current;
        if (current === "transcribing" || current === "listening" || current === "arming") {
          setError((prev) => prev ?? "No se captó audio. Mantén pulsado mientras hablas.");
          return "idle";
        }
        return current;
      });
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setError("No se pudo iniciar el micrófono.");
      setPhase("error");
    }
  }, [appendTurn, onStudentTranscript, onProfessorReply]);

  const markSpeakingDone = useCallback(() => {
    setPhase("idle");
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    pendingStopRef.current = false;
    gotResultRef.current = false;
    setTurns([]);
    setInterimTranscript("");
    setPhase("idle");
    setError(null);
  }, []);

  return {
    supported,
    phase,
    turns,
    error,
    interimTranscript,
    startListening,
    stopListening,
    markSpeakingDone,
    reset,
    isArming: phase === "arming",
    isListening: phase === "listening",
    isTranscribing: phase === "transcribing",
    isProcessing: phase === "processing",
    isSpeaking: phase === "speaking",
  };
}
