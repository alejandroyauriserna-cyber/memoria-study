"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  RotateCcw,
  Scale,
  X,
  Zap,
} from "lucide-react";
import { recordMicroActivity } from "@/lib/micro-study/record-activity";
import type { MicroSessionPack } from "@/types/micro-study";
import "@/components/micro-study/micro-study-mobile.css";

type StepId = "intro" | "concepts" | "flashcards" | "quiz" | "done";

const STEPS: StepId[] = ["intro", "concepts", "flashcards", "quiz", "done"];

export function MicroSessionWorkspace() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const startStep = searchParams.get("step");

  const [session, setSession] = useState<MicroSessionPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  const step = STEPS[stepIndex] ?? "intro";
  const isConceptOnly = startStep === "concept";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (focus) params.set("focus", focus);
        if (startStep === "concept") params.set("mode", "daily-concept");
        const qs = params.toString() ? `?${params.toString()}` : "";
        const res = await fetch(`/api/micro-study/session${qs}`);
        const data = (await res.json()) as { session?: MicroSessionPack };
        if (!cancelled && data.session) setSession(data.session);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [focus]);

  useEffect(() => {
    if (startStep === "concept") setStepIndex(STEPS.indexOf("concepts"));
  }, [startStep]);

  const progressPct = useMemo(
    () => Math.round(((stepIndex + 1) / STEPS.length) * 100),
    [stepIndex],
  );

  const goNext = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    setFlashFlipped(false);
    setQuizAnswer(null);
  }, []);

  const goPrev = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setFlashFlipped(false);
    setQuizAnswer(null);
  }, []);

  const completeSession = useCallback(async () => {
    await Promise.all([
      recordMicroActivity("micro_session_completed", { sessionId: session?.id }),
      recordMicroActivity("daily_active"),
    ]);
    setStepIndex(STEPS.indexOf("done"));
  }, [session?.id]);

  if (loading) {
    return (
      <div className="ms-session ms-session--loading">
        <p>Preparando tu sesión…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="ms-session ms-session--error">
        <p>No se pudo cargar la sesión.</p>
        <Link href="/" className="ms-session__btn">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const concept = session.concepts[conceptIndex];
  const flashcard = session.flashcards[flashIndex];

  return (
    <div className="ms-session">
      <header className="ms-session__header">
        <Link href="/" className="ms-session__close" aria-label="Cerrar">
          <X size={20} />
        </Link>
        <div className="ms-session__progress-wrap">
          <div className="ms-session__progress-bar">
            <div className="ms-session__progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="ms-session__progress-label">{progressPct}%</span>
        </div>
      </header>

      <main className="ms-session__main">
        {step === "intro" && !isConceptOnly ? (
          <section className="ms-session__intro">
            <span className="ms-session__intro-icon">
              <Zap size={28} />
            </span>
            <h1>{session.title}</h1>
            <p>3 conceptos · 2 flashcards · 1 pregunta rápida</p>
            <p className="ms-session__eta">Duración estimada: {session.estimatedMinutes} min</p>
            <button type="button" onClick={goNext} className="ms-session__btn-primary">
              Comenzar
              <ArrowRight size={18} />
            </button>
          </section>
        ) : null}

        {step === "concepts" && concept ? (
          <section className="ms-session__step">
            <p className="ms-session__step-label">
              <Scale size={14} />
              {isConceptOnly
                ? "Concepto del día"
                : `Concepto ${conceptIndex + 1} / ${session.concepts.length}`}
            </p>
            <h2>{concept.concept}</h2>
            <p className="ms-session__body">{concept.explanation}</p>
            {concept.example ? (
              <p className="ms-session__example">
                <strong>Ejemplo:</strong> {concept.example}
              </p>
            ) : null}
            <div className="ms-session__nav-row">
              {!isConceptOnly && conceptIndex < session.concepts.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    void recordMicroActivity("concept_reviewed", { conceptId: concept.id });
                    setConceptIndex((i) => i + 1);
                  }}
                  className="ms-session__btn-primary"
                >
                  Siguiente concepto
                </button>
              ) : !isConceptOnly ? (
                <button
                  type="button"
                  onClick={() => {
                    void recordMicroActivity("concept_reviewed", { conceptId: concept.id });
                    goNext();
                  }}
                  className="ms-session__btn-primary"
                >
                  Continuar
                </button>
              ) : (
                <Link
                  href="/"
                  className="ms-session__btn-primary"
                  onClick={() => {
                    void recordMicroActivity("concept_reviewed", { conceptId: concept.id });
                    void recordMicroActivity("daily_active");
                  }}
                >
                  Listo
                </Link>
              )}
            </div>
          </section>
        ) : null}

        {step === "flashcards" && flashcard ? (
          <section className="ms-session__step">
            <p className="ms-session__step-label">
              Flashcard {flashIndex + 1} / {session.flashcards.length}
            </p>
            <button
              type="button"
              onClick={() => setFlashFlipped((v) => !v)}
              className={`ms-session__flashcard ${flashFlipped ? "is-flipped" : ""}`}
            >
              {!flashFlipped ? (
                <>
                  <span>Pregunta</span>
                  <strong>{flashcard.front}</strong>
                  <em>Toca para revelar</em>
                </>
              ) : (
                <>
                  <span>Respuesta</span>
                  <strong>{flashcard.back}</strong>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFlashFlipped((v) => !v)}
              className="ms-session__flip-btn"
            >
              <RotateCcw size={14} />
              {flashFlipped ? "Ver pregunta" : "Ver respuesta"}
            </button>
            <div className="ms-session__nav-row">
              {flashIndex < session.flashcards.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setFlashIndex((i) => i + 1);
                    setFlashFlipped(false);
                  }}
                  className="ms-session__btn-primary"
                >
                  Siguiente
                </button>
              ) : (
                <button type="button" onClick={goNext} className="ms-session__btn-primary">
                  Continuar
                </button>
              )}
            </div>
          </section>
        ) : null}

        {step === "quiz" ? (
          <section className="ms-session__step">
            {session.quiz ? (
              <>
                <p className="ms-session__step-label">Pregunta rápida</p>
                <h2>{session.quiz.question}</h2>
                <div className="ms-session__options">
                  {session.quiz.options.map((opt, i) => {
                    const selected = quizAnswer === i;
                    const correct = quizAnswer !== null && i === session.quiz!.answerIndex;
                    const wrong = quizAnswer !== null && selected && !correct;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={quizAnswer !== null}
                        onClick={() => setQuizAnswer(i)}
                        className={`ms-session__option ${correct ? "is-correct" : ""} ${wrong ? "is-wrong" : ""}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizAnswer !== null ? (
                  <>
                    <p className="ms-session__quiz-exp">{session.quiz.explanation}</p>
                    <button
                      type="button"
                      onClick={() => void completeSession()}
                      className="ms-session__btn-primary"
                    >
                      <CheckCircle2 size={18} />
                      Completar sesión
                    </button>
                  </>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={() => void completeSession()}
                className="ms-session__btn-primary"
              >
                Completar sesión
              </button>
            )}
          </section>
        ) : null}

        {step === "done" ? (
          <section className="ms-session__done">
            <CheckCircle2 size={48} className="text-accent" />
            <h1>Sesión completada</h1>
            <p>Avanzaste en tu formación jurídica en menos de 5 minutos.</p>
            <Link href="/" className="ms-session__btn-primary">
              Volver al inicio
            </Link>
          </section>
        ) : null}
      </main>

      {step !== "intro" && step !== "done" && !isConceptOnly ? (
        <footer className="ms-session__footer">
          <button type="button" onClick={goPrev} className="ms-session__footer-back">
            Atrás
          </button>
        </footer>
      ) : null}
    </div>
  );
}
