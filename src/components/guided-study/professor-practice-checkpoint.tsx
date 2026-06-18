"use client";

import { Brain, Loader2, Play, SkipForward } from "lucide-react";
import { useState } from "react";
import type { NarrationCheckpoint } from "@/lib/guided-study/tutor-voice/narration-checkpoints";

function checkpointTitle(type: NarrationCheckpoint["type"]): string {
  if (type === "feynman") return "Explícame con tus palabras";
  if (type === "retrieval") return "¿Qué entendiste hasta aquí?";
  return "¿En qué consiste?";
}

export function ProfessorPracticeCheckpoint({
  checkpoint,
  referenceContext,
  onContinue,
  disabled,
}: {
  checkpoint: NarrationCheckpoint;
  referenceContext: string;
  onContinue: () => void;
  disabled?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submitEvaluate() {
    const trimmed = answer.trim();
    if (trimmed.length < 4 || evaluating) return;

    setEvaluating(true);
    try {
      if (checkpoint.type === "feynman" && checkpoint.concept && checkpoint.audiencePrompt) {
        const res = await fetch("/api/guided-study/learning/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "feynman",
            concept: checkpoint.concept,
            audiencePrompt: checkpoint.audiencePrompt,
            studentExplanation: trimmed,
            referenceContext,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Error");
        setFeedback(payload.evaluation.summary);
      } else {
        const res = await fetch("/api/guided-study/learning/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "retrieval",
            question: checkpoint.prompt,
            studentAnswer: trimmed,
            referenceContext,
          }),
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error ?? "Error");
        setFeedback(payload.result.feedback);
      }
    } catch {
      setFeedback("Buen intento. Compara tu respuesta con lo que escuchaste y sigue con la clase.");
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="professor-practice-checkpoint" role="region" aria-label="Pausa de práctica">
      <p className="professor-practice-checkpoint__kicker">
        <Brain size={14} aria-hidden />
        {checkpointTitle(checkpoint.type)}
      </p>
      <p className="professor-practice-checkpoint__prompt">{checkpoint.prompt}</p>
      {checkpoint.hint ? (
        <p className="professor-practice-checkpoint__hint">Pista: {checkpoint.hint}</p>
      ) : null}

      <textarea
        className="professor-practice-checkpoint__input"
        rows={3}
        placeholder="Responde con tus palabras (voz o texto)…"
        value={answer}
        disabled={Boolean(feedback) || disabled}
        onChange={(e) => setAnswer(e.target.value)}
        aria-label="Tu respuesta"
      />

      {feedback ? (
        <p className="professor-practice-checkpoint__feedback">{feedback}</p>
      ) : null}

      <div className="professor-practice-checkpoint__actions">
        {!feedback ? (
          <>
            <button
              type="button"
              className="professor-practice-checkpoint__verify"
              disabled={disabled || evaluating || answer.trim().length < 4}
              onClick={() => void submitEvaluate()}
            >
              {evaluating ? <Loader2 size={14} className="animate-spin" /> : null}
              Verificar respuesta
            </button>
            <button
              type="button"
              className="professor-practice-checkpoint__skip"
              disabled={disabled || evaluating}
              onClick={onContinue}
            >
              <SkipForward size={14} />
              Continuar sin responder
            </button>
          </>
        ) : (
          <button
            type="button"
            className="professor-practice-checkpoint__continue professor-ai-playback professor-ai-playback--primary"
            disabled={disabled}
            onClick={onContinue}
          >
            <Play size={16} />
            Seguir con la clase
          </button>
        )}
      </div>
    </div>
  );
}
