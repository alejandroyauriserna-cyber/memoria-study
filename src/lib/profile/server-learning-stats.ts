import { createAdminClient } from "@/lib/supabase/admin";

export type ServerLearningStats = {
  guidedStudySessions: number;
  pagesUnderstood: number;
  materialsOpened: number;
  decksSaved: number;
  organizersCreated: number;
  studyStreakDays: number;
  reputationPoints: number;
  weeklyPagesUnderstood: number;
  weeklyMaterialsOpened: number;
  weeklyOrganizers: number;
  activeStudyMs: number;
};

function distinctStreakDays(dates: string[]): number {
  if (!dates.length) return 0;

  const daySet = new Set(
    dates.map((iso) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );

  let streak = 0;
  const today = new Date();
  for (let offset = 0; offset < 60; offset += 1) {
    const check = new Date(today);
    check.setDate(today.getDate() - offset);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (daySet.has(key)) {
      streak += 1;
    } else if (offset > 0) {
      break;
    }
  }
  return streak;
}

function isWithinDays(iso: string, days: number) {
  const ms = Date.now() - new Date(iso).getTime();
  return ms >= 0 && ms <= days * 24 * 60 * 60 * 1000;
}

const EMPTY_STATS: ServerLearningStats = {
  guidedStudySessions: 0,
  pagesUnderstood: 0,
  materialsOpened: 0,
  decksSaved: 0,
  organizersCreated: 0,
  studyStreakDays: 0,
  reputationPoints: 0,
  weeklyPagesUnderstood: 0,
  weeklyMaterialsOpened: 0,
  weeklyOrganizers: 0,
  activeStudyMs: 0,
};

export async function fetchServerLearningStats(
  userId: string,
): Promise<ServerLearningStats> {
  try {
  const admin = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: guidedSessions },
    { count: materialsOpened },
    { count: decksSaved },
    { count: organizersCreated },
    { data: profileRow },
    { data: recentHistory },
    { data: recentOrganizers },
  ] = await Promise.all([
    admin
      .from("guided_study_sessions")
      .select("understood_pages,last_updated")
      .eq("user_id", userId),
    admin
      .from("material_study_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    admin.from("decks").select("*", { count: "exact", head: true }).eq("user_id", userId),
    admin
      .from("organizers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    admin
      .from("user_profiles")
      .select("reputation_points,active_study_ms")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("material_study_history")
      .select("opened_at")
      .eq("user_id", userId)
      .gte("opened_at", weekAgo),
    admin
      .from("organizers")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", weekAgo),
  ]);

  const sessions = guidedSessions ?? [];
  const pagesUnderstood = sessions.reduce(
    (sum, row) => sum + (row.understood_pages?.length ?? 0),
    0,
  );

  const weeklyPagesUnderstood = sessions
    .filter((row) => row.last_updated && isWithinDays(row.last_updated, 7))
    .reduce((sum, row) => sum + (row.understood_pages?.length ?? 0), 0);

  const activityDates = [
    ...sessions.map((row) => row.last_updated).filter(Boolean),
    ...(recentHistory ?? []).map((row) => row.opened_at).filter(Boolean),
  ] as string[];

  return {
    guidedStudySessions: sessions.length,
    pagesUnderstood,
    materialsOpened: materialsOpened ?? 0,
    decksSaved: decksSaved ?? 0,
    organizersCreated: organizersCreated ?? 0,
    studyStreakDays: distinctStreakDays(activityDates),
    reputationPoints: profileRow?.reputation_points ?? 0,
    activeStudyMs: Number(profileRow?.active_study_ms ?? 0),
    weeklyPagesUnderstood,
    weeklyMaterialsOpened: recentHistory?.length ?? 0,
    weeklyOrganizers: recentOrganizers?.length ?? 0,
  };
  } catch {
    return EMPTY_STATS;
  }
}
