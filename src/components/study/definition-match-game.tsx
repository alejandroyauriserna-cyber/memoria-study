"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import type { DefinitionCard } from "@/types/study";
import { Button } from "@/components/ui/button";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function DefinitionMatchGame({ cards }: { cards: DefinitionCard[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const current = cards[index];

  const options = useMemo(() => {
    if (!current) {
      return [];
    }

    const distractors = shuffle(
      cards.filter((card) => card.id !== current.id).map((card) => card.definition),
    ).slice(0, 3);

    return shuffle([current.definition, ...distractors]);
  }, [cards, current]);

  if (!current) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay tarjetas de definición en este mazo.
      </p>
    );
  }

  const finished = index >= cards.length;
  const isCorrect = picked !== null && options[picked] === current.definition;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          Relaciona el término con su definición · {Math.min(index + 1, cards.length)} /{" "}
          {cards.length}
        </p>
        <p className="text-sm font-semibold">
          Puntaje: {score}/{cards.length}
        </p>
      </div>

      {finished ? (
        <div className="rounded-lg border border-border bg-muted p-6 text-center">
          <p className="text-xl font-semibold">¡Repaso terminado!</p>
          <p className="mt-2 text-muted-foreground">
            Acertaste {score} de {cards.length} definiciones.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              setIndex(0);
              setPicked(null);
              setScore(0);
            }}
          >
            Reiniciar
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-muted p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Término jurídico
            </p>
            <p className="mt-2 text-2xl font-semibold">{current.term}</p>
            <p className="mt-2 text-sm text-muted-foreground">Pista: {current.hint}</p>
          </div>

          <div className="grid gap-2">
            {options.map((option, optionIndex) => {
              const selected = picked === optionIndex;
              const correct = option === current.definition;

              return (
                <button
                  key={option}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => {
                    setPicked(optionIndex);
                    if (correct) {
                      setScore((value) => value + 1);
                    }
                  }}
                  className={`flex min-h-12 items-center justify-between rounded-lg border px-4 py-3 text-left text-sm ${
                    picked === null
                      ? "border-border hover:bg-muted"
                      : selected
                        ? correct
                          ? "border-accent bg-accent/10"
                          : "border-red-400 bg-red-500/10"
                        : correct
                          ? "border-accent/60 bg-accent/5"
                          : "border-border opacity-70"
                  }`}
                >
                  <span>{option}</span>
                  {picked !== null && selected ? (
                    correct ? (
                      <Check size={16} />
                    ) : (
                      <X size={16} />
                    )
                  ) : null}
                </button>
              );
            })}
          </div>

          {picked !== null ? (
            <Button
              onClick={() => {
                setIndex((value) => value + 1);
                setPicked(null);
              }}
            >
              {isCorrect ? "Siguiente término" : "Continuar"}
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
