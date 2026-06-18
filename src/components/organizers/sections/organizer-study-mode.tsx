"use client";

import { useMemo, useState } from "react";
import { Layers, Link2 } from "lucide-react";
import { buildOrganizerMatchingPairs } from "@/lib/organizers/build-matching-pairs";
import { FlashcardStudyMode } from "@/components/organizers/sections/flashcard-study-mode";
import { OrganizerMatchingPairsGame } from "@/components/organizers/sections/organizer-matching-pairs-game";
import type { OrganizerFlashcard } from "@/lib/organizers/parse-content";
import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";

type StudyTab = "flashcards" | "pairs";

export function OrganizerStudyMode({
  flashcards,
  deckKey = "default",
  studySources,
  embedded = false,
}: {
  flashcards: OrganizerFlashcard[];
  deckKey?: string;
  studySources: {
    visualSummary?: StoredOrganizerContent["visualSummary"];
    reviewBundle?: StoredOrganizerContent["reviewBundle"];
    flowProcess?: {
      nodes?: Array<{ id?: string; label?: string; explanation?: string | null }>;
    };
  };
  embedded?: boolean;
}) {
  const [tab, setTab] = useState<StudyTab>("flashcards");

  const pairs = useMemo(
    () =>
      buildOrganizerMatchingPairs({
        flashcards,
        visualSummary: studySources.visualSummary,
        reviewBundle: studySources.reviewBundle,
        flowProcess: studySources.flowProcess,
      }),
    [flashcards, studySources],
  );

  const hasFlashcards = flashcards.some((c) => c.question || c.answer);
  const hasPairs = pairs.length >= 2;

  if (!hasFlashcards && !hasPairs) {
    return (
      <p className="org-panel-text-muted text-sm">
        No hay material de estudio disponible en este organizador.
      </p>
    );
  }

  return (
    <div className="org-study-mode" data-embedded={embedded || undefined}>
      <nav className="org-study-mode__tabs" aria-label="Modo de estudio">
        {hasFlashcards ? (
          <button
            type="button"
            className={`org-study-mode__tab${tab === "flashcards" ? " is-active" : ""}`}
            aria-selected={tab === "flashcards"}
            onClick={() => setTab("flashcards")}
          >
            <Layers size={14} aria-hidden />
            Flashcards
          </button>
        ) : null}
        {hasPairs ? (
          <button
            type="button"
            className={`org-study-mode__tab${tab === "pairs" ? " is-active" : ""}`}
            aria-selected={tab === "pairs"}
            onClick={() => setTab("pairs")}
          >
            <Link2 size={14} aria-hidden />
            Pares
            <span className="org-study-mode__tab-count">{pairs.length}</span>
          </button>
        ) : null}
      </nav>

      <div className="org-study-mode__panel">
        {tab === "flashcards" && hasFlashcards ? (
          <FlashcardStudyMode flashcards={flashcards} deckKey={deckKey} quizlet />
        ) : null}
        {tab === "pairs" && hasPairs ? (
          <OrganizerMatchingPairsGame
            pairs={pairs}
            deckKey={deckKey}
            embedded
            onBackToStudy={() => setTab("flashcards")}
            onContinue={() => setTab("flashcards")}
          />
        ) : null}
      </div>
    </div>
  );
}
