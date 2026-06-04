"use client";

type LoadingProgressProps = {
  percent: number;
  message: string;
  stageLabel?: string;
  currentChunk?: number;
  totalChunks?: number;
  variant?: "card" | "inline" | "overlay";
  className?: string;
};

export function LoadingProgress({
  percent,
  message,
  stageLabel,
  currentChunk,
  totalChunks,
  variant = "card",
  className = "",
}: LoadingProgressProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));

  if (variant === "inline") {
    return (
      <div className={`space-y-1.5 ${className}`} role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-[#F5F7FA]/80">{stageLabel ?? "Cargando"}</span>
          <span className="font-bold tabular-nums text-[#00FFD5]">{safePercent}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
          <div
            className="h-full rounded-full bg-[#00FFD5] transition-all duration-500 ease-out"
            style={{ width: `${safePercent}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">{message}</p>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-4 px-6 py-10 text-center ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="w-full max-w-sm rounded-2xl border border-[rgba(0,255,213,0.2)] bg-[rgba(7,19,26,0.85)] p-5 shadow-[0_0_40px_rgba(0,255,213,0.08)]">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-[#00FFD5]">{stageLabel ?? "Cargando"}</span>
            <span className="text-2xl font-bold tabular-nums text-[#F5F7FA]">{safePercent}%</span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00BFFF] to-[#00FFD5] transition-all duration-500 ease-out"
              style={{ width: `${safePercent}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{message}</p>
          {totalChunks && totalChunks > 1 ? (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Parte {currentChunk ?? 0} de {totalChunks}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(7,19,26,0.55)] p-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-[#00FFD5]">{stageLabel ?? "Procesando"}</span>
        <span className="text-lg font-bold tabular-nums text-[#F5F7FA]">{safePercent}%</span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#00BFFF] to-[#00FFD5] transition-all duration-500 ease-out"
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
