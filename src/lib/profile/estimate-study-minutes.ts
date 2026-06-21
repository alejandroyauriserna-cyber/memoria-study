import type { ServerLearningStats } from "@/lib/profile/server-learning-stats";
import { readingMinutesFromActiveMs } from "@/lib/study/active-study-time";

/** Horas activas sincronizadas en Supabase (tiempo real de estudio). */
export function estimateStudyMinutesFromServer(stats: ServerLearningStats): number {
  return readingMinutesFromActiveMs(stats.activeStudyMs ?? 0);
}
