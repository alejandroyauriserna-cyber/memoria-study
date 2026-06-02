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
  quizlet = false,
}: {
  flashcards: Flashcard[];
  deckKey?: string;
  embedded?: boolean;
  quizlet?: boolean;
}) {
  const cards = flashcards.filter((card) => card.question || card.answer);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"study" | "exam">("study");
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
        <div className="flex gap-1 rounded-lg border border-[rgba(0,255,213,0.12)] p-0.5">
          {(["study", "exam"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setFlipped(false);
              }}
              className={`rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                mode === item ? "bg-[rgba(0,255,213,0.15)] text-[#00FFD5]" : "text-muted-foreground"
              }`}
            >
              {item === "study" ? "Estudio" : "Examen"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp size={14} className="text-[#00FFD5]" />
          Dominio: <span className="font-semibold text-[#00FFD5]">{overallMastery}%</span>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-[10px]">
        <span className={`rounded-full px-2 py-0.5 ${progress.mastery < 40 ? "bg-red-500/15 text-red-300" : progress.mastery < 70 ? "bg-amber-500/15 text-amber-200" : "bg-[rgba(0,255,213,0.12)] text-[#00FFD5]"}`}>
          {progress.mastery < 40 ? "Difícil" : progress.mastery < 70 ? "Medio" : "Dominado"}
        </span>
        {card.difficulty ? (
          <span className="text-[#00FFD5]/80">{difficultyLabel[card.difficulty]}</span>
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
        className={`relative mx-auto block w-full [perspective:1600px] ${
          quizlet ? "min-h-[min(52vh,420px)]" : "min-h-48"
        }`}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className={`relative w-full [transform-style:preserve-3d] ${quizlet ? "min-h-[min(52vh,420px)]" : "min-h-48"}`}
        >
          <div className="tron-flashcard-front absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-8 py-10 text-center [backface-visibility:hidden]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">Pregunta</p>
            <p className={`mt-4 font-semibold leading-relaxed text-[#F5F7FA] ${quizlet ? "text-2xl md:text-3xl" : "text-lg leading-8"}`}>
              {card.question}
            </p>
            <p className="mt-8 text-xs text-muted-foreground">Toca para voltear</p>
          </div>
          <div className="tron-flashcard-back absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-8 py-10 text-center text-[#07131A] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#07131A]/70">Respuesta</p>
            <p className={`mt-4 font-semibold leading-relaxed ${quizlet ? "text-xl md:text-2xl" : "text-lg leading-8"}`}>
              {card.answer}
            </p>
          </div>
        </motion.div>
      </button>

      {flipped && mode === "study" ? (
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

      {flipped && mode === "exam" ? (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Modo examen: ¿recordaste la respuesta?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => persistRate(0)}
              className="rounded-lg border border-red-400/30 px-2 py-2 text-[11px] text-red-200"
            >
              No la supe
            </button>
            <button
              type="button"
              onClick={() => persistRate(3)}
              className="rounded-lg border border-[rgba(0,255,213,0.35)] px-2 py-2 text-[11px] text-[#00FFD5]"
            >
              La supe
            </button>
          </div>
        </div>
      ) : null}

      <div className={`mt-5 flex items-center justify-between ${quizlet ? "px-2" : ""}`}>
        <p className="text-sm text-muted-foreground">
          {index + 1} / {cards.length}
          {overallMastery > 0 ? ` · ${overallMastery}% dominio global` : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((v) => (v - 1 + cards.length) % cards.length);
            }}
            className={`flex items-center justify-center rounded-xl border border-[rgba(0,255,213,0.2)] text-[#F5F7FA] transition hover:border-[rgba(0,255,213,0.4)] hover:text-[#00FFD5] ${
              quizlet ? "h-11 px-4 text-sm font-semibold" : "h-9 w-9"
            }`}
          >
            <ChevronLeft size={quizlet ? 18 : 16} />
            {quizlet ? <span className="ml-1">Anterior</span> : null}
          </button>
          <button
            type="button"
            onClick={() => {
              setFlipped(false);
              setIndex((v) => (v + 1) % cards.length);
            }}
            className={`flex items-center justify-center rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(0,255,213,0.08)] text-[#00FFD5] transition hover:bg-[rgba(0,255,213,0.15)] ${
              quizlet ? "h-11 px-4 text-sm font-semibold" : "h-9 w-9"
            }`}
          >
            {quizlet ? <span className="mr-1">Siguiente</span> : null}
            <ChevronRight size={quizlet ? 18 : 16} />
          </button>
        </div>
      </div>
    </>
  );

  if (embedded || quizlet) return body;

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
