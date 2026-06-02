import type { LearningAnalyticsState } from "@/components/organizers/sections/learning-analytics-panel";

const ANALYTICS_PREFIX = "memoria-organizer-analytics:";
const PATH_PREFIX = "memoria-study-path:";
const FLASHCARD_PREFIX = "memoria-flashcard-progress:";

export type AggregatedLearningStats = {
  studyMinutes: number;
  organizersCreated: number;
  questionsAnswered: number;
  questionsCorrect: number;
  conceptsStudied: number;
  conceptsMastered: number;
  pathNodesCompleted: number;
  flashcardDecksActive: number;
  averageMastery: number;
};

export type CourseStudyCount = {
  courseName: string;
  count: number;
};

function scanAnalytics(): LearningAnalyticsState[] {
  if (typeof window === "undefined") return [];
  const results: LearningAnalyticsState[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(ANALYTICS_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (raw) results.push(JSON.parse(raw) as LearningAnalyticsState);
    } catch {
      /* skip */
    }
  }
  return results;
}

function countPathCompletions(): number {
  if (typeof window === "undefined") return 0;
  let total = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PATH_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const progress = JSON.parse(raw) as Record<string, boolean>;
      total += Object.values(progress).filter(Boolean).length;
    } catch {
      /* skip */
    }
  }
  return total;
}

function aggregateFlashcardMastery(): { decks: number; avgMastery: number; masteredCards: number } {
  if (typeof window === "undefined") return { decks: 0, avgMastery: 0, masteredCards: 0 };
  let decks = 0;
  let masterySum = 0;
  let masteryCount = 0;
  let masteredCards = 0;

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(FLASHCARD_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const progress = JSON.parse(raw) as Record<string, { mastery?: number }>;
      const entries = Object.values(progress);
      if (!entries.length) continue;
      decks += 1;
      for (const card of entries) {
        const m = card.mastery ?? 0;
        masterySum += m;
        masteryCount += 1;
        if (m >= 70) masteredCards += 1;
      }
    } catch {
      /* skip */
    }
  }

  return {
    decks,
    avgMastery: masteryCount ? Math.round(masterySum / masteryCount) : 0,
    masteredCards,
  };
}

export function aggregateClientLearningStats(
  serverOrganizersCount: number,
): AggregatedLearningStats {
  const analytics = scanAnalytics();
  const flashcards = aggregateFlashcardMastery();
  const pathNodes = countPathCompletions();

  let studyMinutes = 0;
  let questionsCorrect = 0;
  let questionsWrong = 0;
  const conceptSet = new Set<string>();

  for (const state of analytics) {
    studyMinutes += Math.max(1, Math.round((Date.now() - state.startedAt) / 60_000));
    questionsCorrect += state.questionsCorrect;
    questionsWrong += state.questionsWrong;
    state.conceptsStudied.forEach((c) => conceptSet.add(c));
  }

  studyMinutes += pathNodes * 8;
  studyMinutes += flashcards.masteredCards * 2;

  const questionsAnswered = questionsCorrect + questionsWrong;
  const conceptsMastered = flashcards.masteredCards + Math.floor(conceptSet.size * 0.4);

  const masteryScores = analytics.map((s) => {
    const total = s.questionsCorrect + s.questionsWrong;
    const exam = total ? (s.questionsCorrect / total) * 100 : 0;
    return Math.round(
      Math.min(100, s.conceptsStudied.length * 12) * 0.4 +
        s.flashcardMastery * 0.35 +
        exam * 0.25,
    );
  });

  const averageMastery =
    masteryScores.length || flashcards.avgMastery
      ? Math.round(
          (masteryScores.reduce((a, b) => a + b, 0) + flashcards.avgMastery) /
            Math.max(1, masteryScores.length + (flashcards.decks ? 1 : 0)),
        )
      : 0;

  return {
    studyMinutes,
    organizersCreated: serverOrganizersCount,
    questionsAnswered,
    questionsCorrect,
    conceptsStudied: conceptSet.size,
    conceptsMastered,
    pathNodesCompleted: pathNodes,
    flashcardDecksActive: flashcards.decks,
    averageMastery,
  };
}

export function formatStudyHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
