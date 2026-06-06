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
          <span className="ms-loading-progress-inline__stage">{stageLabel ?? "Cargando"}</span>
          <span className="ms-loading-progress-inline__percent">{safePercent}%</span>
        </div>
        <div className="ms-loading-progress__track ms-loading-progress__track--sm">
          <div className="ms-loading-progress__bar" style={{ width: `${safePercent}%` }} />
        </div>
        <p className="ms-loading-progress__message ms-loading-progress__message--sm">{message}</p>
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
        <div className="ms-loading-progress-overlay__card">
          <div className="ms-loading-progress__head">
            <span className="ms-loading-progress__label">{stageLabel ?? "Cargando"}</span>
            <span className="ms-loading-progress__percent ms-loading-progress__percent--lg">
              {safePercent}%
            </span>
          </div>
          <div className="ms-loading-progress__track ms-loading-progress__track--lg">
            <div className="ms-loading-progress__bar" style={{ width: `${safePercent}%` }} />
          </div>
          <p className="ms-loading-progress__message">{message}</p>
          {totalChunks && totalChunks > 1 ? (
            <p className="ms-loading-progress__meta">
              Parte {currentChunk ?? 0} de {totalChunks}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`ms-loading-progress ${className}`} role="status" aria-live="polite">
      <div className="ms-loading-progress__head">
        <span className="ms-loading-progress__label">{stageLabel ?? "Procesando"}</span>
        <span className="ms-loading-progress__percent">{safePercent}%</span>
      </div>

      <div className="ms-loading-progress__track ms-loading-progress__track--md">
        <div className="ms-loading-progress__bar" style={{ width: `${safePercent}%` }} />
      </div>

      <p className="ms-loading-progress__message">{message}</p>

      {totalChunks && totalChunks > 1 ? (
        <p className="ms-loading-progress__meta">
          Parte {currentChunk ?? 0} de {totalChunks}
        </p>
      ) : null}
    </div>
  );
}
