"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Layers } from "lucide-react";
import { FlashcardStudyMode } from "@/components/organizers/sections/flashcard-study-mode";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";

type Flashcard = {
  question?: string;
  answer?: string;
  difficulty?: "basico" | "intermedio" | "avanzado";
};

export function FlashcardPremium({
  flashcards,
  deckKey = "default",
  embedded = false,
  quizlet = false,
}: {
  flashcards: Flashcard[];
  deckKey?: string;
  embedded?: boolean;
  quizlet?: boolean;
}) {
  const body = <FlashcardStudyMode flashcards={flashcards} deckKey={deckKey} quizlet={quizlet} />;

  if (embedded || quizlet) return body;

  return (
    <OrganizerFloatPanel
      title="Modo estudio"
      hint="Aprende con flashcards · Anki / Quizlet"
      icon={<Layers size={17} />}
      span={6}
    >
      <AnimatePresence mode="wait">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {body}
        </motion.div>
      </AnimatePresence>
    </OrganizerFloatPanel>
  );
}
