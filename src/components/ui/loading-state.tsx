"use client";

import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { LoadingProgress } from "@/components/ui/loading-progress";
import type { ProgressPresetKey, ProgressStage } from "@/lib/loading/progress-stages";

type LoadingStateProps = {
  active: boolean;
  preset?: ProgressPresetKey | ProgressStage[];
  percent?: number;
  message?: string;
  stageLabel?: string;
  currentChunk?: number;
  totalChunks?: number;
  variant?: "card" | "inline" | "overlay";
  className?: string;
};

export function LoadingState({
  active,
  preset = "generic",
  percent: externalPercent,
  message: externalMessage,
  stageLabel: externalStageLabel,
  currentChunk,
  totalChunks,
  variant = "card",
  className,
}: LoadingStateProps) {
  const simulated = useLoadingProgress(active && externalPercent === undefined, preset);

  if (!active) return null;

  return (
    <LoadingProgress
      percent={externalPercent ?? simulated.percent}
      message={externalMessage ?? simulated.message}
      stageLabel={externalStageLabel ?? simulated.stageLabel}
      currentChunk={currentChunk}
      totalChunks={totalChunks}
      variant={variant}
      className={className}
    />
  );
}
