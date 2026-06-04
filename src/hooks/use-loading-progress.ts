"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProgressPreset,
  type ProgressPresetKey,
  type ProgressStage,
} from "@/lib/loading/progress-stages";

type Options = {
  stageIntervalMs?: number;
  tickMs?: number;
  maxSimulatedPercent?: number;
};

const DEFAULT_OPTIONS: Required<Options> = {
  stageIntervalMs: 3500,
  tickMs: 600,
  maxSimulatedPercent: 94,
};

export function useLoadingProgress(
  active: boolean,
  preset: ProgressPresetKey | ProgressStage[] = "generic",
  options?: Options,
) {
  const stages = Array.isArray(preset) ? preset : getProgressPreset(preset);
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [percent, setPercent] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const forcedPercent = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setPercent(0);
      setStageIndex(0);
      forcedPercent.current = null;
      return;
    }

    setStageIndex(0);
    setPercent(stages[0]?.percent ?? 5);
    forcedPercent.current = null;

    const stageTimer = window.setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, stages.length - 1));
    }, opts.stageIntervalMs);

    const tickTimer = window.setInterval(() => {
      setPercent((current) => {
        if (forcedPercent.current !== null) return forcedPercent.current;
        return Math.min(current + 2, opts.maxSimulatedPercent);
      });
    }, opts.tickMs);

    return () => {
      window.clearInterval(stageTimer);
      window.clearInterval(tickTimer);
    };
  }, [active, opts.maxSimulatedPercent, opts.stageIntervalMs, opts.tickMs, stages]);

  useEffect(() => {
    if (!active) return;
    const stagePercent = stages[stageIndex]?.percent ?? 0;
    setPercent((current) => {
      if (forcedPercent.current !== null) return forcedPercent.current;
      return Math.max(current, stagePercent);
    });
  }, [active, stageIndex, stages]);

  const complete = useCallback(() => {
    forcedPercent.current = 100;
    setPercent(100);
  }, []);

  const setProgress = useCallback((value: number) => {
    forcedPercent.current = Math.min(100, Math.max(0, value));
    setPercent(forcedPercent.current);
  }, []);

  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const stage = stages[stageIndex] ?? stages[0] ?? { label: "Cargando", percent: 0, message: "" };

  return {
    percent,
    stageLabel: stage.label,
    message: customMessage ?? stage.message,
    stageIndex,
    complete,
    setProgress,
    setMessage: setCustomMessage,
  };
}

export function useLoadingProgressRun(preset: ProgressPresetKey = "generic", options?: Options) {
  const [active, setActive] = useState(false);
  const { complete, ...progressRest } = useLoadingProgress(active, preset, options);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      setActive(true);
      try {
        const result = await fn();
        complete();
        await new Promise((resolve) => window.setTimeout(resolve, 350));
        return result;
      } finally {
        setActive(false);
      }
    },
    [complete],
  );

  return {
    loading: active,
    run,
    complete,
    ...progressRest,
  };
}
