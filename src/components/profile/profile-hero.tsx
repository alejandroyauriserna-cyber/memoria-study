"use client";

import Link from "next/link";
import { Flame, Bookmark, Clock, GraduationCap } from "lucide-react";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { formatStudyHours, type AggregatedLearningStats } from "@/lib/profile/aggregate-learning-stats";
import { PROFILE_THEMES, type ProfileTheme } from "@/lib/profile/study-preferences-storage";

type StudyLevel = {
  level: string;
  points: number;
  progress: number;
  nextLevel: string | null;
};

type Props = {
  fullName: string;
  currentCycleLabel: string | null;
  stats: AggregatedLearningStats | null;
  favoritesCount: number;
  level: StudyLevel | null;
  theme: (typeof PROFILE_THEMES)[ProfileTheme];
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileHero({
  fullName,
  currentCycleLabel,
  stats,
  favoritesCount,
  level,
  theme,
}: Props) {
  const initials = getInitials(fullName) || "MS";

  const heroStats = [
    {
      label: "Racha de estudio",
      value: stats ? `${stats.studyStreakDays} días` : "—",
      icon: Flame,
      href: null as string | null,
    },
    {
      label: "Horas estudiadas",
      value: stats ? formatStudyHours(stats.studyMinutes) : "—",
      icon: Clock,
      href: null,
    },
    {
      label: "Materiales guardados",
      value: String(favoritesCount),
      icon: Bookmark,
      href: "/favorites",
    },
    {
      label: "Progreso académico",
      value: level ? `${level.progress}%` : "—",
      icon: GraduationCap,
      href: null,
    },
  ];

  return (
    <section
      className="profile-hero"
      style={{ borderColor: `${theme.accent}22` }}
    >
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <div
          className="profile-avatar flex items-center justify-center text-3xl font-black tracking-tight text-white"
          style={{
            background: `linear-gradient(145deg, ${theme.accent}, rgba(0,153,255,0.85))`,
          }}
          aria-hidden
        >
          {initials}
        </div>

        <h1 className="profile-name mt-6">{fullName}</h1>
        <p className="profile-career">
          {UNT_DERECHO.career} · UNT
          {currentCycleLabel ? ` · ${currentCycleLabel}` : ""}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {level ? (
            <span className="profile-badge">
              {level.level} · {level.points} pts
            </span>
          ) : null}
          {stats?.reputationPoints ? (
            <span className="profile-badge">{stats.reputationPoints} reputación</span>
          ) : null}
        </div>

        <div className="profile-stats w-full">
          {heroStats.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <Icon size={16} className="mx-auto mb-2 text-accent opacity-80" />
                <p className="profile-stat-value">{item.value}</p>
                <p className="profile-stat-label">{item.label}</p>
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="profile-stat profile-stat--link"
                  aria-label={`${item.label}: ${item.value}. Ir a favoritos`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <article key={item.label} className="profile-stat">
                {content}
              </article>
            );
          })}
        </div>

        {level ? (
          <div className="profile-hero-progress mt-8 w-full max-w-lg">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="profile-hero-progress-label">Nivel académico</span>
              <span className="profile-hero-progress-value">{level.progress}%</span>
            </div>
            <div className="profile-progress-track h-2.5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${level.progress}%`,
                  background: `linear-gradient(90deg, ${theme.accent}, rgba(0,153,255,0.9))`,
                }}
              />
            </div>
            {level.nextLevel ? (
              <p className="mt-2 text-xs text-muted-foreground">Siguiente meta: {level.nextLevel}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
