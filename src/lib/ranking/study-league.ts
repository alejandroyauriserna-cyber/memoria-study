import { readingMinutesFromActiveMs } from "@/lib/study/active-study-time";

export type StudyLeagueTier = "diamond" | "gold" | "silver" | "bronze" | "starter";

export type StudyLeague = {
  label: string;
  tier: StudyLeagueTier;
};

export function getStudyLeague(activeStudyMs: number): StudyLeague {
  const minutes = readingMinutesFromActiveMs(activeStudyMs);

  if (minutes >= 600) return { label: "Liga Diamante", tier: "diamond" };
  if (minutes >= 300) return { label: "Liga Oro", tier: "gold" };
  if (minutes >= 120) return { label: "Liga Plata", tier: "silver" };
  if (minutes >= 30) return { label: "Liga Bronce", tier: "bronze" };
  return { label: "Liga Novato", tier: "starter" };
}

export function formatRankingHours(activeStudyMs: number): string {
  const totalMinutes = activeStudyMs / 60_000;
  if (totalMinutes < 60) return `${Math.max(1, Math.round(totalMinutes))} min`;
  const hours = totalMinutes / 60;
  if (hours < 10) return `${hours.toFixed(1)} h`;
  const wholeHours = Math.floor(hours);
  const mins = Math.round(totalMinutes % 60);
  return mins > 0 ? `${wholeHours}h ${mins}m` : `${wholeHours}h`;
}

export function formatMsGap(ms: number): string {
  if (ms <= 0) return "0 min";
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 10) return `${hours.toFixed(1)} h`;
  return `${Math.floor(hours)}h ${minutes % 60}m`;
}

export function rankMedal(rank: number): string | null {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

export function progressVsLeader(activeStudyMs: number, leaderMs: number): number {
  if (leaderMs <= 0) return 0;
  return Math.min(100, Math.round((activeStudyMs / leaderMs) * 100));
}
