"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Trophy } from "lucide-react";
import type { StudyRankingPeriod, StudyRankingResponse } from "@/lib/ranking/study-hours-ranking";
import { STUDY_RANKING_MIN_MS } from "@/lib/ranking/study-hours-ranking";
import {
  isBetaJulyChallengeActive,
  isBetaJulyChallengeUpcoming,
} from "@/lib/beta/july-challenge";
import {
  formatMsGap,
  formatRankingHours,
  getStudyLeague,
  progressVsLeader,
  rankMedal,
} from "@/lib/ranking/study-league";
import { ProfileAvatar } from "@/components/profile/profile-avatar";

type Props = {
  currentCycleNumber?: number | null;
  currentCycleLabel?: string | null;
  showInStudyRanking: boolean;
  onToggleRanking?: (value: boolean) => void;
  compact?: boolean;
};

function buildMotivationMessage(data: StudyRankingResponse): string | null {
  const { currentUser } = data;
  if (!currentUser.showInRanking || !currentUser.meetsMinimum) return null;

  if (currentUser.msToNextRival && currentUser.nextRivalName) {
    return `Te faltan ${formatMsGap(currentUser.msToNextRival)} para superar a ${currentUser.nextRivalName}.`;
  }

  if (currentUser.rank && currentUser.rank > 10 && currentUser.msToTop10) {
    return `A ${formatMsGap(currentUser.msToTop10)} del Top 10.`;
  }

  if (currentUser.rank === 1) {
    return "Lideras el ranking. Defiende tu puesto.";
  }

  return null;
}

export function StudyHoursLeaderboard({
  currentCycleNumber,
  currentCycleLabel,
  showInStudyRanking,
  onToggleRanking,
  compact = false,
}: Props) {
  const [period, setPeriod] = useState<StudyRankingPeriod>(() =>
    isBetaJulyChallengeActive() || isBetaJulyChallengeUpcoming() ? "beta" : "week",
  );
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
  const motivation = useMemo(() => (data ? buildMotivationMessage(data) : null), [data]);
  const leaderMs = data?.leaderMs ?? 0;

  return (
    <section
      id="ranking"
      className={`study-ranking${compact ? " study-ranking--compact" : ""}`}
    >
      <header className="study-ranking__header">
        <div>
          <h2 className="study-ranking__title">
            <Trophy size={compact ? 16 : 18} aria-hidden />
            Top horas activas
          </h2>
          {!compact ? (
            <p className="study-ranking__subtitle">
              {period === "beta"
                ? "Reto julio: total = horas reales + bonus IA. El premio S/ 40 solo cuenta horas reales (mín. 5 h)."
                : "Solo cuenta tiempo con la pestaña visible e interactuando. Mínimo 30 min para aparecer."}
            </p>
          ) : null}
        </div>
        {!compact && onToggleRanking ? (
          <label className="study-ranking__opt-in">
            <input
              type="checkbox"
              checked={showInStudyRanking}
              onChange={(e) => onToggleRanking(e.target.checked)}
            />
            Aparecer en ranking
          </label>
        ) : null}
      </header>

      <div className="study-ranking__filters">
        <div className="study-ranking__tabs">
          {isBetaJulyChallengeActive() || isBetaJulyChallengeUpcoming() ? (
            <button
              type="button"
              className={period === "beta" ? "is-active" : ""}
              onClick={() => setPeriod("beta")}
            >
              Reto julio
            </button>
          ) : null}
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
        <p className="study-ranking__empty">Cargando ranking…</p>
      ) : error ? (
        <p className="study-ranking__error">{error}</p>
      ) : !data?.entries.length ? (
        <p className="study-ranking__empty">
          Aún no hay estudiantes con 30+ min de estudio activo. ¡Sé el primero!
        </p>
      ) : (
        <ol className="study-ranking__list">
          {data.entries.map((entry) => {
            const league = getStudyLeague(entry.activeStudyMs);
            const progress = progressVsLeader(entry.activeStudyMs, leaderMs);

            return (
              <li
                key={entry.userId}
                className={`study-ranking__row${entry.isCurrentUser ? " is-you" : ""}`}
              >
                <span
                  className={`study-ranking__rank${entry.avatarUrl ? " study-ranking__rank--avatar" : ""}`}
                  aria-label={`Puesto ${entry.rank}`}
                >
                  {entry.avatarUrl ? (
                    <span className="study-ranking__rank-avatar-wrap">
                      <ProfileAvatar
                        name={entry.displayName}
                        avatarUrl={entry.avatarUrl}
                        size="rank"
                      />
                      <span className="study-ranking__rank-badge">
                        {rankMedal(entry.rank) ?? entry.rank}
                      </span>
                    </span>
                  ) : (
                    (rankMedal(entry.rank) ?? entry.rank)
                  )}
                </span>
                <div className="study-ranking__body">
                  <div className="study-ranking__meta">
                    <p className="study-ranking__name">
                      {entry.displayName}
                      {entry.isCurrentUser ? (
                        <span className="study-ranking__you-tag">✨ Tú</span>
                      ) : null}
                    </p>
                    <span
                      className={`study-ranking__league study-ranking__league--${league.tier}`}
                    >
                      {league.label}
                    </span>
                  </div>
                  {entry.cycleLabel && !compact ? (
                    <p className="study-ranking__cycle">{entry.cycleLabel}</p>
                  ) : null}
                  <div className="study-ranking__hours-row">
                    <span className="study-ranking__hours">
                      {formatRankingHours(entry.activeStudyMs)}
                    </span>
                    {period === "beta" && entry.bonusStudyMs ? (
                      <span className="study-ranking__bonus">
                        incl. {formatRankingHours(entry.bonusStudyMs)} bonus
                      </span>
                    ) : null}
                  </div>
                  {!compact ? (
                    <div
                      className="study-ranking__progress"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${progress}% del líder`}
                    >
                      <div
                        className="study-ranking__progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {data && !userInList && data.currentUser.rank ? (
        <div className="study-ranking__you-card">
          <div className="study-ranking__you-head">
            <span className="study-ranking__you-tag">
              <Sparkles size={12} aria-hidden />
              Tú
            </span>
            <span className="study-ranking__you-rank">Puesto #{data.currentUser.rank}</span>
          </div>
          <p className="study-ranking__you-hours">
            {formatRankingHours(data.currentUser.activeStudyMs)}
          </p>
          {motivation ? <p className="study-ranking__motivation">{motivation}</p> : null}
        </div>
      ) : null}

      {data && userInList && motivation ? (
        <p className="study-ranking__motivation">{motivation}</p>
      ) : null}

      {data && !data.currentUser.showInRanking ? (
        <p className="study-ranking__hint">
          Estás oculto del ranking. Activa &quot;Aparecer en ranking&quot; para competir.
        </p>
      ) : null}

      {data && data.currentUser.showInRanking && !data.currentUser.meetsMinimum ? (
        <p className="study-ranking__hint">
          Te faltan {formatMsGap(Math.max(0, STUDY_RANKING_MIN_MS - data.currentUser.activeStudyMs))}{" "}
          para entrar al top.
        </p>
      ) : null}

      {compact ? (
        <Link href="/profile#ranking" className="study-ranking__more">
          Ver ranking completo →
        </Link>
      ) : null}
    </section>
  );
}
