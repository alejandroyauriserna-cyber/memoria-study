import type { LearningAnalyticsState } from "@/components/organizers/sections/learning-analytics-panel";
import {
  ANALYTICS_PREFIX,
  GUIDED_STUDY_PREFIX,
  REVIEW_ANALYTICS_PREFIX,
} from "@/lib/study/client-active-study-total";
import type { GuidedStudySession } from "@/types/guided-legal-study";
import type { ReviewAnalyticsState } from "@/lib/study/review-analytics";

/** Incrementar para forzar un reinicio global de horas en todos los dispositivos. */
export const ACTIVE_STUDY_TIME_RESET_VERSION = 1;
const RESET_KEY = "memoria-active-study-time-reset-version";

function resetOrganizerAnalytics(key: string, raw: string) {
  const state = JSON.parse(raw) as LearningAnalyticsState;
  const now = Date.now();
  const next: LearningAnalyticsState = {
    ...state,
    activeStudyMs: 0,
    lastActivityAt: now,
    lastTickAt: now,
  };
  localStorage.setItem(key, JSON.stringify(next));
}

function resetGuidedStudySession(key: string, raw: string) {
  const session = JSON.parse(raw) as GuidedStudySession;
  const now = Date.now();
  const next: GuidedStudySession = {
    ...session,
    activeStudyMs: 0,
    lastActivityAt: now,
    lastTickAt: now,
  };
  localStorage.setItem(key, JSON.stringify(next));
}

function resetReviewAnalytics(key: string, raw: string) {
  const state = JSON.parse(raw) as ReviewAnalyticsState;
  const next: ReviewAnalyticsState = {
    ...state,
    studyMinutes: 0,
    activeStudyMs: 0,
  };
  localStorage.setItem(key, JSON.stringify(next));
}

export function resetClientStudyTimeCaches() {
  if (typeof window === "undefined") return;

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      if (key.startsWith(ANALYTICS_PREFIX)) {
        resetOrganizerAnalytics(key, raw);
      } else if (key.startsWith(GUIDED_STUDY_PREFIX)) {
        resetGuidedStudySession(key, raw);
      } else if (key.startsWith(REVIEW_ANALYTICS_PREFIX)) {
        resetReviewAnalytics(key, raw);
      }
    } catch {
      /* skip invalid entries */
    }
  }
}

export function ensureActiveStudyTimeReset() {
  if (typeof window === "undefined") return false;

  const applied = Number(localStorage.getItem(RESET_KEY) ?? 0);
  if (applied >= ACTIVE_STUDY_TIME_RESET_VERSION) {
    return false;
  }

  resetClientStudyTimeCaches();
  localStorage.setItem(RESET_KEY, String(ACTIVE_STUDY_TIME_RESET_VERSION));
  return true;
}
