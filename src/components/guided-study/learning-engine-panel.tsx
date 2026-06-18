"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Check,
  GraduationCap,
  Loader2,
  Scale,
  Send,
  Sparkles,
} from "lucide-react";
import { narrativePhaseLabel } from "@/lib/guided-study/case-narrative";
import type {
  ActiveLearningBlock,
  FeynmanEvaluation,
  PageLearningStatus,
  PageProfessorAnalysis,
} from "@/types/guided-legal-study";

type LearningEnginePanelProps = {
  analysis: PageProfessorAnalysis;
  pageNumber: number;
  pageStatus: PageLearningStatus;
  referenceContext: string;
  onApplyComplete: (score: number, meta?: { concept?: string }) => void;
  onRetrievalComplete: (
    score: number,
    meta?: { concept?: string; strengths?: string[]; gaps?: string[] },
  ) => void;
  onFeynmanComplete: (
    score: number,
    meta?: { concept?: string; strengths?: string[]; gaps?: string[] },
  ) => void;
  caseNarrativeTitle?: string;
};

function ApplyConceptBlock({
  block,
  done,
  onComplete,
}: {
  block: ActiveLearningBlock["applyConcept"];
  done?: boolean;
  onComplete: (score: number, meta?: { concept?: string }) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [result, setResult] = useState<{ correct: boolean; feedback: string } | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const hasOptions = Boolean(block.options?.length);

  async function submit() {
    if (hasOptions && picked) {
      const correct = picked === block.correctOptionId;
      setResult({
        correct,
        feedback: correct ? block.feedbackCorrect : block.feedbackIncorrect,
      });
      onComplete(correct ? 92 : 48, { concept: block.studiedConcept });
      return;
    }

    if (!freeText.trim()) return;
    setEvaluating(true);
    try {
      const res = await fetch("/api/guided-study/learning/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "apply_concept",
          prompt: block.prompt,
          scenario: block.scenario,
          modelAnswer: block.modelAnswer,
          studentAnswer: freeText.trim(),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error");
      setResult({ correct: payload.result.score >= 65, feedback: payload.result.feedback });
      onComplete(payload.result.score, { concept: block.studiedConcept });
    } catch {
      setResult({
        correct: false,
        feedback: "No pudimos evaluar ahora. Compara con la respuesta modelo.",
      });
      onComplete(40);
    } finally {
      setEvaluating(false);
    }
  }

  if (done && !result) {
    return (
      <div className="gs-le-block gs-le-block--done">
        <p className="gs-le-kicker">
          <Scale size={14} />
          Aplica el concepto
        </p>
        <p className="gs-le-done-label">Caso resuelto en esta página</p>
      </div>
    );
  }

  return (
    <section className="gs-le-block gs-le-block--apply">
      <p className="gs-le-kicker">
        <Scale size={14} />
        Aplica el concepto
      </p>
      <p className="gs-le-studied">
        Acabas de estudiar: <strong>{block.studiedConcept}</strong>
      </p>
      {block.narrativePhase ? (
        <p className="gs-le-narrative-phase">
          Expediente — {narrativePhaseLabel(block.narrativePhase)}
        </p>
      ) : null}
      {block.continuesFrom ? (
        <p className="gs-le-narrative-continues">{block.continuesFrom}</p>
      ) : null}
      <p className="gs-le-scenario">{block.scenario}</p>
      <p className="gs-le-prompt">{block.prompt}</p>

      {hasOptions ? (
        <ul className="gs-le-options">
          {block.options!.map((opt) => {
            const selected = picked === opt.id;
            const showVerdict = Boolean(result);
            const isCorrect = opt.id === block.correctOptionId;
            let className = "gs-le-option";
            if (showVerdict && isCorrect) className += " gs-le-option--correct";
            else if (showVerdict && selected && !isCorrect) className += " gs-le-option--wrong";
            else if (selected) className += " gs-le-option--picked";

            return (
              <li key={opt.id}>
                <button
                  type="button"
                  disabled={Boolean(result)}
                  className={className}
                  onClick={() => setPicked(opt.id)}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <textarea
          className="gs-le-textarea"
          rows={3}
          placeholder="Escribe tu criterio jurídico…"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          disabled={Boolean(result)}
        />
      )}

      {!result ? (
        <button
          type="button"
          className="gs-le-submit"
          disabled={evaluating || (hasOptions ? !picked : freeText.trim().length < 8)}
          onClick={() => void submit()}
        >
          {evaluating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Verificar aplicación
        </button>
      ) : (
        <div className={`gs-le-feedback ${result.correct ? "is-ok" : "is-warn"}`}>
          {result.feedback}
          {!hasOptions ? (
            <p className="mt-2 text-xs text-muted-foreground">
              <strong>Modelo:</strong> {block.modelAnswer}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function RetrievalBlock({
  block,
  done,
  referenceContext,
  conceptLabel,
  onComplete,
}: {
  block: ActiveLearningBlock["retrieval"];
  done?: boolean;
  referenceContext: string;
  conceptLabel?: string;
  onComplete: (
    score: number,
    meta?: { concept?: string; strengths?: string[]; gaps?: string[] },
  ) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submit() {
    if (answer.trim().length < 4) return;
    setEvaluating(true);
    try {
      const res = await fetch("/api/guided-study/learning/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "retrieval",
          question: block.question,
          studentAnswer: answer.trim(),
          referenceContext,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error");
      setFeedback(payload.result.feedback);
      onComplete(payload.result.score, {
        concept: conceptLabel,
        strengths: payload.result.keyPointsMentioned,
        gaps: payload.result.missingPoints,
      });
    } catch {
      setFeedback("Intentaste recordar — bien. Revisa la explicación y compara mentalmente.");
      onComplete(55);
    } finally {
      setEvaluating(false);
    }
  }

  if (done && !feedback) {
    return (
      <div className="gs-le-block gs-le-block--done">
        <p className="gs-le-kicker">
          <Brain size={14} />
          ¿Lo entendiste?
        </p>
        <p className="gs-le-done-label">Recuperación activa completada</p>
      </div>
    );
  }

  return (
    <section className="gs-le-block">
      <p className="gs-le-kicker">
        <Brain size={14} />
        ¿Lo entendiste?
      </p>
      <p className="gs-le-prompt">{block.question}</p>
      {block.hint ? <p className="gs-le-hint">Pista: {block.hint}</p> : null}
      <textarea
        className="gs-le-textarea"
        rows={3}
        placeholder="Responde sin mirar el texto…"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={Boolean(feedback)}
      />
      {!feedback ? (
        <button
          type="button"
          className="gs-le-submit gs-le-submit--secondary"
          disabled={evaluating || answer.trim().length < 4}
          onClick={() => void submit()}
        >
          {evaluating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Verificar comprensión
        </button>
      ) : (
        <div className="gs-le-feedback is-neutral">{feedback}</div>
      )}
    </section>
  );
}

function FeynmanBlock({
  block,
  done,
  referenceContext,
  onComplete,
}: {
  block: ActiveLearningBlock["feynman"];
  done?: boolean;
  referenceContext: string;
  onComplete: (
    score: number,
    meta?: { concept?: string; strengths?: string[]; gaps?: string[] },
  ) => void;
}) {
  const [text, setText] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null);

  async function submit() {
    if (text.trim().length < 20) return;
    setEvaluating(true);
    try {
      const res = await fetch("/api/guided-study/learning/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "feynman",
          concept: block.concept,
          audiencePrompt: block.audiencePrompt,
          studentExplanation: text.trim(),
          referenceContext,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error");
      setEvaluation(payload.evaluation);
      onComplete(payload.evaluation.masteryScore, {
        concept: block.concept,
        strengths: payload.evaluation.strengths,
        gaps: payload.evaluation.gaps,
      });
    } catch {
      onComplete(50);
    } finally {
      setEvaluating(false);
    }
  }

  if (done && !evaluation) {
    return (
      <div className="gs-le-block gs-le-block--done">
        <p className="gs-le-kicker">
          <GraduationCap size={14} />
          Explícamelo
        </p>
        <p className="gs-le-done-label">Explicación propia registrada</p>
      </div>
    );
  }

  return (
    <section className="gs-le-block">
      <p className="gs-le-kicker">
        <GraduationCap size={14} />
        Explícamelo
      </p>
      <p className="gs-le-prompt">{block.audiencePrompt}</p>
      <p className="gs-le-studied">
        Concepto: <strong>{block.concept}</strong>
      </p>
      <textarea
        className="gs-le-textarea"
        rows={4}
        placeholder="Escribe como si enseñaras a un compañero de primer ciclo…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={Boolean(evaluation)}
      />
      {!evaluation ? (
        <button
          type="button"
          className="gs-le-submit gs-le-submit--secondary"
          disabled={evaluating || text.trim().length < 20}
          onClick={() => void submit()}
        >
          {evaluating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Analizar mi explicación
        </button>
      ) : (
        <div className="gs-le-feynman-result">
          <p className="gs-le-mastery-pill">
            Nivel: {evaluation.masteryLevel} · {evaluation.masteryScore}%
          </p>
          {evaluation.strengths.length ? (
            <div>
              <p className="gs-le-eval-label">✓ Qué explicó bien</p>
              <ul className="gs-le-eval-list">
                {evaluation.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {evaluation.gaps.length ? (
            <div>
              <p className="gs-le-eval-label">✗ Qué faltó mencionar</p>
              <ul className="gs-le-eval-list">
                {evaluation.gaps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {evaluation.summary ? <p className="gs-le-feedback is-neutral">{evaluation.summary}</p> : null}
        </div>
      )}
    </section>
  );
}

export function LearningEnginePanel({
  analysis,
  pageNumber,
  pageStatus,
  referenceContext,
  onApplyComplete,
  onRetrievalComplete,
  onFeynmanComplete,
  caseNarrativeTitle,
}: LearningEnginePanelProps) {
  const block = analysis.activeLearning;
  const reference =
    referenceContext ||
    `${analysis.pageFocus}\n${analysis.conceptCards.map((c) => `${c.concept}: ${c.explanation}`).join("\n")}`.slice(
      0,
      6000,
    );

  if (!block) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="gs-learning-engine"
      aria-label={`Práctica activa página ${pageNumber}`}
    >
      <header className="gs-le-head">
        <Sparkles size={16} className="text-accent" />
        <div>
          <p className="gs-le-head-title">Aprendizaje activo</p>
          <p className="gs-le-head-sub">
            {caseNarrativeTitle
              ? `Expediente: ${caseNarrativeTitle}`
              : "Practica mientras estudias — 30 s a 2 min"}
          </p>
        </div>
      </header>

      <ApplyConceptBlock
        block={block.applyConcept}
        done={pageStatus.applyDone}
        onComplete={onApplyComplete}
      />

      <RetrievalBlock
        block={block.retrieval}
        done={pageStatus.retrievalDone}
        referenceContext={reference}
        conceptLabel={block.applyConcept.studiedConcept}
        onComplete={onRetrievalComplete}
      />

      <FeynmanBlock
        block={block.feynman}
        done={pageStatus.feynmanDone}
        referenceContext={reference}
        onComplete={onFeynmanComplete}
      />
    </motion.div>
  );
}
