"use client";

import { useState } from "react";
import type { StudyDeck } from "@/types/study";
import { DeckPreview } from "@/components/study/deck-preview";
import { DefinitionMatchGame } from "@/components/study/definition-match-game";
import { MatchingPairsGame } from "@/components/study/matching-pairs-game";
import { FillBlankPractice } from "@/components/study/fill-blank-practice";
import { FlashcardPremium } from "@/components/organizers/sections/flashcard-premium";

const tabs = [
  { id: "flashcards", label: "Flashcards" },
  { id: "quiz", label: "Cuestionario" },
  { id: "definitions", label: "Término ↔ definición" },
  { id: "pairs", label: "Pares" },
  { id: "blanks", label: "Completar" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function StudyHub({ deck }: { deck: StudyDeck }) {
  const [tab, setTab] = useState<TabId>("flashcards");
  const deckKey = deck.id ?? deck.sourceName;

  return (
    <div className="space-y-4">
      <div className="organizer-glass flex flex-wrap gap-2 rounded-2xl p-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-[rgba(0,255,213,0.15)] text-[#00FFD5]"
                : "text-muted-foreground hover:text-[#F5F7FA]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "flashcards" ? (
        <FlashcardPremium
          flashcards={(deck.flashcards ?? []).map((card) => ({
            question: card.front,
            answer: card.back,
          }))}
          deckKey={deckKey}
        />
      ) : null}

      {tab === "quiz" ? <DeckPreview deck={deck} mode="quiz" /> : null}

      {tab === "definitions" ? (
        <section className="organizer-float-card organizer-glass rounded-[22px] p-5">
          <DefinitionMatchGame cards={deck.definitionCards ?? []} />
        </section>
      ) : null}

      {tab === "pairs" ? (
        <section className="organizer-float-card organizer-glass rounded-[22px] p-5">
          <MatchingPairsGame pairs={deck.matchingPairs ?? []} />
        </section>
      ) : null}

      {tab === "blanks" ? (
        <section className="organizer-float-card organizer-glass rounded-[22px] p-5">
          <FillBlankPractice items={deck.fillBlanks ?? []} />
        </section>
      ) : null}
    </div>
  );
}
