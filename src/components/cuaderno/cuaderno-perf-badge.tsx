"use client";

import type { CuadernoPerfStats } from "@/hooks/use-cuaderno-perf";

export function CuadernoPerfBadge({ stats }: { stats: CuadernoPerfStats }) {
  const fpsClass = stats.fps >= 55 ? "is-good" : stats.fps >= 40 ? "is-ok" : "is-bad";
  return (
    <div className="cn-perf-badge" aria-live="polite">
      <span className={`cn-perf-fps ${fpsClass}`}>{stats.fps} FPS</span>
      <span>render {stats.renderMs}ms</span>
      {stats.memoryMb != null ? <span>mem {stats.memoryMb}MB</span> : null}
    </div>
  );
}
