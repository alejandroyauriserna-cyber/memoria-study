"use client";

import { Check } from "lucide-react";

const TOOLTIP =
  "Tus explicaciones pueden complementarse con información actualizada y referencias verificadas.";

export function AcademicTrustSourcesBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className="ms-academic-sources-badge"
      data-tooltip={TOOLTIP}
      tabIndex={0}
      role="status"
      aria-label={`Fuentes activas. ${TOOLTIP}`}
    >
      <Check size={12} strokeWidth={2.75} />
      {compact ? "Fuentes" : "Fuentes activas"}
    </span>
  );
}
