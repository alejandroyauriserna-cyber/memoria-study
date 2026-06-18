"use client";

import { useState } from "react";
import { Brain, Loader2, Send } from "lucide-react";
import { daysSinceReview } from "@/lib/guided-study/spaced-repetition";
import type { SpacedReviewItem } from "@/types/guided-legal-study";

export function SpacedReviewBanner({
  review,
  onComplete,
  onDismiss,
}: {
  review: SpacedReviewItem;
  onComplete: (score: number) => void;
  onDismiss: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const days = daysSinceReview(review);

  async function submit() {
    if (answer.trim().length < 4) return;
    setEvaluating(true);
    try {
      const res = await fetch("/api/guided-study/learning/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "retrieval",
          question: `¿Recuerdas «${review.concept}»? Explícalo con tus palabras.`,
          studentAnswer: answer.trim(),
          referenceContext: review.concept,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error);
      setFeedback(payload.result.feedback);
      onComplete(payload.result.score);
    } catch {
      setFeedback("Buen intento — repasa la página donde estudiaste este tema.");
      onComplete(50);
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="gs-spaced-review">
      <p className="gs-spaced-review-kicker">
        <Brain size={14} />
        Repaso de memoria
      </p>
      <p className="gs-spaced-review-prompt">
        Hace {days} día{days === 1 ? "" : "s"} estudiaste <strong>{review.concept}</strong>. ¿La
        recuerdas?
      </p>
      {!feedback ? (
        <>
          <textarea
            className="gs-le-textarea"
            rows={2}
            placeholder="Responde sin mirar el material…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="gs-spaced-review-actions">
            <button
              type="button"
              className="gs-le-submit gs-le-submit--secondary"
              disabled={evaluating || answer.trim().length < 4}
              onClick={() => void submit()}
            >
              {evaluating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Verificar
            </button>
            <button type="button" className="gs-spaced-skip" onClick={onDismiss}>
              Después
            </button>
          </div>
        </>
      ) : (
        <p className="gs-le-feedback is-neutral">{feedback}</p>
      )}
    </div>
  );
}
