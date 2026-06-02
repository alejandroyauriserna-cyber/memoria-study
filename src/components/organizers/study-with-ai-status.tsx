"use client";

import { GenerationProgress } from "@/components/study/generation-progress";

type StudyWithAiStatusProps = {
  isGenerating: boolean;
  stageLabel: string;
  message: string;
  percent: number;
  error?: string;
};

export function StudyWithAiStatus({
  isGenerating,
  stageLabel,
  message,
  percent,
  error,
}: StudyWithAiStatusProps) {
  if (!isGenerating && !error) {
    return null;
  }

  return (
    <div className="space-y-3">
      {isGenerating ? (
        <GenerationProgress
          percent={percent}
          message={message}
          stageLabel={stageLabel}
        />
      ) : null}

      {error ? (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
