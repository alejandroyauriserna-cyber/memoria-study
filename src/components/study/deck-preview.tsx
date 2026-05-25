"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import type { StudyDeck } from "@/types/study";
import { Button } from "@/components/ui/button";

type Mode = "flashcards" | "quiz";

export function DeckPreview({
  deck,
  mode = "flashcards",
}: {
  deck: StudyDeck;
  mode?: Mode;
}) {
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const card = deck.flashcards?.[cardIndex];

  const score = useMemo(
    () =>
      deck.quiz.reduce(
        (total, question) =>
          total + (answers[question.id] === question.answerIndex ? 1 : 0),
        0,
      ),
    [answers, deck.quiz],
  );

  if (mode === "quiz") {
    return (
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Quiz jurídico
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Puntaje {score}/{deck.quiz.length}
          </h2>
        </div>

        <div className="space-y-4">
          {deck.quiz.map((question) => (
            <div key={question.id} className="rounded-lg border border-border p-4">
              <p className="font-medium">{question.question}</p>
              <div className="mt-3 grid gap-2">
                {question.options.map((option, index) => {
                  const selected = answers[question.id] === index;
                  const correct = question.answerIndex === index;

                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: index,
                        }))
                      }
                      className={`flex min-h-10 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                        selected
                          ? correct
                            ? "border-accent bg-accent/10"
                            : "border-red-400 bg-red-500/10"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <span>{option}</span>
                      {selected && correct ? <Check size={16} /> : null}
                    </button>
                  );
                })}
              </div>
              {answers[question.id] !== undefined ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {question.explanation}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!card) {
    return (
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">No se generaron flashcards.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          El PDF se procesó, pero no se devolvieron tarjetas válidas.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Flashcards
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {cardIndex + 1} de {deck.flashcards.length}
          </h2>
        </div>
        <Button variant="ghost" onClick={() => setFlipped(false)} title="Reiniciar tarjeta">
          <RotateCcw size={16} /> Reiniciar
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="min-h-64 w-full rounded-lg border border-border bg-muted p-6 text-left hover:border-accent"
      >
        <p className="text-sm font-medium text-muted-foreground">
          {flipped ? "Respuesta" : "Pregunta"}
        </p>
        <p className="mt-5 text-2xl font-semibold leading-snug tracking-tight">
          {flipped ? card.back : card.front}
        </p>
        {!flipped ? (
          <p className="mt-6 text-sm text-muted-foreground">Pista: {card.hint}</p>
        ) : null}
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setCardIndex((index) => Math.max(0, index - 1));
            setFlipped(false);
          }}
          disabled={cardIndex === 0}
        >
          Anterior
        </Button>
        <Button
          onClick={() => {
            setCardIndex((index) => Math.min(deck.flashcards.length - 1, index + 1));
            setFlipped(false);
          }}
          disabled={cardIndex === deck.flashcards.length - 1}
        >
          Siguiente
        </Button>
      </div>
    </section>
  );
}
