"use client";

import { Loader2 } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { getVisualAiFormat } from "@/lib/organizers/visual-ai-formats";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";

export function VisualIaGenerating({
  formatId,
  percent,
  message,
  stageLabel,
}: {
  formatId: VisualAiFormatId;
  percent: number;
  message: string;
  stageLabel: string;
}) {
  const format = getVisualAiFormat(formatId);
  const isStructured = format.renderMode === "structured";
  const etaLow = isStructured ? 2 : Math.max(8, Math.round(format.estimatedSeconds * 0.6));
  const etaHigh = isStructured ? 8 : format.estimatedSeconds + 15;
  const aspectRatio =
    format.aspectRatio === "1:1" ? "1 / 1" : format.aspectRatio === "4:3" ? "4 / 3" : "16 / 9";

  return (
    <div className="visual-ai-generating-stage">
      <div className="visual-ai-generating" style={{ aspectRatio }}>
        <span className="visual-ai-generating__emoji" aria-hidden>
          {format.emoji}
        </span>
      </div>

      <div className="visual-ai-generating__meta">
        <p className="visual-ai-generating__flux">
          <Loader2 size={14} className="animate-spin" />
          {isStructured ? "Renderizando diagrama estructurado…" : "Generando con FLUX…"}
        </p>
        <p className="visual-ai-hub__title" style={{ marginTop: "0.65rem", fontSize: "0.95rem" }}>
          {format.emoji} {format.label}
        </p>
        <LoadingState
          active
          preset="visualAi"
          percent={percent}
          message={message}
          stageLabel={stageLabel}
          variant="inline"
        />
        <p className="visual-ai-generating__eta">
          Tiempo estimado: {etaLow}–{etaHigh} s
        </p>
      </div>
    </div>
  );
}
