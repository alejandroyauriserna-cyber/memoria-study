"use client";

import { Target } from "lucide-react";
import { computeMasteryPercent, formatMasteryLabel } from "@/lib/guided-study/learning-mastery";
import type { GuidedStudyMastery } from "@/types/guided-legal-study";

export function MasteryProgressBadge({ mastery }: { mastery?: GuidedStudyMastery }) {
  const percent = computeMasteryPercent(mastery);
  const label = formatMasteryLabel(percent);
  const activities = mastery?.activityCount ?? 0;

  if (!activities) {
    return (
      <span className="gs-mastery-badge gs-mastery-badge--empty" title="Completa prácticas activas">
        <Target size={12} />
        Practica para medir dominio
      </span>
    );
  }

  return (
    <span className="gs-mastery-badge" title="Basado en casos, recuperación y explicaciones propias">
      <Target size={12} />
      <span>
        Comprensión estimada: <strong>{percent}%</strong>
      </span>
      <span className="gs-mastery-badge-sub">{label}</span>
    </span>
  );
}
