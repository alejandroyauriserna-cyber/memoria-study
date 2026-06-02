"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Brain, CheckCircle2, Clock, Target, XCircle } from "lucide-react";

export type LearningAnalyticsState = {
  startedAt: number;
  conceptsStudied: string[];
  questionsCorrect: number;
  questionsWrong: number;
  flashcardMastery: number;
  organizerProgress: number;
};

const STORAGE_PREFIX = "memoria-organizer-analytics:";

function loadState(key: string): LearningAnalyticsState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as LearningAnalyticsState) : null;
  } catch {
    return null;
  }
}

function saveState(key: string, state: LearningAnalyticsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(state));
}

export function useLearningAnalytics(organizerKey: string, flashcardMastery = 0) {
  const [state, setState] = useState<LearningAnalyticsState>(() =>
    loadState(organizerKey) ?? {
      startedAt: Date.now(),
      conceptsStudied: [],
      questionsCorrect: 0,
      questionsWrong: 0,
      flashcardMastery: 0,
      organizerProgress: 0,
    },
  );

  useEffect(() => {
    setState((current) => {
      const next = { ...current, flashcardMastery, organizerProgress: computeProgress(current, flashcardMastery) };
      saveState(organizerKey, next);
      return next;
    });
  }, [flashcardMastery, organizerKey]);

  function recordConcept(label: string) {
    setState((current) => {
      if (current.conceptsStudied.includes(label)) return current;
      const next = {
        ...current,
        conceptsStudied: [...current.conceptsStudied, label],
        organizerProgress: computeProgress(
          { ...current, conceptsStudied: [...current.conceptsStudied, label] },
          flashcardMastery,
        ),
      };
      saveState(organizerKey, next);
      return next;
    });
  }

  function recordAnswer(correct: boolean) {
    setState((current) => {
      const next = {
        ...current,
        questionsCorrect: current.questionsCorrect + (correct ? 1 : 0),
        questionsWrong: current.questionsWrong + (correct ? 0 : 1),
        organizerProgress: computeProgress(current, flashcardMastery),
      };
      saveState(organizerKey, next);
      return next;
    });
  }

  const readingMinutes = useMemo(
    () => Math.max(1, Math.round((Date.now() - state.startedAt) / 60_000)),
    [state.startedAt],
  );

  const mastery = useMemo(() => {
    const total = state.questionsCorrect + state.questionsWrong;
    const examScore = total ? Math.round((state.questionsCorrect / total) * 100) : flashcardMastery;
    return Math.round((examScore * 0.45 + flashcardMastery * 0.35 + state.organizerProgress * 0.2));
  }, [state, flashcardMastery]);

  return { state, readingMinutes, mastery, recordConcept, recordAnswer };
}

function computeProgress(state: LearningAnalyticsState, flashcardMastery: number) {
  const conceptScore = Math.min(100, state.conceptsStudied.length * 12);
  const examTotal = state.questionsCorrect + state.questionsWrong;
  const examScore = examTotal ? (state.questionsCorrect / examTotal) * 100 : 0;
  return Math.round(conceptScore * 0.4 + flashcardMastery * 0.35 + examScore * 0.25);
}

export function LearningAnalyticsPanel({
  mastery,
  conceptsStudied,
  readingMinutes,
  questionsCorrect,
  questionsWrong,
  organizerProgress,
}: {
  mastery: number;
  conceptsStudied: number;
  readingMinutes: number;
  questionsCorrect: number;
  questionsWrong: number;
  organizerProgress: number;
}) {
  const stats = [
    { label: "Dominio estimado", value: `${mastery}%`, icon: Target, accent: true },
    { label: "Conceptos estudiados", value: String(conceptsStudied), icon: Brain },
    { label: "Tiempo de lectura", value: `${readingMinutes} min`, icon: Clock },
    { label: "Preguntas acertadas", value: String(questionsCorrect), icon: CheckCircle2 },
    { label: "Preguntas falladas", value: String(questionsWrong), icon: XCircle },
    { label: "Progreso organizador", value: `${organizerProgress}%`, icon: BarChart3 },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[rgba(16,39,48,0.88)] backdrop-blur-2xl">
      <div className="border-b border-[rgba(0,255,213,0.1)] px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
          <BarChart3 size={14} />
          Analítica de aprendizaje
        </p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-xl border p-3 ${
                stat.accent
                  ? "border-[rgba(0,255,213,0.3)] bg-[rgba(0,255,213,0.08)]"
                  : "border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.4)]"
              }`}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Icon size={12} className="text-[#00FFD5]" />
                {stat.label}
              </p>
              <p className={`mt-1 text-xl font-bold ${stat.accent ? "text-[#00FFD5]" : "text-[#F5F7FA]"}`}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
