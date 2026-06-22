export const STUDY_RANKING_MIN_MS = 30 * 60 * 1000;
export const STUDY_RANKING_TOP_LIMIT = 15;

export type StudyRankingPeriod = "week" | "total";

export type StudyRankingEntry = {
  rank: number;
  userId: string;
  displayName: string;
  cycleLabel: string | null;
  activeStudyMs: number;
  isCurrentUser: boolean;
  avatarUrl: string | null;
};

export type StudyRankingResponse = {
  period: StudyRankingPeriod;
  cycleFilter: number | null;
  entries: StudyRankingEntry[];
  leaderMs: number;
  currentUser: {
    rank: number | null;
    activeStudyMs: number;
    showInRanking: boolean;
    meetsMinimum: boolean;
    nextRivalName: string | null;
    msToNextRival: number | null;
    msToTop10: number | null;
  };
};

export function rankingMsColumn(period: StudyRankingPeriod): "active_study_ms_week" | "active_study_ms" {
  return period === "week" ? "active_study_ms_week" : "active_study_ms";
}
