"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Mic,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  StructuredQuestionCard,
  TestQuestionCard,
} from "@/components/guided-study/exam-mode-panel";
import type { PageProfessorAnalysis, ProfessorConceptCard } from "@/types/guided-legal-study";

type PracticeMode = "flashcards" | "test" | "oral";

function ConceptFlashcardDrill({ cards }: { cards: ProfessorConceptCard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) return null;

  const card = cards[index]!;
  const total = cards.length;

  function goNext() {
    setFlipped(false);
    setIndex((current) => (current + 1) % total);
  }

  function goPrev() {
    setFlipped(false);
    setIndex((current) => (current - 1 + total) % total);
  }

  return (
    <div className="gs-wait-flashcard">
      <div className="gs-wait-flashcard-meta">
        <span>
          Tarjeta {index + 1} / {total}
        </span>
        <button type="button" onClick={() => setFlipped((v) => !v)} className="gs-wait-flashcard-flip">
          <RotateCcw size={12} />
          {flipped ? "Ver concepto" : "Ver explicación"}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className={`gs-wait-flashcard-card ${flipped ? "is-flipped" : ""}`}
      >
        {!flipped ? (
          <>
            <p className="gs-wait-flashcard-label">Concepto</p>
            <p className="gs-wait-flashcard-front">{card.concept}</p>
            <p className="gs-wait-flashcard-hint">Toca para revelar la explicación</p>
          </>
        ) : (
          <>
            <p className="gs-wait-flashcard-label">Explicación</p>
            <p className="gs-wait-flashcard-back">{card.explanation}</p>
            {card.examImportance ? (
              <p className="gs-wait-flashcard-exam">{card.examImportance}</p>
            ) : null}
          </>
        )}
      </button>

      <div className="gs-wait-flashcard-nav">
        <button type="button" onClick={goPrev} className="gs-wait-nav-btn" aria-label="Anterior">
          <ChevronLeft size={16} />
        </button>
        <button type="button" onClick={goNext} className="gs-wait-nav-btn" aria-label="Siguiente">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function ComprehensionPrompt({ question }: { question: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="gs-wait-comprehension">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#FF8A00]">
        Autoevaluación
      </p>
      <p className="mt-1 text-sm text-foreground">{question}</p>
      {!revealed ? (
        <button type="button" onClick={() => setRevealed(true)} className="gs-reveal-answer-btn mt-2">
          Respondí en voz alta — continuar
        </button>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Bien. Cuando cargue la nueva página, compara tu respuesta con la explicación del profesor.
        </p>
      )}
    </div>
  );
}

export function WhileLoadingPracticePanel({
  sourcePageNumber,
  targetPageNumber,
  analysis,
}: {
  sourcePageNumber: number;
  targetPageNumber: number;
  analysis: PageProfessorAnalysis;
}) {
  const cards = analysis.conceptCards.filter((c) => c.concept.trim() && c.explanation.trim());
  const hasFlashcards = cards.length > 0;
  const hasTest = analysis.examMode.test.length > 0;
  const hasOral = analysis.examMode.oral.length > 0;

  const defaultMode = useMemo<PracticeMode>(() => {
    if (hasFlashcards) return "flashcards";
    if (hasTest) return "test";
    if (hasOral) return "oral";
    return "flashcards";
  }, [hasFlashcards, hasTest, hasOral]);

  const [mode, setMode] = useState<PracticeMode>(defaultMode);

  const modes = [
    hasFlashcards ? ({ id: "flashcards" as const, label: "Tarjetas", icon: Layers3 }) : null,
    hasTest ? ({ id: "test" as const, label: "Test", icon: BookOpen }) : null,
    hasOral ? ({ id: "oral" as const, label: "Oral", icon: Mic }) : null,
  ].filter(Boolean);

  return (
    <section className="gs-wait-practice" aria-label="Repaso mientras carga el profesor IA">
      <div className="gs-wait-practice-head">
        <Sparkles size={16} className="text-accent" />
        <div>
          <p className="text-xs font-semibold text-foreground">
            Repasa la página {sourcePageNumber} mientras prepara la {targetPageNumber}
          </p>
          <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
            Aprovecha la espera con estudio activo — la explicación nueva llegará en un momento.
          </p>
        </div>
      </div>

      {modes.length > 1 ? (
        <div className="gs-wait-practice-tabs" role="tablist">
          {modes.map((tab) => {
            if (!tab) return null;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={`gs-wait-practice-tab ${mode === tab.id ? "is-active" : ""}`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="gs-wait-practice-body">
        {mode === "flashcards" && hasFlashcards ? (
          <ConceptFlashcardDrill cards={cards} />
        ) : null}

        {mode === "test" && hasTest ? (
          <div className="space-y-3">
            {analysis.examMode.test.slice(0, 2).map((item, index) => (
              <TestQuestionCard key={index} item={item} index={index} />
            ))}
          </div>
        ) : null}

        {mode === "oral" && hasOral ? (
          <div className="space-y-2">
            {analysis.examMode.oral.slice(0, 2).map((item, index) => (
              <StructuredQuestionCard key={index} item={item} index={index} accent="#FF8A00" />
            ))}
          </div>
        ) : null}

        {analysis.comprehensionQuestion ? (
          <ComprehensionPrompt question={analysis.comprehensionQuestion} />
        ) : null}

        {analysis.examMode.memorableConcepts.length ? (
          <div className="gs-wait-memorable">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Frases para memorizar
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {analysis.examMode.memorableConcepts.slice(0, 4).map((item, index) => (
                <span key={index} className="gs-memorable-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
