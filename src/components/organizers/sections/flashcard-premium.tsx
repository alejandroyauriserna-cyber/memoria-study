"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers, TrendingUp } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";

type Flashcard = {
  question?: string;
  answer?: string;
  difficulty?: "basico" | "intermedio" | "avanzado";
};

type CardProgress = {
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  mastery: number;
};

const STORAGE_PREFIX = "memoria-flashcard-progress:";

function loadProgress(deckKey: string): Record<number, CardProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${deckKey}`);
    return raw ? (JSON.parse(raw) as Record<number, CardProgress>) : {};
  } catch {
    return {};
  }
}

function saveProgress(deckKey: string, progress: Record<number, CardProgress>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${deckKey}`, JSON.stringify(progress));
}

function defaultProgress(): CardProgress {
  return { ease: 2.5, interval: 0, repetitions: 0, nextReview: 0, mastery: 0 };
}

function rateCard(current: CardProgress, quality: 0 | 1 | 2 | 3): CardProgress {
  let { ease, interval, repetitions, mastery } = current;

  if (quality < 2) {
    repetitions = 0;
    interval = 1;
    mastery = Math.max(0, mastery - 15);
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 3;
    else interval = Math.round(interval * ease);
    ease = Math.max(1.3, ease + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)));
    mastery = Math.min(100, mastery + (quality === 3 ? 25 : quality === 2 ? 15 : 8));
  }

  return {
    ease,
    interval,
    repetitions,
    nextReview: Date.now() + interval * 86_400_000,
    mastery,
  };
}

const difficultyLabel = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
} as const;

export function FlashcardPremium({
  flashcards,
  deckKey = "default",
  embedded = false,
}: {
  flashcards: Flashcard[];
  deckKey?: string;
  embedded?: boolean;
}) {
  const cards = flashcards.filter((card) => card.question || card.answer);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<number, CardProgress>>({});

  useEffect(() => {
    setProgressMap(loadProgress(deckKey));
  }, [deckKey]);

  const orderedIndices = useMemo(() => {
    const now = Date.now();
    return cards
      .map((_, cardIndex) => cardIndex)
      .sort((a, b) => {
        const pa = progressMap[a] ?? defaultProgress();
        const pb = progressMap[b] ?? defaultProgress();
        const dueA = pa.nextReview <= now ? 0 : 1;
        const dueB = pb.nextReview <= now ? 0 : 1;
        if (dueA !== dueB) return dueA - dueB;
        return pa.mastery - pb.mastery;
      });
  }, [cards, progressMap]);

  const currentIndex = orderedIndices[index] ?? 0;
  const card = cards[currentIndex];
  const progress = progressMap[currentIndex] ?? defaultProgress();
  const overallMastery =
    cards.length > 0
      ? Math.round(
          cards.reduce((sum, _, i) => sum + (progressMap[i]?.mastery ?? 0), 0) / cards.length,
        )
      : 0;

  const persistRate = useCallback(
    (quality: 0 | 1 | 2 | 3) => {
      const next = {
        ...progressMap,
        [currentIndex]: rateCard(progress, quality),
      };
      setProgressMap(next);
      saveProgress(deckKey, next);
      setFlipped(false);
      setIndex((value) => (value + 1) % cards.length);
    },
    [cards.length, currentIndex, deckKey, progress, progressMap],
  );

  if (!cards.length || !card) return null;

  const body = (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp size={14} className="text-[#00FFD5]" />
          Dominio global: <span className="font-semibold text-[#00FFD5]">{overallMastery}%</span>
        </div>
        {card.difficulty ? (
          <span className="rounded-full border border-[rgba(0,255,213,0.15)] px-2 py-0.5 text-[10px] text-[#00FFD5]">
            {difficultyLabel[card.difficulty]}
          </span>
        ) : null}
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00FFD5] to-[#00BFFF]"
          animate={{ width: `${progress.mastery}%` }}
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

      {flipped ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Otra vez", quality: 0 as const },
            { label: "Difícil", quality: 1 as const },
            { label: "Bien", quality: 2 as const },
            { label: "Fácil", quality: 3 as const },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => persistRate(item.quality)}
              className="rounded-lg border border-[rgba(0,255,213,0.15)] px-2 py-2 text-[11px] font-semibold text-muted-foreground transition hover:border-[rgba(0,255,213,0.35)] hover:text-[#00FFD5]"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {index + 1} / {cards.length} · Tarjeta {progress.mastery}% dominada
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((v) => (v - 1 + cards.length) % cards.length);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] text-[#F5F7FA] transition hover:text-[#00FFD5]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((v) => (v + 1) % cards.length);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] text-[#F5F7FA] transition hover:text-[#00FFD5]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </>
  );

  if (embedded) return body;

  return (
    <OrganizerFloatPanel title="Flashcards inteligentes" hint="Repetición espaciada · Anki-style" icon={<Layers size={17} />} span={6}>
      <AnimatePresence mode="wait">
        <motion.div key={currentIndex} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
          {body}
        </motion.div>
      </AnimatePresence>
    </OrganizerFloatPanel>
  );
}
