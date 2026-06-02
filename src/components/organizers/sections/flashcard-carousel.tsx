"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const progress = ((index + 1) / cards.length) * 100;

  const body = (
    <>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00FFD5] to-[#00BFFF] shadow-[0_0_12px_rgba(0,255,213,0.4)]"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="relative mx-auto block min-h-48 w-full [perspective:1400px]"
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="relative min-h-48 w-full [transform-style:preserve-3d]"
        >
          <div className="tron-flashcard-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-6 py-8 text-center [backface-visibility:hidden]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">Pregunta</p>
            <p className="mt-4 text-lg font-semibold leading-8 text-[#F5F7FA]">{card.question}</p>
            <p className="mt-6 text-xs text-muted-foreground">Toca para voltear</p>
          </div>
          <div className="tron-flashcard-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-6 py-8 text-center text-[#07131A] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#07131A]/70">Respuesta</p>
            <p className="mt-4 text-lg font-semibold leading-8">{card.answer}</p>
          </div>
        </motion.div>
      </button>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {index + 1} / {cards.length}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((v) => (v - 1 + cards.length) % cards.length);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] text-[#F5F7FA] transition hover:border-[rgba(0,255,213,0.4)] hover:bg-[rgba(0,255,213,0.08)] hover:text-[#00FFD5]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((v) => (v + 1) % cards.length);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] text-[#F5F7FA] transition hover:border-[rgba(0,255,213,0.4)] hover:bg-[rgba(0,255,213,0.08)] hover:text-[#00FFD5]"
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
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25 }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </OrganizerFloatPanel>
  );
}
