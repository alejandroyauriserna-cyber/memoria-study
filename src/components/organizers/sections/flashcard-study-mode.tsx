"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  Link2,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

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

function rateCard(current: CardProgress, knew: boolean): CardProgress {
  const quality = knew ? 3 : 0;
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
    ease = Math.max(1.3, ease + 0.1);
    mastery = Math.min(100, mastery + 25);
  }

  return {
    ease,
    interval,
    repetitions,
    nextReview: Date.now() + interval * 86_400_000,
    mastery,
  };
}

function enrichCard(card: Flashcard) {
  const answer = card.answer ?? "";
  const related = answer
    .split(/[,;.]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 8 && part.length < 80)
    .slice(0, 3);

  return {
    explanation: answer,
    relatedConcepts: related.length ? related : ["Repasa la definición en el organizador visual"],
    example: `Supuesto: aplica este concepto a un caso del material — «${(card.question ?? "").slice(0, 60)}»`,
  };
}

const difficultyLabel = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
} as const;

export function FlashcardStudyMode({
  flashcards,
  deckKey = "default",
  quizlet = false,
}: {
  flashcards: Flashcard[];
  deckKey?: string;
  quizlet?: boolean;
}) {
  const cards = flashcards.filter((card) => card.question || card.answer);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
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
  const enriched = card ? enrichCard(card) : null;

  const overallMastery =
    cards.length > 0
      ? Math.round(
          cards.reduce((sum, _, i) => sum + (progressMap[i]?.mastery ?? 0), 0) / cards.length,
        )
      : 0;

  const persistRate = useCallback(
    (knew: boolean) => {
      const next = {
        ...progressMap,
        [currentIndex]: rateCard(progress, knew),
      };
      setProgressMap(next);
      saveProgress(deckKey, next);
      setRevealed(false);
      setIndex((value) => (value + 1) % cards.length);
    },
    [cards.length, currentIndex, deckKey, progress, progressMap],
  );

  if (!cards.length || !card || !enriched) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
          <BookOpen size={12} />
          Modo estudio · Aprender
        </p>
        <p className="text-xs text-muted-foreground">
          Dominio global: <span className="font-semibold text-accent">{overallMastery}%</span>
        </p>
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span
          className={`rounded-full px-2 py-0.5 font-semibold ${
            progress.mastery < 40
              ? "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300"
              : progress.mastery < 70
                ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
                : "bg-accent-soft text-accent"
          }`}
        >
          {progress.mastery < 40 ? "Por repasar" : progress.mastery < 70 ? "En progreso" : "Dominado"}
        </span>
        {card.difficulty ? (
          <span className="font-medium text-accent/90">{difficultyLabel[card.difficulty]}</span>
        ) : null}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-accent-soft">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00FFD5] to-[#00BFFF]"
          animate={{ width: `${((index + 1) / cards.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`flashcard-premium p-6 md:p-8 ${
            quizlet ? "min-h-[min(48vh,380px)]" : "min-h-56"
          } flex flex-col items-center justify-center text-center`}
        >
          <p className="org-panel-kicker text-[10px] font-semibold uppercase tracking-[0.2em]">Pregunta</p>
          <p
            className={`mt-4 font-semibold leading-relaxed org-panel-title ${
              quizlet ? "text-2xl md:text-3xl" : "text-lg"
            }`}
          >
            {card.question}
          </p>

          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mt-8 rounded-xl bg-accent-soft px-6 py-3 text-sm font-semibold text-accent transition hover:bg-accent/15"
            >
              Mostrar respuesta
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 w-full max-w-xl space-y-4 text-left"
            >
              <div className="org-panel-recommend p-4">
                <p className="org-panel-kicker text-[10px] font-semibold uppercase tracking-wider">Respuesta</p>
                <p className="org-panel-text mt-2 text-sm leading-7">{enriched.explanation}</p>
              </div>
              <div className="org-panel-surface-soft p-4">
                <p className="org-panel-kicker flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                  <Lightbulb size={11} />
                  Explicación ampliada
                </p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{enriched.explanation}</p>
              </div>
              <div className="org-panel-surface-soft p-4">
                <p className="org-panel-kicker flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                  <GraduationCap size={11} />
                  Ejemplo práctico
                </p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{enriched.example}</p>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Link2 size={11} />
                  Conceptos relacionados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {enriched.relatedConcepts.map((rel) => (
                    <span
                      key={rel}
                      className="org-panel-chip px-2 py-1 text-[11px]"
                    >
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {revealed ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => persistRate(false)}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-100 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15"
          >
            <ThumbsDown size={16} />
            Necesito repasarlo
          </button>
          <button
            type="button"
            onClick={() => persistRate(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-accent/35 bg-accent-soft py-3 text-sm font-semibold text-accent transition hover:bg-accent/15"
          >
            <ThumbsUp size={16} />
            Ya lo sabía
          </button>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {index + 1} / {cards.length}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setRevealed(false);
              setIndex((v) => (v - 1 + cards.length) % cards.length);
            }}
            className="org-panel-control h-10 w-auto px-3 text-sm"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              setRevealed(false);
              setIndex((v) => (v + 1) % cards.length);
            }}
            className="flex h-10 items-center gap-1 rounded-xl border border-border px-3 text-sm text-accent hover:bg-accent-soft"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setRevealed(false);
              setIndex(0);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-accent"
            aria-label="Reiniciar"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
