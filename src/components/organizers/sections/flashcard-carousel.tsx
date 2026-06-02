"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";

type Flashcard = { question?: string; answer?: string };

export function FlashcardCarousel({
  flashcards,
  embedded = false,
}: {
  flashcards: Flashcard[];
  embedded?: boolean;
}) {
  const cards = flashcards.filter((card) => card.question || card.answer);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) return null;

  const card = cards[index];

  const body = (
    <>
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="relative mx-auto block min-h-44 w-full [perspective:1200px]"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative min-h-44 w-full [transform-style:preserve-3d]"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-foreground/5 bg-gradient-to-br from-white/80 to-accent/5 px-5 py-6 text-center [backface-visibility:hidden] dark:from-white/5">
            <p className="text-[10px] font-medium text-accent">Pregunta</p>
            <p className="mt-3 text-base font-semibold leading-7 text-foreground">{card.question}</p>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-emerald-700 px-5 py-6 text-center text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-[10px] font-medium text-white/80">Respuesta</p>
            <p className="mt-3 text-base font-semibold leading-7">{card.answer}</p>
          </div>
        </motion.div>
      </button>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {index + 1} / {cards.length}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((v) => (v - 1 + cards.length) % cards.length);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-foreground/5"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((v) => (v + 1) % cards.length);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-foreground/5"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <OrganizerFloatPanel title="Flashcards" hint="Toca para voltear" icon={<Layers size={17} />} span={6}>
      {body}
    </OrganizerFloatPanel>
  );
}
