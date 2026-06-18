"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Scale, Volume2 } from "lucide-react";
import { useTutorSpeech } from "@/hooks/use-tutor-speech";
import { useTutorVoiceSession } from "@/hooks/use-tutor-voice-session";
import {
  countWords,
  estimateSpeechDurationSec,
} from "@/lib/guided-study/tutor-voice/estimate-duration";
import { PROFESSOR_STYLE_LABELS, loadProfessorStyle } from "@/lib/guided-study/professor-style";
import type { OralDefenseEvaluation, OralExamSeed } from "@/types/guided-legal-study";

type SimPhase = "idle" | "asking" | "listening" | "evaluating" | "done";

function professorIntro(question: string, style: string): string {
  const q = question.trim();
  if (style === "defense_simulation" || style === "demanding") {
    const body = q.replace(/^\¿\s*/, "").replace(/\?+$/, "");
    return `Señor estudiante, ${body}.`;
  }
  return q.endsWith("?") ? q : `${q}?`;
}

export function OralSimulationFlow({
  seed,
  pageNumber,
  referenceContext,
  onComplete,
}: {
  seed: OralExamSeed;
  pageNumber: number;
  referenceContext: string;
  onComplete?: (score: number, evaluation: OralDefenseEvaluation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<SimPhase>("idle");
  const [currentQuestion, setCurrentQuestion] = useState(seed.question);
  const [gradingPoints, setGradingPoints] = useState(seed.gradingPoints);
  const [evaluation, setEvaluation] = useState<OralDefenseEvaluation | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const speech = useTutorSpeech();
  const style = loadProfessorStyle();

  const stateRef = useRef({
    currentQuestion: seed.question,
    gradingPoints: seed.gradingPoints,
    followUpCount: 0,
    referenceContext,
    style,
  });
  stateRef.current = {
    currentQuestion,
    gradingPoints,
    followUpCount,
    referenceContext,
    style,
  };

  const speakProfessor = useCallback(
    async (text: string) => {
      const wc = countWords(text);
      speech.loadScript(text, estimateSpeechDurationSec(wc, speech.rate));
      await speech.play();
    },
    [speech],
  );

  const processStudentAnswer = useCallback(
    async (answer: string): Promise<string> => {
      setPhase("evaluating");
      const s = stateRef.current;
      const res = await fetch("/api/guided-study/learning/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "oral_defense",
          question: s.currentQuestion,
          gradingPoints: s.gradingPoints,
          studentAnswer: answer,
          referenceContext: s.referenceContext,
          professorStyle: PROFESSOR_STYLE_LABELS[s.style].label,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Error de evaluación");

      const result = payload.evaluation as OralDefenseEvaluation;
      setEvaluation(result);

      if (result.followUpQuestion && s.followUpCount < 2 && result.score < 75) {
        setFollowUpCount((c) => c + 1);
        setCurrentQuestion(result.followUpQuestion);
        setGradingPoints(
          result.omittedConcepts.length ? result.omittedConcepts : seed.gradingPoints,
        );
        setPhase("listening");
        const followIntro = professorIntro(result.followUpQuestion, s.style);
        return `${result.feedback} ${followIntro}`;
      }

      setPhase("done");
      onComplete?.(result.score, result);
      return result.feedback;
    },
    [onComplete, seed.gradingPoints],
  );

  const voiceSession = useTutorVoiceSession({
    onStudentTranscript: processStudentAnswer,
    onProfessorReply: speakProfessor,
  });

  const startExam = useCallback(() => {
    setEvaluation(null);
    setFollowUpCount(0);
    setCurrentQuestion(seed.question);
    setGradingPoints(seed.gradingPoints);
    setPhase("asking");
    void speakProfessor(professorIntro(seed.question, style)).then(() => {
      setPhase("listening");
    });
  }, [seed, speakProfessor, style]);

  useEffect(() => {
    if (!open) {
      speech.stop();
      setPhase("idle");
      setEvaluation(null);
      setFollowUpCount(0);
      setCurrentQuestion(seed.question);
      setGradingPoints(seed.gradingPoints);
    }
  }, [open, seed, speech]);

  if (!voiceSession.supported) return null;

  return (
    <section className="gs-oral-sim">
      {!open ? (
        <button type="button" className="gs-oral-sim-trigger" onClick={() => setOpen(true)}>
          <Scale size={16} />
          <span>Simulación Oral</span>
          <span className="gs-oral-sim-badge">Premium</span>
        </button>
      ) : (
        <div className="gs-oral-sim-panel">
          <header className="gs-oral-sim-head">
            <Scale size={15} className="text-accent" />
            <div>
              <p className="gs-oral-sim-title">Examen oral — pág. {pageNumber}</p>
              <p className="gs-oral-sim-sub">{PROFESSOR_STYLE_LABELS[style].label}</p>
            </div>
            <button type="button" className="gs-oral-sim-close" onClick={() => setOpen(false)}>
              ×
            </button>
          </header>

          <p className="gs-oral-sim-question">{currentQuestion}</p>

          {phase === "idle" ? (
            <button type="button" className="gs-oral-sim-start" onClick={startExam}>
              <Volume2 size={18} />
              Iniciar defensa oral
            </button>
          ) : null}

          {(phase === "asking" || speech.isPlaying) && phase !== "listening" ? (
            <p className="gs-oral-sim-status">
              <Volume2 size={14} className="animate-pulse" />
              El profesor está preguntando…
            </p>
          ) : null}

          {phase === "listening" && !speech.isPlaying ? (
            <button
              type="button"
              disabled={voiceSession.isProcessing}
              className={`gs-voice-mic-btn ${voiceSession.isListening ? "is-listening" : ""}`}
              onPointerDown={() => voiceSession.startListening()}
              onPointerUp={() => voiceSession.stopListening()}
              onPointerLeave={() => {
                if (voiceSession.isListening) voiceSession.stopListening();
              }}
            >
              {voiceSession.isProcessing ? (
                <Loader2 size={22} className="animate-spin" />
              ) : voiceSession.isListening ? (
                <MicOff size={22} />
              ) : (
                <Mic size={22} />
              )}
              <span>
                {voiceSession.isProcessing
                  ? "El profesor analiza…"
                  : voiceSession.isListening
                    ? "Escuchando…"
                    : "Mantener para responder"}
              </span>
            </button>
          ) : null}

          {phase === "evaluating" ? (
            <p className="gs-oral-sim-status">
              <Loader2 size={14} className="animate-spin" />
              El profesor analiza tu respuesta…
            </p>
          ) : null}

          {evaluation ? (
            <div className="gs-oral-sim-eval">
              {evaluation.correctConcepts.length ? (
                <div className="gs-oral-sim-eval-block is-ok">
                  <p className="gs-oral-sim-eval-label">✓ Conceptos correctos</p>
                  <ul>
                    {evaluation.correctConcepts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {evaluation.omittedConcepts.length ? (
                <div className="gs-oral-sim-eval-block is-warn">
                  <p className="gs-oral-sim-eval-label">○ Conceptos omitidos</p>
                  <ul>
                    {evaluation.omittedConcepts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {evaluation.errors.length ? (
                <div className="gs-oral-sim-eval-block is-error">
                  <p className="gs-oral-sim-eval-label">✗ Errores detectados</p>
                  <ul>
                    {evaluation.errors.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {evaluation.followUpQuestion && phase === "listening" ? (
                <p className="gs-oral-sim-repregunta">
                  Repregunta: {evaluation.followUpQuestion}
                </p>
              ) : null}
              <p className="gs-oral-sim-score">Puntuación: {evaluation.score}/100</p>
            </div>
          ) : null}

          {phase === "done" ? (
            <button type="button" className="gs-oral-sim-start" onClick={() => setOpen(false)}>
              Cerrar simulación
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
