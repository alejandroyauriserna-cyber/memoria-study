"use client";

type Props = {
  percent: number;
  message: string;
  stageLabel?: string;
  currentChunk?: number;
  totalChunks?: number;
};

export function GenerationProgress({
  percent,
  message,
  stageLabel,
  currentChunk,
  totalChunks,
}: Props) {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div
      className="rounded-lg border border-accent/40 bg-card p-4 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-accent">
          {stageLabel ?? "Procesando"}
        </span>
        <span className="font-semibold tabular-nums">{safePercent}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
          style={{ width: `${safePercent}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{message}</p>

      {totalChunks && totalChunks > 1 ? (
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Parte {currentChunk ?? 0} de {totalChunks}
        </p>
      ) : null}
    </div>
  );
}
