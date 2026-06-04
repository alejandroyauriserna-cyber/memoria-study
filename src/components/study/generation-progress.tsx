"use client";

import { LoadingProgress } from "@/components/ui/loading-progress";

type Props = {
  percent: number;
  message: string;
  stageLabel?: string;
  currentChunk?: number;
  totalChunks?: number;
};

/** @deprecated Prefer LoadingProgress or LoadingState from @/components/ui */
export function GenerationProgress({
  percent,
  message,
  stageLabel,
  currentChunk,
  totalChunks,
}: Props) {
  return (
    <LoadingProgress
      percent={percent}
      message={message}
      stageLabel={stageLabel}
      currentChunk={currentChunk}
      totalChunks={totalChunks}
    />
  );
}
