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
import { sliceScriptByElapsedProgress } from "@/lib/guided-study/tutor-voice/resume-offset";
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
  const intentionalCancelRef = useRef(false);
  const userPausedRef = useRef(false);
  const suspendedRef = useRef<{
    script: string;
    chunks: string[];
    chunkIndex: number;
    estimatedDurationSec: number;
    elapsedSec: number;
    startedAt: number;
  } | null>(null);

  const [status, setStatus] = useState<TutorSpeechStatus>("idle");
  const [rate, setRate] = useState<TutorSpeechRate>(1);
  const [estimatedDurationSec, setEstimatedDurationSec] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(() => isSpeechSynthesisSupported());
  const [backgroundMode, setBackgroundMode] = useState(false);
  const [lessonSuspended, setLessonSuspended] = useState(false);
  const [awaitingResume, setAwaitingResume] = useState(false);
  const [isSnippet, setIsSnippet] = useState(false);

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

  const cancelSpeech = useCallback(() => {
    if (!supported) return;
    intentionalCancelRef.current = true;
    window.speechSynthesis.cancel();
    intentionalCancelRef.current = false;
  }, [supported]);

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
      if (userPausedRef.current) return;
      if (!window.speechSynthesis.speaking) return;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 4_000);
  }, [clearResumeGuard]);

  const stop = useCallback(() => {
    if (!supported) return;
    cancelSpeech();
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
    suspendedRef.current = null;
    userPausedRef.current = false;
    setLessonSuspended(false);
    setAwaitingResume(false);
    setIsSnippet(false);
    setStatus((s) => (s === "loading" ? s : scriptRef.current ? "ready" : "idle"));
  }, [supported, cancelSpeech, clearTick, clearResumeGuard, releaseWakeLock, stopKeepAlive]);

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
        if (userPausedRef.current) return;
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
    suspendedRef.current = null;
    setLessonSuspended(false);
    setAwaitingResume(false);
    setIsSnippet(false);
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
          userPausedRef.current = false;

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

        utterance.onerror = (event) => {
          if (intentionalCancelRef.current) return;
          if (event.error === "interrupted" || event.error === "canceled") return;
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

  const resumeFromElapsed = useCallback(
    async (fromElapsed: number, fromRate: number): Promise<void> => {
      const fullScript = scriptRef.current;
      if (!fullScript || !supported) return;

      const remaining = sliceScriptByElapsedProgress(fullScript, fromElapsed, fromRate);
      if (!remaining.trim()) {
        finishPlayback();
        return;
      }

      cancelSpeech();
      const voice = getCachedSpanishVoice() ?? (await waitForVoices());
      const chunks = buildSpeechChunks(remaining);
      chunksRef.current = chunks;
      chunkIndexRef.current = 0;

      if (!startedAtRef.current && fromElapsed > 0) {
        startedAtRef.current = Date.now() - fromElapsed * 1000;
      } else if (!startedAtRef.current) {
        startedAtRef.current = Date.now();
      }

      setElapsedSec(fromElapsed);
      queueChunks(chunks, voice, 0);
    },
    [supported, cancelSpeech, finishPlayback, queueChunks],
  );

  const play = useCallback(async (): Promise<void> => {
    if (!scriptRef.current) return;

    if (status === "paused" && !awaitingResume && !lessonSuspended) {
      if (window.speechSynthesis.paused) {
        userPausedRef.current = false;
        window.speechSynthesis.resume();
        setStatus("playing");
        startTick();
        startResumeGuard();
        void requestWakeLock();
        startKeepAlive();
        return;
      }

      if (elapsedSec > 0) {
        await resumeFromElapsed(elapsedSec, rateRef.current);
        return;
      }
    }

    if (!supported) return;

    cancelSpeech();
    const voice = getCachedSpanishVoice() ?? (await waitForVoices());
    const chunks = buildSpeechChunks(scriptRef.current);
    chunksRef.current = chunks;
    chunkIndexRef.current = 0;
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    queueChunks(chunks, voice, 0);
  }, [
    status,
    awaitingResume,
    lessonSuspended,
    elapsedSec,
    supported,
    cancelSpeech,
    startTick,
    queueChunks,
    startResumeGuard,
    requestWakeLock,
    startKeepAlive,
    resumeFromElapsed,
  ]);

  const suspendLesson = useCallback(() => {
    if (!scriptRef.current || suspendedRef.current) return;

    if (status === "playing" || window.speechSynthesis.speaking) {
      cancelSpeech();
    }

    if (!chunksRef.current.length) {
      chunksRef.current = buildSpeechChunks(scriptRef.current);
    }

    suspendedRef.current = {
      script: scriptRef.current,
      chunks: [...chunksRef.current],
      chunkIndex: chunkIndexRef.current,
      estimatedDurationSec,
      elapsedSec,
      startedAt: startedAtRef.current || Date.now() - elapsedSec * 1000,
    };
    clearTick();
    clearResumeGuard();
    void releaseWakeLock();
    stopKeepAlive();
    setLessonSuspended(true);
    setAwaitingResume(false);
    setIsSnippet(false);
    setStatus("paused");
  }, [
    status,
    estimatedDurationSec,
    elapsedSec,
    clearTick,
    clearResumeGuard,
    releaseWakeLock,
    stopKeepAlive,
  ]);

  const playSnippet = useCallback(
    async (text: string): Promise<void> => {
      if (!supported || !text.trim()) return;

      if (!suspendedRef.current && scriptRef.current) {
        suspendLesson();
      }

      cancelSpeech();
      const voice = getCachedSpanishVoice() ?? (await waitForVoices());
      const normalized = normalizeSpeechScript(text);
      const utterance = new SpeechSynthesisUtterance(normalized);
      utterance.lang = voice?.lang ?? "es-PE";
      if (voice) utterance.voice = voice;
      utterance.rate = rateRef.current;
      utterance.pitch = 1;
      utterance.volume = 1;

      setIsSnippet(true);
      setAwaitingResume(false);
      setStatus("playing");
      setError(null);
      startTick();
      void requestWakeLock();
      startKeepAlive();
      startResumeGuard();
      setupMediaSession("Profesor IA — respuesta");

      await new Promise<void>((resolve) => {
        utterance.onend = () => {
          clearTick();
          clearResumeGuard();
          void releaseWakeLock();
          stopKeepAlive();
          setIsSnippet(false);
          setAwaitingResume(true);
          setStatus("paused");
          resolve();
        };
        utterance.onerror = (event) => {
          if (intentionalCancelRef.current) return;
          if (event.error === "interrupted" || event.error === "canceled") return;
          clearTick();
          clearResumeGuard();
          setIsSnippet(false);
          setStatus("error");
          setError("No se pudo reproducir la respuesta.");
          void releaseWakeLock();
          stopKeepAlive();
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    },
    [
      supported,
      suspendLesson,
      startTick,
      clearTick,
      clearResumeGuard,
      requestWakeLock,
      startKeepAlive,
      startResumeGuard,
      setupMediaSession,
      releaseWakeLock,
      stopKeepAlive,
    ],
  );

  const resumeLesson = useCallback(async (): Promise<void> => {
    const saved = suspendedRef.current;
    if (!saved) {
      void play();
      return;
    }

    if (!supported) return;

    cancelSpeech();
    const voice = getCachedSpanishVoice() ?? (await waitForVoices());
    scriptRef.current = saved.script;
    setEstimatedDurationSec(saved.estimatedDurationSec);
    setElapsedSec(saved.elapsedSec);
    startedAtRef.current = saved.startedAt;
    suspendedRef.current = null;
    userPausedRef.current = false;
    setLessonSuspended(false);
    setAwaitingResume(false);
    setIsSnippet(false);

    const remaining = sliceScriptByElapsedProgress(
      saved.script,
      saved.elapsedSec,
      rateRef.current,
    );
    if (!remaining.trim()) {
      finishPlayback();
      return;
    }

    chunksRef.current = buildSpeechChunks(remaining);
    chunkIndexRef.current = 0;
    queueChunks(chunksRef.current, voice, 0);
  }, [supported, play, cancelSpeech, queueChunks, finishPlayback]);

  const pause = useCallback(() => {
    if (!supported) return;

    const canPause =
      window.speechSynthesis.speaking || status === "playing" || status === "paused";
    if (!canPause) return;

    userPausedRef.current = true;
    clearResumeGuard();
    clearTick();

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }

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
      if (next === rateRef.current) return;

      const oldRate = rateRef.current;
      const wasPlaying = status === "playing" || window.speechSynthesis.speaking;
      const savedElapsed = elapsedSec;
      const savedStartedAt =
        startedAtRef.current || Date.now() - savedElapsed * 1000;

      setRate(next);
      rateRef.current = next;

      const fullScript = scriptRef.current;
      if (fullScript) {
        setEstimatedDurationSec(
          estimateSpeechDurationSec(countWordsLocal(fullScript), next),
        );
      }

      if (status !== "playing" && status !== "paused") return;
      if (isSnippet) return;

      const remaining = fullScript
        ? sliceScriptByElapsedProgress(fullScript, savedElapsed, oldRate)
        : "";

      cancelSpeech();
      clearResumeGuard();

      setElapsedSec(savedElapsed);
      startedAtRef.current = savedStartedAt;

      if (!remaining.trim()) {
        if (savedElapsed > 0) finishPlayback();
        return;
      }

      chunksRef.current = buildSpeechChunks(remaining);
      chunkIndexRef.current = 0;

      if (wasPlaying && chunksRef.current.length) {
        void (async () => {
          const voice = getCachedSpanishVoice() ?? (await waitForVoices());
          setStatus("playing");
          setError(null);
          startTick();
          void requestWakeLock();
          startKeepAlive();
          startResumeGuard();
          setupMediaSession("Clase narrada — MemoriaStudy");
          queueChunks(chunksRef.current, voice, 0);
        })();
      } else {
        setStatus("paused");
      }
    },
    [
      status,
      isSnippet,
      elapsedSec,
      cancelSpeech,
      clearResumeGuard,
      finishPlayback,
      startTick,
      requestWakeLock,
      startKeepAlive,
      startResumeGuard,
      setupMediaSession,
      queueChunks,
    ],
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
    lessonSuspended,
    awaitingResume,
    isSnippet,
    loadScript,
    play,
    pause,
    stop,
    reset,
    suspendLesson,
    playSnippet,
    resumeLesson,
    isPlaying: status === "playing",
    isPaused: status === "paused",
    canPlay: Boolean(scriptRef.current) && status !== "loading",
  };
}
