"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import {
  resolveOrganizerCardMeta,
  resolveOrganizerCardPreview,
} from "@/lib/organizers/card-preview-stats";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";

export function OrganizerCardMeta({
  content,
  courseName,
  cycleLabel,
}: {
  content: unknown;
  courseName: string;
  cycleLabel?: string;
}) {
  const { meta, preview } = useMemo(() => {
    const parsed = parseOrganizerContent(content);
    return {
      meta: resolveOrganizerCardMeta(parsed),
      preview: resolveOrganizerCardPreview(parsed),
    };
  }, [content]);

  return (
    <div className="organizer-card-meta">
      <p className="organizer-card-meta__course">
        {courseName}
        {cycleLabel ? (
          <span className="organizer-card-meta__cycle"> · {cycleLabel}</span>
        ) : null}
      </p>
      <div className="organizer-card-meta__stats">
        {meta.hasConceptMap ? (
          <>
            <span>
              {meta.conceptCount}{" "}
              {meta.conceptCount === 1 ? "concepto" : "conceptos"}
            </span>
            {meta.branchCount > 0 ? (
              <>
                <span className="organizer-card-meta__dot" aria-hidden>
                  ·
                </span>
                <span>
                  {meta.branchCount} {meta.branchCount === 1 ? "rama" : "ramas"}
                </span>
              </>
            ) : null}
          </>
        ) : preview ? (
          <span>
            {preview.count} {preview.unit}
          </span>
        ) : (
          <span>Listo para estudiar</span>
        )}
        <span className="organizer-card-meta__dot" aria-hidden>
          ·
        </span>
        <span className="organizer-card-meta__ai">
          <Sparkles size={10} aria-hidden />
          Generado por IA
        </span>
      </div>
    </div>
  );
}
