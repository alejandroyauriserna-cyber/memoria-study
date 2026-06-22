import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { formatRankingDisplayName } from "@/lib/profile/display-name";
import {
  BETA_JULY_PRIZE_AMOUNT_PEN,
  BETA_JULY_PRIZE_MIN_MS,
  isBetaJulyChallengeActive,
} from "@/lib/beta/july-challenge";
import {
  rankingMsColumn,
  STUDY_RANKING_MIN_MS,
  STUDY_RANKING_TOP_LIMIT,
  type StudyRankingEntry,
  type StudyRankingPeriod,
} from "@/lib/ranking/study-hours-ranking";

const querySchema = z.object({
  period: z.enum(["week", "total", "beta"]).default("week"),
  cycle: z.coerce.number().int().min(1).max(12).optional(),
});

type ProfileRankingRow = {
  user_id: string;
  full_name: string | null;
  current_cycle_label: string | null;
  current_cycle_number: number | null;
  active_study_ms: number | null;
  active_study_ms_week: number | null;
  beta_july_active_ms: number | null;
  bonus_study_ms: number | null;
  show_in_study_ranking: boolean | null;
  avatar_url: string | null;
};

const PROFILE_SELECT =
  "user_id, full_name, current_cycle_label, current_cycle_number, active_study_ms, active_study_ms_week, beta_july_active_ms, bonus_study_ms, show_in_study_ranking, avatar_url";

function betaDisplayMs(row: ProfileRankingRow): number {
  return Number(row.beta_july_active_ms ?? 0) + Number(row.bonus_study_ms ?? 0);
}

function betaPrizeMs(row: ProfileRankingRow): number {
  return Number(row.beta_july_active_ms ?? 0);
}

function rowDisplayMs(row: ProfileRankingRow, period: StudyRankingPeriod): number {
  if (period === "beta") return betaDisplayMs(row);
  return Number(row[rankingMsColumn(period)] ?? 0);
}

function buildEntry(
  row: ProfileRankingRow,
  rank: number,
  period: StudyRankingPeriod,
  currentUserId: string,
): StudyRankingEntry {
  const entry: StudyRankingEntry = {
    rank,
    userId: row.user_id,
    displayName: formatRankingDisplayName(row.full_name),
    cycleLabel: row.current_cycle_label,
    activeStudyMs: rowDisplayMs(row, period),
    isCurrentUser: row.user_id === currentUserId,
    avatarUrl: row.avatar_url ?? null,
  };

  if (period === "beta") {
    entry.prizeStudyMs = betaPrizeMs(row);
    entry.bonusStudyMs = Number(row.bonus_study_ms ?? 0);
  }

  return entry;
}

