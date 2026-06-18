"use client";

import { Brain, Loader2, Mic, Play, SkipForward, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useSpeechDictation } from "@/hooks/use-speech-dictation";
import type { NarrationCheckpoint } from "@/lib/guided-study/tutor-voice/narration-checkpoints";

type PracticeFeedback = {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  clarification: string;
  needsImprovement: boolean;
};

function checkpointTitle(type: NarrationCheckpoint["type"]): string {
  if (type === "feynman") return "Explícame con tus palabras";
  if (type === "retrieval") return "¿Qué entendiste hasta aquí?";
  return "¿En qué consiste?";
}

function buildPracticeFeedback(input: {
  score: number;
  summary: string;
  strengths?: string[];
  gaps?: string[];
  missingPoints?: string[];
  clarification?: string;
}): PracticeFeedback {
  const gaps = [...(input.gaps ?? []), ...(input.missingPoints ?? [])];
  const clarification = input.clarification?.trim() ?? "";
  const needsImprovement = input.score < 75 || gaps.length > 0 || clarification.length > 0;

  return {
    score: input.score,
    summary: input.summary,
    strengths: input.strengths ?? [],
    gaps,
    clarification,
    needsImprovement,
  };
}

export function ProfessorPracticeCheckpoint({
  checkpoint,
  referenceContext,
  onContinue,
  onSpeakClarification,
  disabled,
}: {
  checkpoint: NarrationCheckpoint;
  referenceContext: string;
  onContinue: () => void;
  onSpeakClarification?: (text: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);

  const appendTranscript = useCallback((text: string) => {
    setAnswer((prev) => {
      const base = prev.trim();
      return base ? `${base} ${text.trim()}` : text.trim();
    });
  }, []);

  const dictation = useSpeechDictation(appendTranscript);

  const handleMicPress = useCallback(() => {
    if (feedback || disabled || evaluating) return;
    dictation.startListening();
  }, [dictation, feedback, disabled, evaluating]);

  const handleMicRelease = useCallback(() => {
    dictation.stopListening();
  }, [dictation]);

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
        const evaluation = payload.evaluation as {
          masteryScore: number;
          summary: string;
          strengths: string[];
          gaps: string[];
          clarification?: string;
        };
        setFeedback(
          buildPracticeFeedback({
            score: evaluation.masteryScore,
            summary: evaluation.summary,
            strengths: evaluation.strengths,
            gaps: evaluation.gaps,
            clarification: evaluation.clarification,
          }),
        );
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
        const result = payload.result as {
          score: number;
          feedback: string;
          keyPointsMentioned: string[];
          missingPoints: string[];
          clarification?: string;
        };
        setFeedback(
          buildPracticeFeedback({
            score: result.score,
            summary: result.feedback,
            strengths: result.keyPointsMentioned,
            missingPoints: result.missingPoints,
            clarification: result.clarification,
          }),
        );
      }
    } catch {
      setFeedback({
        score: 50,
        summary: "No pude evaluar ahora, pero tu intento cuenta. Revisa mentalmente lo escuchado.",
        strengths: [],
        gaps: [],
        clarification: "",
        needsImprovement: false,
      });
    } finally {
      setEvaluating(false);
    }
  }

  async function handleSpeakClarification() {
    if (!feedback?.clarification || !onSpeakClarification || speaking) return;
    setSpeaking(true);
    try {
      await onSpeakClarification(feedback.clarification);
    } finally {
      setSpeaking(false);
    }
  }

  const displayAnswer =
    dictation.listening && dictation.interimTranscript
      ? `${answer}${answer ? " " : ""}${dictation.interimTranscript}`
      : answer;

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

      {!feedback ? (
        <>
          <div className="professor-practice-checkpoint__compose">
            <textarea
              className="professor-practice-checkpoint__input"
              rows={3}
              placeholder="Escribe o mantén pulsado el micrófono para responder…"
              value={displayAnswer}
              disabled={dictation.listening || disabled}
              onChange={(e) => setAnswer(e.target.value)}
              aria-label="Tu respuesta"
            />
            {dictation.supported ? (
              <button
                type="button"
                className={`professor-practice-checkpoint__mic${dictation.listening ? " is-active" : ""}`}
                disabled={disabled || evaluating}
                aria-label="Mantén pulsado para responder con voz"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleMicPress();
                }}
                onPointerUp={handleMicRelease}
                onPointerCancel={handleMicRelease}
                onPointerLeave={() => {
                  if (dictation.listening) handleMicRelease();
                }}
              >
                {evaluating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Mic size={18} />
                )}
              </button>
            ) : null}
          </div>

          {dictation.listening ? (
            <p className="professor-practice-checkpoint__live" role="status" aria-live="polite">
              Escuchando tu respuesta…
            </p>
          ) : null}

          {dictation.error ? (
            <p className="professor-practice-checkpoint__live is-error">{dictation.error}</p>
          ) : null}
        </>
      ) : null}

      {feedback ? (
        <div
          className={`professor-practice-checkpoint__result${feedback.needsImprovement ? " needs-work" : " is-ok"}`}
        >
          <p className="professor-practice-checkpoint__score">
            Comprensión: <strong>{feedback.score}%</strong>
          </p>
          <p className="professor-practice-checkpoint__feedback">{feedback.summary}</p>

          {feedback.strengths.length > 0 ? (
            <div className="professor-practice-checkpoint__list-block is-ok">
              <p className="professor-practice-checkpoint__list-label">Lo que acertaste</p>
              <ul>
                {feedback.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {feedback.gaps.length > 0 ? (
            <div className="professor-practice-checkpoint__list-block is-gap">
              <p className="professor-practice-checkpoint__list-label">Carencias detectadas</p>
              <ul>
                {feedback.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {feedback.clarification ? (
            <div className="professor-practice-checkpoint__clarification">
              <p className="professor-practice-checkpoint__list-label">El profesor te aclara</p>
              <p>{feedback.clarification}</p>
              {onSpeakClarification ? (
                <button
                  type="button"
                  className="professor-practice-checkpoint__listen"
                  disabled={disabled || speaking}
                  onClick={() => void handleSpeakClarification()}
                >
                  {speaking ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  Escuchar explicación
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="professor-practice-checkpoint__actions">
        {!feedback ? (
          <>
            <button
              type="button"
              className="professor-practice-checkpoint__verify"
              disabled={disabled || evaluating || dictation.listening || answer.trim().length < 4}
              onClick={() => void submitEvaluate()}
            >
              {evaluating ? <Loader2 size={14} className="animate-spin" /> : null}
              Verificar respuesta
            </button>
            <button
              type="button"
              className="professor-practice-checkpoint__skip"
              disabled={disabled || evaluating || dictation.listening}
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
            disabled={disabled || speaking}
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
