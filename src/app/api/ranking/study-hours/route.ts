import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { formatRankingDisplayName } from "@/lib/profile/display-name";
import {
  rankingMsColumn,
  STUDY_RANKING_MIN_MS,
  STUDY_RANKING_TOP_LIMIT,
  type StudyRankingEntry,
  type StudyRankingPeriod,
} from "@/lib/ranking/study-hours-ranking";

const querySchema = z.object({
  period: z.enum(["week", "total"]).default("week"),
  cycle: z.coerce.number().int().min(1).max(12).optional(),
});

type ProfileRankingRow = {
  user_id: string;
  full_name: string | null;
  current_cycle_label: string | null;
  current_cycle_number: number | null;
  active_study_ms: number | null;
  active_study_ms_week: number | null;
  show_in_study_ranking: boolean | null;
  avatar_url: string | null;
};

function rowMs(row: ProfileRankingRow, period: StudyRankingPeriod): number {
  const column = rankingMsColumn(period);
  return Number(row[column] ?? 0);
}

function buildEntry(
  row: ProfileRankingRow,
  rank: number,
  period: StudyRankingPeriod,
  currentUserId: string,
): StudyRankingEntry {
  return {
    rank,
    userId: row.user_id,
    displayName: formatRankingDisplayName(row.full_name),
    cycleLabel: row.current_cycle_label,
    activeStudyMs: rowMs(row, period),
    isCurrentUser: row.user_id === currentUserId,
    avatarUrl: row.avatar_url ?? null,
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

    const msColumn = rankingMsColumn(period);
    const admin = createAdminClient();

    let topQuery = admin
      .from("user_profiles")
      .select(
        "user_id, full_name, current_cycle_label, current_cycle_number, active_study_ms, active_study_ms_week, show_in_study_ranking, avatar_url",
      )
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
        admin
          .from("user_profiles")
          .select(
            "user_id, full_name, current_cycle_label, current_cycle_number, active_study_ms, active_study_ms_week, show_in_study_ranking, avatar_url",
          )
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

    if (topError) throw topError;
    if (currentError) throw currentError;

    const entries = (topRows ?? []).map((row, index) =>
      buildEntry(row as ProfileRankingRow, index + 1, period, user.id),
    );

    const currentProfile = (currentRow ?? null) as ProfileRankingRow | null;
    const currentMs = currentProfile ? rowMs(currentProfile, period) : 0;
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

    const leaderMs = entries[0]?.activeStudyMs ?? 0;

    return NextResponse.json({
      period,
      cycleFilter: cycle ?? null,
      entries,
      leaderMs,
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
