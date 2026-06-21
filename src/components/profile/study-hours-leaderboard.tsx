"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Medal, Trophy } from "lucide-react";
import { formatStudyHours } from "@/lib/profile/aggregate-learning-stats";
import { readingMinutesFromActiveMs } from "@/lib/study/active-study-time";
import type { StudyRankingPeriod, StudyRankingResponse } from "@/lib/ranking/study-hours-ranking";

type Props = {
  currentCycleNumber?: number | null;
  currentCycleLabel?: string | null;
  showInStudyRanking: boolean;
  onToggleRanking?: (value: boolean) => void;
  compact?: boolean;
  accent?: string;
};

function rankIcon(rank: number) {
  if (rank === 1) return <Crown size={16} className="text-amber-300" />;
  if (rank === 2) return <Medal size={16} className="text-slate-300" />;
  if (rank === 3) return <Medal size={16} className="text-amber-600" />;
  return <span className="w-4 text-center text-xs font-bold text-muted-foreground">{rank}</span>;
}

function formatMs(ms: number): string {
  return formatStudyHours(readingMinutesFromActiveMs(ms));
}

export function StudyHoursLeaderboard({
  currentCycleNumber,
  currentCycleLabel,
  showInStudyRanking,
  onToggleRanking,
  compact = false,
  accent = "#00FFD5",
}: Props) {
  const [period, setPeriod] = useState<StudyRankingPeriod>("week");
  const [scope, setScope] = useState<"cycle" | "all">(
    currentCycleNumber ? "cycle" : "all",
  );
  const [data, setData] = useState<StudyRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period });
      if (scope === "cycle" && currentCycleNumber) {
        params.set("cycle", String(currentCycleNumber));
      }
      const res = await fetch(`/api/ranking/study-hours?${params.toString()}`);
      const json = (await res.json()) as StudyRankingResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "No se pudo cargar el ranking.");
      setData(json);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al cargar ranking.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, scope, currentCycleNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  const userInList = data?.entries.some((entry) => entry.isCurrentUser) ?? false;

  return (
    <section
      id="ranking"
      className={compact ? "study-ranking study-ranking--compact" : "profile-panel study-ranking"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={compact ? "dash-home__panel-label" : "profile-kicker"}>
            <Trophy size={13} />
            Top horas activas
          </p>
          {!compact ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Solo cuenta tiempo con la pestaña visible e interactuando. Mínimo 30 min para aparecer.
            </p>
          ) : null}
        </div>
        {!compact && onToggleRanking ? (
          <label className="flex cursor-pointer items-center gap-2 text-xs profile-text">
            <input
              type="checkbox"
              checked={showInStudyRanking}
              onChange={(e) => onToggleRanking(e.target.checked)}
              className="rounded border-white/20 bg-transparent"
            />
            Aparecer en ranking
          </label>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="study-ranking__tabs">
          <button
            type="button"
            className={period === "week" ? "is-active" : ""}
            onClick={() => setPeriod("week")}
          >
            Esta semana
          </button>
          <button
            type="button"
            className={period === "total" ? "is-active" : ""}
            onClick={() => setPeriod("total")}
          >
            Total
          </button>
        </div>
        {currentCycleNumber ? (
          <div className="study-ranking__tabs">
            <button
              type="button"
              className={scope === "cycle" ? "is-active" : ""}
              onClick={() => setScope("cycle")}
            >
              {currentCycleLabel ?? `Ciclo ${currentCycleNumber}`}
            </button>
            <button
              type="button"
              className={scope === "all" ? "is-active" : ""}
              onClick={() => setScope("all")}
            >
              Todos
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Cargando ranking…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-300">{error}</p>
      ) : !data?.entries.length ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Aún no hay estudiantes con 30+ min de estudio activo. ¡Sé el primero!
        </p>
      ) : (
        <ol className={`study-ranking__list ${compact ? "mt-3" : "mt-4"}`}>
          {data.entries.map((entry) => (
            <li
              key={entry.userId}
              className={`study-ranking__row ${entry.isCurrentUser ? "is-you" : ""}`}
              style={
                entry.isCurrentUser
                  ? { borderColor: `${accent}44`, boxShadow: `inset 0 0 0 1px ${accent}22` }
                  : undefined
              }
            >
              <span className="study-ranking__rank">{rankIcon(entry.rank)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold profile-text-strong">
                  {entry.displayName}
                  {entry.isCurrentUser ? (
                    <span className="ml-1.5 text-[10px] font-normal text-accent">(tú)</span>
                  ) : null}
                </p>
                {entry.cycleLabel ? (
                  <p className="text-[10px] text-muted-foreground">{entry.cycleLabel}</p>
                ) : null}
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: accent }}>
                {formatMs(entry.activeStudyMs)}
              </span>
            </li>
          ))}
        </ol>
      )}

      {data && !userInList && data.currentUser.rank ? (
        <div className="study-ranking__you mt-3">
          <span className="text-xs text-muted-foreground">Tu posición</span>
          <span className="text-sm font-semibold profile-text-strong">
            #{data.currentUser.rank} · {formatMs(data.currentUser.activeStudyMs)}
          </span>
        </div>
      ) : null}

      {data && !data.currentUser.showInRanking ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Estás oculto del ranking. Activa &quot;Aparecer en ranking&quot; para competir.
        </p>
      ) : null}

      {data && data.currentUser.showInRanking && !data.currentUser.meetsMinimum ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Te faltan {formatMs(Math.max(0, 30 * 60 * 1000 - data.currentUser.activeStudyMs))} para
          entrar al top.
        </p>
      ) : null}

      {compact ? (
        <Link href="/profile#ranking" className="mt-3 inline-flex text-xs font-semibold text-accent">
          Ver ranking completo →
        </Link>
      ) : null}
    </section>
  );
}
