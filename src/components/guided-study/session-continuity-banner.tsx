"use client";

import { BookOpen, X } from "lucide-react";

export function SessionContinuityBanner({
  message,
  concept,
  onReview,
  onDismiss,
}: {
  message: string;
  concept: string;
  onReview: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="gs-continuity-banner">
      <BookOpen size={16} className="text-accent shrink-0" />
      <p className="flex-1 text-xs leading-relaxed">{message}</p>
      <button type="button" className="gs-continuity-review" onClick={onReview}>
        Repasar «{concept.length > 28 ? `${concept.slice(0, 28)}…` : concept}»
      </button>
      <button type="button" className="gs-continuity-dismiss" onClick={onDismiss} aria-label="Descartar">
        <X size={14} />
      </button>
    </div>
  );
}
