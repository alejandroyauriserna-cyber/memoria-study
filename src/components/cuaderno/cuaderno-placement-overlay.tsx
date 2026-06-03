"use client";

import type { PlaceProgress } from "@/lib/cuaderno/place-decoration";

export function CuadernoPlacementOverlay({
  progress,
}: {
  progress: PlaceProgress | null;
}) {
  if (!progress) return null;

  return (
    <div className="cn-placement-overlay" role="status" aria-live="polite">
      <div className="cn-placement-card">
        <div className="cn-placement-bar">
          <div className="cn-placement-bar-fill" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="cn-placement-label">{progress.label}</p>
        <span className="cn-placement-pct">{Math.round(progress.percent)}%</span>
      </div>
    </div>
  );
}
