"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  ACTIVE_STUDY_IDLE_MS,
  ACTIVE_STUDY_TICK_MS,
  creditActiveStudyMs,
  isStudySessionIdle,
  normalizeActiveStudyFields,
  readingMinutesFromActiveMs,
  type ActiveStudyTimeFields,
} from "@/lib/study/active-study-time";

type Options<T extends ActiveStudyTimeFields> = {
  enabled?: boolean;
  onPersist: (state: T) => void;
};

export function useActiveStudyTime<T extends ActiveStudyTimeFields>(
  state: T,
  setState: Dispatch<SetStateAction<T>>,
  options: Options<T>,
) {
  const enabled = options.enabled ?? true;
  const onPersistRef = useRef(options.onPersist);
  onPersistRef.current = options.onPersist;

  const [readingMinutes, setReadingMinutes] = useState(() =>
    readingMinutesFromActiveMs(normalizeActiveStudyFields(state).activeStudyMs),
  );

  const flushRef = useRef<(now?: number) => void>(() => undefined);

  const flush = useCallback(
    (now = Date.now()) => {
      let creditedMs = 0;
      setState((current) => {
        const next = creditActiveStudyMs(current, now) as T;
        creditedMs = next.activeStudyMs ?? 0;
        onPersistRef.current(next);
        return next;
      });
      setReadingMinutes(readingMinutesFromActiveMs(creditedMs));
    },
    [setState],
  );

  flushRef.current = flush;

  const registerActivity = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    setState((current) => {
      const normalized = normalizeActiveStudyFields(current, now);
      if (now - (normalized.lastActivityAt ?? 0) < 750) {
        return current;
      }
      const next = { ...current, lastActivityAt: now } as T;
      onPersistRef.current(next);
      return next;
    });
  }, [enabled, setState]);

  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => registerActivity();

    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("touchstart", onActivity, { passive: true });

    const onVisibilityChange = () => {
      if (document.hidden) {
        flushRef.current?.();
        return;
      }

      setState((current) => {
        const now = Date.now();
        const next = { ...current, lastTickAt: now } as T;
        onPersistRef.current(next);
        return next;
      });
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    const tick = window.setInterval(() => {
      if (document.hidden) return;
      setState((current) => {
        if (isStudySessionIdle(current)) {
          return current;
        }
        const next = creditActiveStudyMs(current) as T;
        onPersistRef.current(next);
        setReadingMinutes(readingMinutesFromActiveMs(next.activeStudyMs ?? 0));
        return next;
      });
    }, ACTIVE_STUDY_TICK_MS);

    const onPageHide = () => flushRef.current?.();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("touchstart", onActivity);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(tick);
      flushRef.current?.();
    };
  }, [enabled, registerActivity, setState]);

  useEffect(() => {
    setReadingMinutes(
      readingMinutesFromActiveMs(normalizeActiveStudyFields(state).activeStudyMs),
    );
  }, [state.activeStudyMs]);

  return {
    readingMinutes,
    registerActivity,
    flush,
    idleMs: ACTIVE_STUDY_IDLE_MS,
  };
}
