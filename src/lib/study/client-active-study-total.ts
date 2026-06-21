import type { LearningAnalyticsState } from "@/components/organizers/sections/learning-analytics-panel";
import { readingMinutesFromActiveMs } from "@/lib/study/active-study-time";
import type { GuidedStudySession } from "@/types/guided-legal-study";
import type { ReviewAnalyticsState } from "@/lib/study/review-analytics";

export const ANALYTICS_PREFIX = "memoria-organizer-analytics:";
export const GUIDED_STUDY_PREFIX = "memoria-guided-legal-study:";
export const REVIEW_ANALYTICS_PREFIX = "memoria-review-analytics:";

export function sumClientActiveStudyMilliseconds(): number {
  if (typeof window === "undefined") return 0;

  let totalMs = 0;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      if (key.startsWith(ANALYTICS_PREFIX)) {
        const state = JSON.parse(raw) as LearningAnalyticsState;
        if (typeof state.activeStudyMs === "number") {
          totalMs += Math.max(0, state.activeStudyMs);
        }
        continue;
      }

      if (key.startsWith(GUIDED_STUDY_PREFIX)) {
        const session = JSON.parse(raw) as GuidedStudySession;
        if (typeof session.activeStudyMs === "number") {
          totalMs += Math.max(0, session.activeStudyMs);
        }
        continue;
      }

      if (key.startsWith(REVIEW_ANALYTICS_PREFIX)) {
        const state = JSON.parse(raw) as ReviewAnalyticsState;
        if (typeof state.activeStudyMs === "number") {
          totalMs += Math.max(0, state.activeStudyMs);
        } else if (typeof state.studyMinutes === "number") {
          totalMs += Math.max(0, state.studyMinutes) * 60_000;
        }
      }
    } catch {
      /* skip invalid entries */
    }
  }

  return totalMs;
}

export function sumClientActiveStudyMinutes(): number {
  return readingMinutesFromActiveMs(sumClientActiveStudyMilliseconds());
}
