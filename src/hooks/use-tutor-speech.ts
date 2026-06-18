"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatSpeechDuration,
  estimateSpeechDurationSec,
} from "@/lib/guided-study/tutor-voice/estimate-duration";
import {
  isSpeechSynthesisSupported,
  waitForVoices,
  getCachedSpanishVoice,
  primeSpanishVoice,
} from "@/lib/guided-study/tutor-voice/speech-synthesis";
import {
  buildSpeechChunks,
  normalizeSpeechScript,
} from "@/lib/guided-study/tutor-voice/speech-chunks";
import type { TutorSpeechRate, TutorSpeechStatus } from "@/types/tutor-voice";

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
  const resumeGuardRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const clearResumeGuard = useCallback(() => {
    if (resumeGuardRef.current) {
      clearInterval(resumeGuardRef.current);
      resumeGuardRef.current = null;
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

  const startResumeGuard = useCallback(() => {
    clearResumeGuard();
    resumeGuardRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) return;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 4_000);
  }, [clearResumeGuard]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    chunkIndexRef.current = 0;
    clearTick();
    clearResumeGuard();
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
  }, [supported, clearTick, clearResumeGuard, releaseWakeLock, stopKeepAlive]);

  useEffect(() => {
    if (!supported) return;
    void primeSpanishVoice();
  }, [supported]);

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

  const finishPlayback = useCallback(() => {
    clearTick();
    clearResumeGuard();
    setElapsedSec(
      estimateSpeechDurationSec(countWordsLocal(scriptRef.current), rateRef.current),
    );
    setStatus("ready");
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
  }, [clearTick, clearResumeGuard, releaseWakeLock, stopKeepAlive]);

  const queueChunks = useCallback(
    (chunks: string[], voice: SpeechSynthesisVoice | null, fromIndex = 0): void => {
      if (!supported || chunks.length === 0) return;

      const slice = chunks.slice(fromIndex);
      const lastGlobalIndex = chunks.length - 1;

      slice.forEach((text, localIndex) => {
        const globalIndex = fromIndex + localIndex;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice?.lang ?? "es-PE";
        if (voice) utterance.voice = voice;
        utterance.rate = rateRef.current;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          chunkIndexRef.current = globalIndex;
          utteranceRef.current = utterance;

          if (globalIndex === fromIndex) {
            setStatus("playing");
            setError(null);
            startTick();
            void requestWakeLock();
            startKeepAlive();
            startResumeGuard();
            setupMediaSession("Clase narrada — MemoriaStudy");
          }
        };

        utterance.onend = () => {
          if (globalIndex === lastGlobalIndex) {
            finishPlayback();
          }
        };

        utterance.onerror = () => {
          clearTick();
          clearResumeGuard();
          setStatus("error");
          setError("No se pudo reproducir el audio.");
          void releaseWakeLock();
          stopKeepAlive();
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [
      supported,
      startTick,
      clearTick,
      clearResumeGuard,
      requestWakeLock,
      startKeepAlive,
      startResumeGuard,
      setupMediaSession,
      releaseWakeLock,
      stopKeepAlive,
      finishPlayback,
    ],
  );

  const play = useCallback(async (): Promise<void> => {
    if (!scriptRef.current) return;
    if (status === "paused" && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setStatus("playing");
      startTick();
      startResumeGuard();
      void requestWakeLock();
      startKeepAlive();
      return;
    }

    if (!supported) return;

    window.speechSynthesis.cancel();
    const voice = getCachedSpanishVoice() ?? (await waitForVoices());
    const chunks = buildSpeechChunks(scriptRef.current);
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    startedAtRef.current = Date.now();
    queueChunks(chunks, voice, 0);
  }, [status, supported, startTick, queueChunks, startResumeGuard, requestWakeLock, startKeepAlive]);

  const pause = useCallback(() => {
    if (!supported || status !== "playing") return;
    window.speechSynthesis.pause();
    clearTick();
    clearResumeGuard();
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
  }, [supported, status, clearTick, clearResumeGuard, releaseWakeLock, stopKeepAlive]);

  const setSpeechRate = useCallback(
    (next: TutorSpeechRate) => {
      setRate(next);
      if (scriptRef.current) {
        const wc = countWordsLocal(scriptRef.current);
        setEstimatedDurationSec(estimateSpeechDurationSec(wc, next));
      }
      if (status === "playing" || status === "paused") {
        const chunks = chunksRef.current;
        const idx = chunkIndexRef.current;
        const remaining = chunks.slice(idx).join(" ");
        stop();
        if (remaining) {
          scriptRef.current = remaining;
          chunksRef.current = buildSpeechChunks(remaining);
          chunkIndexRef.current = 0;
          setStatus("ready");
          void play();
        }
      }
    },
    [status, stop, play],
  );

  const loadScript = useCallback((script: string, durationSec: number) => {
    const normalized = normalizeSpeechScript(script);
    scriptRef.current = normalized;
    chunksRef.current = buildSpeechChunks(normalized);
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
