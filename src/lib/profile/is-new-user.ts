import type { ServerLearningStats } from "@/lib/profile/server-learning-stats";

export function isNewUser(stats: ServerLearningStats): boolean {
  return (
    stats.organizersCreated === 0 &&
    stats.pagesUnderstood === 0 &&
    stats.materialsOpened === 0 &&
    stats.guidedStudySessions === 0
  );
}
