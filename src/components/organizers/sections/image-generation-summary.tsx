"use client";

import { CheckCircle2, Clock3, Coins } from "lucide-react";
import {
  buildMinimalGenerationSummary,
  buildStudentGenerationSummary,
} from "@/lib/ai/image-generation-display";
import type {
  ImageGenerationDiagnostics,
  ImageGenerationSource,
} from "@/lib/ai/image-generation-types";

export function ImageGenerationSummary({
  source,
  model,
  diagnostics,
}: {
  source: ImageGenerationSource;
  model?: string;
  diagnostics?: ImageGenerationDiagnostics | null;
}) {
  if (source === "structured") return null;

  const summary = diagnostics
    ? buildStudentGenerationSummary(diagnostics)
    : buildMinimalGenerationSummary(source, model);

  return (
    <div className="image-gen-summary" role="status" aria-live="polite">
      <div className="image-gen-summary__main">
        <div className="image-gen-summary__left">
          <p className="image-gen-summary__provider">
            <CheckCircle2 size={15} aria-hidden />
            {summary.providerLabel}
          </p>
          {summary.model ? <p className="image-gen-summary__model">{summary.model}</p> : null}
        </div>

        <div className="image-gen-summary__stats">
          <span className="image-gen-summary__stat">
            <Clock3 size={13} aria-hidden />
            Tiempo: {summary.durationLabel}
          </span>
          {summary.costLabel ? (
            <span className="image-gen-summary__stat">
              <Coins size={13} aria-hidden />
              Costo estimado: {summary.costLabel}
            </span>
          ) : null}
        </div>
      </div>

      {summary.fallbackExplanation ? (
        <p className="image-gen-summary__fallback whitespace-pre-line">
          {summary.fallbackExplanation}
        </p>
      ) : null}
    </div>
  );
}
