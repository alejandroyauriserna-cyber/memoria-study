"use client";

import { buildProviderTimelineSteps, formatEstimatedCostUsd, formatGenerationDuration } from "@/lib/ai/image-generation-display";
import type { ImageGenerationDiagnostics } from "@/lib/ai/image-generation-types";

const STATUS_MARK: Record<string, string> = {
  success: "✓",
  failed: "✗",
  skipped: "○",
};

const STATUS_CLASS: Record<string, string> = {
  success: "visual-ai-provider-timeline__step--success",
  failed: "visual-ai-provider-timeline__step--failed",
  skipped: "visual-ai-provider-timeline__step--skipped",
};

export function ImageGenerationProviderTimeline({
  diagnostics,
}: {
  diagnostics: ImageGenerationDiagnostics;
}) {
  const steps = buildProviderTimelineSteps(diagnostics);
  const costLabel = formatEstimatedCostUsd(diagnostics.estimatedCostUsd);

  return (
    <section className="visual-ai-provider-timeline">
      <p className="visual-ai-provider-timeline__title">Provider chain</p>

      <ol className="visual-ai-provider-timeline__list">
        {steps.map((step, index) => (
          <li
            key={`${step.id}-${index}`}
            className={`visual-ai-provider-timeline__step ${STATUS_CLASS[step.status] ?? ""}`}
          >
            <span className="visual-ai-provider-timeline__mark" aria-hidden>
              {STATUS_MARK[step.status]}
            </span>
            <div className="visual-ai-provider-timeline__body">
              <span className="visual-ai-provider-timeline__label">{step.label}</span>
              {step.durationMs != null && step.status !== "skipped" ? (
                <span className="visual-ai-provider-timeline__detail">
                  {formatGenerationDuration(step.durationMs)}
                </span>
              ) : null}
              {step.error ? (
                <span className="visual-ai-provider-timeline__error" title={step.error}>
                  {step.error.slice(0, 120)}
                  {step.error.length > 120 ? "…" : ""}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <dl className="visual-ai-provider-timeline__facts">
        <div>
          <dt>Proveedor utilizado</dt>
          <dd>{diagnostics.provider.toUpperCase()}</dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{formatGenerationDuration(diagnostics.durationMs)}</dd>
        </div>
        <div>
          <dt>Coste</dt>
          <dd>{costLabel ?? "$0.000"}</dd>
        </div>
      </dl>
    </section>
  );
}
