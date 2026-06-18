"use client";

import { useCallback, useRef, useState } from "react";
import { isSpeechRecognitionSupported } from "@/lib/guided-study/tutor-voice/speech-synthesis";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Dictado por voz → solo transcribe, sin respuesta del tutor. */
export function useSpeechDictation(onFinalTranscript: (text: string) => void) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pendingStopRef = useRef(false);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const supported = isSpeechRecognitionSupported();

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      pendingStopRef.current = true;
      return;
    }
    setInterimTranscript("");
    recognition.stop();
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Tu navegador no soporta dictado por voz.");
      return;
    }
    if (recognitionRef.current) return;

    setError(null);
    setInterimTranscript("");
    pendingStopRef.current = false;

    const recognition = new Ctor();
    recognition.lang = "es-PE";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setListening(true);
      if (pendingStopRef.current) {
        pendingStopRef.current = false;
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

      onFinalRef.current(transcript);
      setInterimTranscript("");
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const reset = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    setListening(false);
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    supported,
    listening,
    interimTranscript,
    error,
    startListening,
    stopListening,
    reset,
  };
}
