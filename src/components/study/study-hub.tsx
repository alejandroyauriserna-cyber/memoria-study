"use client";

import { useState } from "react";
import type { StudyDeck } from "@/types/study";
import { DeckPreview } from "@/components/study/deck-preview";
import { DefinitionMatchGame } from "@/components/study/definition-match-game";
import { MatchingPairsGame } from "@/components/study/matching-pairs-game";
import { FillBlankPractice } from "@/components/study/fill-blank-practice";

const tabs = [
  { id: "flashcards", label: "Tarjetas" },
  { id: "definitions", label: "Término ↔ definición" },
  { id: "pairs", label: "Juego de pares" },
  { id: "blanks", label: "Completar espacios" },
  { id: "quiz", label: "Cuestionario" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function StudyHub({ deck }: { deck: StudyDeck }) {
  const [tab, setTab] = useState<TabId>("flashcards");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
              tab === item.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "flashcards" || tab === "quiz" ? (
        <DeckPreview deck={deck} mode={tab} />
      ) : null}

      {tab === "definitions" ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <DefinitionMatchGame cards={deck.definitionCards ?? []} />
        </section>
      ) : null}

      {tab === "pairs" ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <MatchingPairsGame pairs={deck.matchingPairs ?? []} />
        </section>
      ) : null}

      {tab === "blanks" ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <FillBlankPractice items={deck.fillBlanks ?? []} />
        </section>
      ) : null}
    </div>
  );
}
