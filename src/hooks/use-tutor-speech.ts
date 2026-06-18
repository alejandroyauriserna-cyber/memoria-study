"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatSpeechDuration,
  estimateSpeechDurationSec,
} from "@/lib/guided-study/tutor-voice/estimate-duration";
import {
  isSpeechSynthesisSupported,
  waitForVoices,
} from "@/lib/guided-study/tutor-voice/speech-synthesis";
import type { TutorSpeechRate, TutorSpeechStatus } from "@/types/tutor-voice";

function splitIntoChunks(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length) return parts;
  return text.trim() ? [text.trim()] : [];
}

function countWordsLocal(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function useTutorSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scriptRef = useRef("");
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const keepAliveAudioRef = useRef<HTMLAudioElement | null>(null);
  const rateRef = useRef<TutorSpeechRate>(1);

  const [status, setStatus] = useState<TutorSpeechStatus>("idle");
  const [rate, setRate] = useState<TutorSpeechRate>(1);
  const [estimatedDurationSec, setEstimatedDurationSec] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(() => isSpeechSynthesisSupported());
  const [backgroundMode, setBackgroundMode] = useState(false);

  rateRef.current = rate;

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    try {
      await wakeLockRef.current?.release();
    } catch {
      // ignore
    }
    wakeLockRef.current = null;
  }, []);

  const stopKeepAlive = useCallback(() => {
    keepAliveAudioRef.current?.pause();
    keepAliveAudioRef.current = null;
  }, []);

  const setupMediaSession = useCallback((title: string) => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: "Profesor MemoriaStudy",
        album: "Clase narrada",
      });
      navigator.mediaSession.playbackState = "playing";
    } catch {
      // unsupported
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
    } catch {
      // denied or unsupported
    }
  }, []);

  const startKeepAlive = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
      );
      audio.loop = true;
      audio.volume = 0.01;
      void audio.play().catch(() => {});
      keepAliveAudioRef.current = audio;
      setBackgroundMode(true);
    } catch {
      // ignore
    }
  }, []);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    chunkIndexRef.current = 0;
    clearTick();
    setElapsedSec(0);
    startedAtRef.current = 0;
    void releaseWakeLock();
    stopKeepAlive();
    setBackgroundMode(false);
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "none";
      } catch {
        // ignore
      }
    }
    setStatus((s) => (s === "loading" ? s : scriptRef.current ? "ready" : "idle"));
  }, [supported, clearTick, releaseWakeLock, stopKeepAlive]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (!supported) return;

    function onVisibility() {
      if (document.visibilityState === "visible" && status === "playing") {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [supported, status]);

  const startTick = useCallback(() => {
    clearTick();
    if (!startedAtRef.current) startedAtRef.current = Date.now();
    tickRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setElapsedSec(elapsed);
    }, 400);
  }, [clearTick]);

  const reset = useCallback(() => {
    stop();
    scriptRef.current = "";
    chunksRef.current = [];
    setEstimatedDurationSec(0);
    setStatus("idle");
    setError(null);
  }, [stop]);

  const speakChunk = useCallback(
    (index: number, voice: SpeechSynthesisVoice | null): Promise<void> => {
      return new Promise((resolve) => {
        const chunks = chunksRef.current;
        if (!supported || index >= chunks.length) {
          resolve();
          return;
        }

        const text = chunks[index];
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice?.lang ?? "es-PE";
        if (voice) utterance.voice = voice;
        utterance.rate = rateRef.current;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          if (index === 0) {
            setStatus("playing");
            setError(null);
            startTick();
            void requestWakeLock();
            startKeepAlive();
            setupMediaSession("Clase narrada — MemoriaStudy");
          }
        };

        utterance.onend = () => {
          chunkIndexRef.current = index + 1;
          if (chunkIndexRef.current < chunks.length) {
            void speakChunk(chunkIndexRef.current, voice).then(resolve);
          } else {
            clearTick();
            setElapsedSec(
              estimateSpeechDurationSec(countWordsLocal(scriptRef.current), rateRef.current),
            );
            setStatus("ready");
            void releaseWakeLock();
            stopKeepAlive();
            setBackgroundMode(false);
            resolve();
          }
        };

        utterance.onerror = () => {
          clearTick();
          setStatus("error");
          setError("No se pudo reproducir el audio.");
          void releaseWakeLock();
          stopKeepAlive();
          resolve();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      });
    },
    [
      supported,
      startTick,
      clearTick,
      requestWakeLock,
      startKeepAlive,
      setupMediaSession,
      releaseWakeLock,
      stopKeepAlive,
    ],
  );

  const play = useCallback(async (): Promise<void> => {
    if (!scriptRef.current) return;
    if (status === "paused" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus("playing");
      startTick();
      void requestWakeLock();
      startKeepAlive();
      return;
    }

    if (!supported) return;

    window.speechSynthesis.cancel();
    const voice = await waitForVoices();
    chunksRef.current = splitIntoChunks(scriptRef.current);
    chunkIndexRef.current = 0;
    startedAtRef.current = Date.now();
    await speakChunk(0, voice);
  }, [status, supported, startTick, speakChunk, requestWakeLock, startKeepAlive]);

  const pause = useCallback(() => {
    if (!supported || status !== "playing") return;
    window.speechSynthesis.pause();
    clearTick();
    setStatus("paused");
    void releaseWakeLock();
    stopKeepAlive();
    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "paused";
      } catch {
        // ignore
      }
    }
  }, [supported, status, clearTick, releaseWakeLock, stopKeepAlive]);

  const setSpeechRate = useCallback(
    (next: TutorSpeechRate) => {
      setRate(next);
      if (scriptRef.current) {
        const wc = countWordsLocal(scriptRef.current);
        setEstimatedDurationSec(estimateSpeechDurationSec(wc, next));
      }
      if (status === "playing" || status === "paused") {
        const text = scriptRef.current;
        const idx = chunkIndexRef.current;
        stop();
        if (text) {
          scriptRef.current = text;
          chunksRef.current = splitIntoChunks(text).slice(idx);
          chunkIndexRef.current = 0;
          setStatus("ready");
          void play();
        }
      }
    },
    [status, stop, play],
  );

  const loadScript = useCallback((script: string, durationSec: number) => {
    scriptRef.current = script;
    chunksRef.current = splitIntoChunks(script);
    chunkIndexRef.current = 0;
    setEstimatedDurationSec(durationSec);
    setStatus("ready");
    setElapsedSec(0);
    setError(null);
  }, []);

  const durationLabel = formatSpeechDuration(estimatedDurationSec);
  const progressPercent =
    estimatedDurationSec > 0
      ? Math.min(100, Math.round((elapsedSec / estimatedDurationSec) * 100))
      : 0;

  return {
    supported,
    status,
    setStatus,
    rate,
    setSpeechRate,
    estimatedDurationSec,
    durationLabel,
    elapsedSec,
    progressPercent,
    error,
    backgroundMode,
    loadScript,
    play,
    pause,
    stop,
    reset,
    isPlaying: status === "playing",
    isPaused: status === "paused",
    canPlay: Boolean(scriptRef.current) && status !== "loading",
  };
}
