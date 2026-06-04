"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { generateCourseCoverRemote } from "@/lib/cuaderno/collections-client";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";

export function CuadernoGenerateCoverButton({
  courseId,
  courseName,
  cycleLabel,
  onGenerated,
  className = "",
}: {
  courseId: string;
  courseName: string;
  cycleLabel?: string;
  onGenerated: (cover: CourseCoverArt) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverProgress = useLoadingProgress(loading, "aiGenerate");

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const cover = await generateCourseCoverRemote(courseId, courseName, cycleLabel);
      onGenerated(cover);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl border border-[#00FFD5]/25 bg-[#00FFD5]/10 px-4 py-2.5 text-xs font-bold text-[#00FFD5] transition hover:bg-[#00FFD5]/18 disabled:opacity-60"
      >
        {loading ? `Portada IA ${coverProgress.percent}%` : (
          <>
            <Sparkles size={14} />
            Portada IA
          </>
        )}
      </button>
      {loading ? (
        <LoadingState
          active
          preset="aiGenerate"
          percent={coverProgress.percent}
          message={coverProgress.message}
          stageLabel={coverProgress.stageLabel}
          variant="inline"
          className="mt-2"
        />
      ) : null}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
