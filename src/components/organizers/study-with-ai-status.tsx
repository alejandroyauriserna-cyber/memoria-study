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
          className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
