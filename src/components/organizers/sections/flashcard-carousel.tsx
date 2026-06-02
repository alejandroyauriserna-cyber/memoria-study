"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers, RotateCcw } from "lucide-react";
import { OrganizerSectionShell } from "@/components/organizers/sections/organizer-section-shell";

type Flashcard = { question?: string; answer?: string };

export function FlashcardCarousel({ flashcards }: { flashcards: Flashcard[] }) {
  const cards = flashcards.filter((card) => card.question || card.answer);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) return null;

  const card = cards[index];

  return (
    <OrganizerSectionShell
      title="Flashcards"
      subtitle="Carrusel interactivo con efecto flip"
      icon={<Layers size={18} />}
    >
      <div className="mx-auto max-w-xl">
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="relative mx-auto block min-h-52 w-full max-w-md [perspective:1200px]"
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="relative min-h-52 w-full [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[24px] border border-border bg-card px-6 py-8 text-center shadow-[0_24px_60px_rgba(15,23,42,0.08)] [backface-visibility:hidden]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Pregunta</p>
              <p className="mt-4 text-lg font-semibold leading-8 text-foreground">{card.question}</p>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[24px] border border-accent/30 bg-accent-soft px-6 py-8 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Respuesta</p>
              <p className="mt-4 text-lg font-semibold leading-8 text-foreground">{card.answer}</p>
            </div>
          </motion.div>
        </button>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Tarjeta {index + 1} de {cards.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFlipped(false);
                setIndex((value) => (value - 1 + cards.length) % cards.length);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted"
              aria-label="Anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                setFlipped(false);
                setIndex((value) => (value + 1) % cards.length);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card hover:bg-muted"
              aria-label="Siguiente"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
            >
              <RotateCcw size={14} /> Voltear
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {cards.map((_, dotIndex) => (
            <button
              key={dotIndex}
              type="button"
              onClick={() => {
                setFlipped(false);
                setIndex(dotIndex);
              }}
              className={`h-2 rounded-full transition-all ${
                dotIndex === index ? "w-6 bg-accent" : "w-2 bg-border"
              }`}
              aria-label={`Ir a tarjeta ${dotIndex + 1}`}
            />
          ))}
        </div>
      </div>
    </OrganizerSectionShell>
  );
}
