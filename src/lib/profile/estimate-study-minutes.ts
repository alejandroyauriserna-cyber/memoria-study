import type { ServerLearningStats } from "@/lib/profile/server-learning-stats";

/** Estimación conservadora a partir de actividad real en Supabase. */
export function estimateStudyMinutesFromServer(stats: ServerLearningStats): number {
  return (
    stats.pagesUnderstood * 8 +
    stats.materialsOpened * 5 +
    stats.guidedStudySessions * 12 +
    stats.organizersCreated * 15
  );
}
