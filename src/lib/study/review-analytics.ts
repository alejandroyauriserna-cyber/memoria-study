export type ReviewTopicMastery = {
  topic: string;
  mastery: number;
  correct: number;
  total: number;
};

export type ReviewAnalyticsState = {
  streak: number;
  lastStudyAt: number;
  studyMinutes: number;
  activeStudyMs?: number;
  topicStats: Record<string, { correct: number; total: number }>;
  sessionHistory: Array<{ at: number; score: number; total: number }>;
};

const PREFIX = "memoria-review-analytics:";

function defaultState(): ReviewAnalyticsState {
  return {
    streak: 0,
    lastStudyAt: 0,
    studyMinutes: 0,
    topicStats: {},
    sessionHistory: [],
  };
}

export function loadReviewAnalytics(deckKey: string): ReviewAnalyticsState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(`${PREFIX}${deckKey}`);
    return raw ? { ...defaultState(), ...(JSON.parse(raw) as ReviewAnalyticsState) } : defaultState();
  } catch {
    return defaultState();
  }
}

export function saveReviewAnalytics(deckKey: string, state: ReviewAnalyticsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${PREFIX}${deckKey}`, JSON.stringify(state));
}

function topicFromQuestion(question: string): string {
  const cleaned = question
    .replace(/^(¿|define|explica|qué es|cuál es)\s*/i, "")
    .replace(/\?$/, "")
    .trim();
  if (cleaned.length <= 48) return cleaned;
  const words = cleaned.split(/\s+/).slice(0, 5).join(" ");
  return words.length > 10 ? words : cleaned.slice(0, 48);
}

export function recordReviewAnswer(
  deckKey: string,
  question: string,
  correct: boolean,
): ReviewAnalyticsState {
  const state = loadReviewAnalytics(deckKey);
  const topic = topicFromQuestion(question);
  const prev = state.topicStats[topic] ?? { correct: 0, total: 0 };
  const topicStats = {
    ...state.topicStats,
    [topic]: {
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    },
  };

  const now = Date.now();
  const dayMs = 86_400_000;
  const lastDay = state.lastStudyAt ? Math.floor(state.lastStudyAt / dayMs) : 0;
  const today = Math.floor(now / dayMs);
  let streak = state.streak;
  if (today === lastDay) {
    /* same day */
  } else if (today === lastDay + 1) {
    streak += 1;
  } else if (today > lastDay + 1) {
    streak = 1;
  } else {
    streak = Math.max(1, streak);
  }

  const next: ReviewAnalyticsState = {
    ...state,
    topicStats,
    streak: correct && today !== lastDay ? Math.max(streak, 1) : streak,
    lastStudyAt: now,
    studyMinutes: state.studyMinutes + 1,
  };
  saveReviewAnalytics(deckKey, next);
  return next;
}

export function recordExamSession(
  deckKey: string,
  correct: number,
  total: number,
): ReviewAnalyticsState {
  const state = loadReviewAnalytics(deckKey);
  const next: ReviewAnalyticsState = {
    ...state,
    sessionHistory: [
      { at: Date.now(), score: correct, total },
      ...state.sessionHistory.slice(0, 19),
    ],
  };
  saveReviewAnalytics(deckKey, next);
  return next;
}

export function buildTopicMasteryList(
  keyConcepts: string[],
  topicStats: Record<string, { correct: number; total: number }>,
): ReviewTopicMastery[] {
  const topics = keyConcepts.length
    ? keyConcepts
    : Object.keys(topicStats);

  return topics
    .map((topic) => {
      const stats = topicStats[topic];
      const total = stats?.total ?? 0;
      const correct = stats?.correct ?? 0;
      const mastery = total ? Math.round((correct / total) * 100) : 0;
      return { topic, mastery, correct, total };
    })
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 8);
}

export function weakTopics(masteryList: ReviewTopicMastery[]): ReviewTopicMastery[] {
  return masteryList.filter((t) => t.mastery < 70 && t.total > 0).slice(0, 3);
}

export function buildReviewRecommendations(
  masteryList: ReviewTopicMastery[],
  streak: number,
): string[] {
  const recs: string[] = [];
  const weak = weakTopics(masteryList);

  if (weak.length) {
    recs.push(`Refuerza «${weak[0]!.topic}» con flashcards antes del próximo examen.`);
  }
  if (streak >= 3) {
    recs.push(`Llevas ${streak} días de racha — mantén el ritmo con 15 min de repaso.`);
  } else {
    recs.push("Establece una racha: repasa al menos 5 conceptos hoy.");
  }
  if (masteryList.some((t) => t.mastery >= 80)) {
    recs.push("Tus temas fuertes están listos — prueba el examen IA completo.");
  } else {
    recs.push("Usa el modo estudio de flashcards antes de evaluarte.");
  }

  return recs.slice(0, 3);
}