async function fetchBetaRanking(input: {
  admin: ReturnType<typeof createAdminClient>;
  cycle?: number;
  currentUserId: string;
}) {
  let query = input.admin
    .from("user_profiles")
    .select(PROFILE_SELECT)
    .eq("show_in_study_ranking", true);

  if (input.cycle !== undefined) {
    query = query.eq("current_cycle_number", input.cycle);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = ((data ?? []) as ProfileRankingRow[])
    .filter((row) => betaDisplayMs(row) >= STUDY_RANKING_MIN_MS)
    .sort((a, b) => betaDisplayMs(b) - betaDisplayMs(a));

  const entries = rows
    .slice(0, STUDY_RANKING_TOP_LIMIT)
    .map((row, index) => buildEntry(row, index + 1, "beta", input.currentUserId));

  const currentProfile = rows.find((row) => row.user_id === input.currentUserId) ?? null;
  const currentDisplayMs = currentProfile ? betaDisplayMs(currentProfile) : 0;
  const currentPrizeMs = currentProfile ? betaPrizeMs(currentProfile) : 0;
  const currentBonusMs = currentProfile ? Number(currentProfile.bonus_study_ms ?? 0) : 0;

  return {
    entries,
    currentProfile,
    currentDisplayMs,
    currentPrizeMs,
    currentBonusMs,
    allRows: rows,
  };
}

export async function GET(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { period, cycle } = querySchema.parse({
      period: searchParams.get("period") ?? "week",
      cycle: searchParams.get("cycle") ?? undefined,
    });

    const admin = createAdminClient();

    if (period === "beta") {
      const beta = await fetchBetaRanking({
        admin,
        cycle,
        currentUserId: user.id,
      });

      const showInRanking = beta.currentProfile?.show_in_study_ranking ?? true;
      const meetsMinimum = beta.currentDisplayMs >= STUDY_RANKING_MIN_MS;

      let userRank: number | null = null;
      let nextRivalName: string | null = null;
      let msToNextRival: number | null = null;

      if (showInRanking && meetsMinimum) {
        userRank = beta.allRows.findIndex((row) => row.user_id === user.id) + 1;
        const rival = beta.allRows.find((row) => betaDisplayMs(row) > beta.currentDisplayMs);
        if (rival) {
          nextRivalName = formatRankingDisplayName(rival.full_name);
          msToNextRival = Math.max(0, betaDisplayMs(rival) - beta.currentDisplayMs + 1);
        }
      }

      return NextResponse.json({
        period,
        cycleFilter: cycle ?? null,
        entries: beta.entries,
        leaderMs: beta.entries[0]?.activeStudyMs ?? 0,
        betaChallenge: {
          active: isBetaJulyChallengeActive(),
          prizeAmountPen: BETA_JULY_PRIZE_AMOUNT_PEN,
          prizeMinMs: BETA_JULY_PRIZE_MIN_MS,
        },
        currentUser: {
          rank: userRank,
          activeStudyMs: beta.currentDisplayMs,
          prizeStudyMs: beta.currentPrizeMs,
          bonusStudyMs: beta.currentBonusMs,
          prizeEligible: beta.currentPrizeMs >= BETA_JULY_PRIZE_MIN_MS,
          showInRanking,
          meetsMinimum,
          nextRivalName,
          msToNextRival,
          msToTop10: null,
        },
      });
    }

    const msColumn = rankingMsColumn(period);

    let topQuery = admin
      .from("user_profiles")
      .select(PROFILE_SELECT)
      .eq("show_in_study_ranking", true)
      .gte(msColumn, STUDY_RANKING_MIN_MS)
      .order(msColumn, { ascending: false })
      .limit(STUDY_RANKING_TOP_LIMIT);

    if (cycle !== undefined) {
      topQuery = topQuery.eq("current_cycle_number", cycle);
    }

    const [{ data: topRows, error: topError }, { data: currentRow, error: currentError }] =
      await Promise.all([
        topQuery,
        admin.from("user_profiles").select(PROFILE_SELECT).eq("user_id", user.id).maybeSingle(),
      ]);

    if (topError) throw topError;
    if (currentError) throw currentError;

    const entries = (topRows ?? []).map((row, index) =>
      buildEntry(row as ProfileRankingRow, index + 1, period, user.id),
    );

    const currentProfile = (currentRow ?? null) as ProfileRankingRow | null;
    const currentMs = currentProfile ? rowDisplayMs(currentProfile, period) : 0;
    const showInRanking = currentProfile?.show_in_study_ranking ?? true;
    const meetsMinimum = currentMs >= STUDY_RANKING_MIN_MS;

    let userRank: number | null = null;
    let nextRivalName: string | null = null;
    let msToNextRival: number | null = null;
    let msToTop10: number | null = null;

    if (showInRanking && meetsMinimum) {
      let rankQuery = admin
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .eq("show_in_study_ranking", true)
        .gt(msColumn, currentMs);

      if (cycle !== undefined) {
        rankQuery = rankQuery.eq("current_cycle_number", cycle);
      }

      const { count, error: rankError } = await rankQuery;
      if (rankError) throw rankError;
      userRank = (count ?? 0) + 1;

      let rivalQuery = admin
        .from("user_profiles")
        .select(`full_name, ${msColumn}`)
        .eq("show_in_study_ranking", true)
        .gt(msColumn, currentMs)
        .order(msColumn, { ascending: true })
        .limit(1);

      if (cycle !== undefined) {
        rivalQuery = rivalQuery.eq("current_cycle_number", cycle);
      }

      const { data: rivalRow, error: rivalError } = await rivalQuery.maybeSingle();
      if (rivalError) throw rivalError;

      if (rivalRow) {
        const rivalMs = Number((rivalRow as Record<string, unknown>)[msColumn] ?? 0);
        nextRivalName = formatRankingDisplayName(rivalRow.full_name as string | null);
        msToNextRival = Math.max(0, rivalMs - currentMs + 1);
      }

      if (userRank > 10) {
        let top10Query = admin
          .from("user_profiles")
          .select(msColumn)
          .eq("show_in_study_ranking", true)
          .gte(msColumn, STUDY_RANKING_MIN_MS)
          .order(msColumn, { ascending: false })
          .range(9, 9);

        if (cycle !== undefined) {
          top10Query = top10Query.eq("current_cycle_number", cycle);
        }

        const { data: tenthRow, error: tenthError } = await top10Query.maybeSingle();
        if (tenthError) throw tenthError;

        if (tenthRow) {
          const tenthMs = Number((tenthRow as Record<string, unknown>)[msColumn] ?? 0);
          msToTop10 = Math.max(0, tenthMs - currentMs + 1);
        }
      }
    }

    return NextResponse.json({
      period,
      cycleFilter: cycle ?? null,
      entries,
      leaderMs: entries[0]?.activeStudyMs ?? 0,
      currentUser: {
        rank: userRank,
        activeStudyMs: currentMs,
        showInRanking,
        meetsMinimum,
        nextRivalName,
        msToNextRival,
        msToTop10,
      },
    });
  } catch (caught) {
    if (caught instanceof z.ZodError) {
      return NextResponse.json({ error: "Parámetros de ranking inválidos." }, { status: 400 });
    }

    console.error("[ranking/study-hours]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo cargar el ranking." },
      { status: 500 },
    );
  }
}
