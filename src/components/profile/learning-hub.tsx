"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Circle,
  FileQuestion,
  GitBranch,
  Layers,
  Map,
  Palette,
  Settings2,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { ProfileHero } from "@/components/profile/profile-hero";
import { ProfileAccountSection } from "@/components/profile/profile-account-section";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileLegalPanel } from "@/components/profile/profile-legal-panel";
import { ProfileOnboarding } from "@/components/profile/profile-onboarding";
import { StudyHoursLeaderboard } from "@/components/profile/study-hours-leaderboard";
import { BetaJulyChallengePanel } from "@/components/profile/beta-july-challenge-panel";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import {
  aggregateClientLearningStats,
  type AggregatedLearningStats,
} from "@/lib/profile/aggregate-learning-stats";
import { syncActiveStudyTimeToServer } from "@/lib/study/sync-active-study-time";
import {
  buildLearningAchievements,
  buildLearningProfile,
  buildRecommendations,
  computeStudyLevel,
} from "@/lib/profile/learning-insights";
import {
  createGoal,
  loadProfileStudySettings,
  saveProfileStudySettings,
  PROFILE_THEMES,
  type AcademicGoal,
  type ProfileStudySettings,
  type ProfileTheme,
  type StudyPreferenceKey,
} from "@/lib/profile/study-preferences-storage";
import type { ServerLearningStats } from "@/lib/profile/server-learning-stats";
import { applyProfileTheme } from "@/lib/theme/app-theme";

type CourseStudyCount = { courseName: string; count: number };

type Props = {
  email?: string | null;
  fullName: string;
  currentCycleLabel: string | null;
  currentCycleNumber?: number | null;
  organizersCount: number;
  serverStats: ServerLearningStats;
  topCourses: CourseStudyCount[];
  favoritesCount?: number;
  initialSettings?: Partial<ProfileStudySettings>;
  showInStudyRanking?: boolean;
  avatarUrl?: string | null;
};

const QUICK_GOAL_TEMPLATES = [
  { label: "Completar 10 páginas en estudio guiado", href: "/library" },
  { label: "Sincronizar normativa en LP Derecho", href: "/fuentes-juridicas" },
  { label: "Crear un organizador del curso", href: "/organizers" },
  { label: "Generar un mazo de flashcards", href: "/upload-material" },
];

const PREFERENCE_META: Record<
  StudyPreferenceKey,
  { label: string; icon: typeof Map; description: string }
> = {
  conceptMaps: {
    label: "Mapas conceptuales",
    icon: Map,
    description: "Exploración visual en red",
  },
  flashcards: {
    label: "Flashcards",
    icon: Layers,
    description: "Repetición espaciada",
  },
  exams: {
    label: "Exámenes IA",
    icon: FileQuestion,
    description: "Simulacros y preguntas",
  },
  practicalCases: {
    label: "Casos prácticos",
    icon: GitBranch,
    description: "Aplicación jurídica",
  },
};

export function LearningHub({
  email,
  fullName,
  currentCycleLabel,
  currentCycleNumber,
  organizersCount,
  serverStats,
  topCourses,
  favoritesCount = 0,
  initialSettings,
  showInStudyRanking: initialShowInRanking = true,
  avatarUrl: initialAvatarUrl = null,
}: Props) {
  const [settings, setSettings] = useState<ProfileStudySettings>(() => ({
    ...loadProfileStudySettings(),
    ...initialSettings,
    preferences: {
      ...loadProfileStudySettings().preferences,
      ...initialSettings?.preferences,
    },
  }));
  const [stats, setStats] = useState<AggregatedLearningStats | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [showInStudyRanking, setShowInStudyRanking] = useState(initialShowInRanking);

  useEffect(() => {
    const refresh = () => {
      void syncActiveStudyTimeToServer().finally(() => {
        setStats(aggregateClientLearningStats(organizersCount, serverStats));
      });
    };
    refresh();

    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(refresh, 60_000);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [organizersCount, serverStats]);

  useEffect(() => {
    saveProfileStudySettings(settings);
    applyProfileTheme(settings.theme);

    const timer = window.setTimeout(() => {
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studySettings: settings }),
      }).catch(() => undefined);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [settings]);

  const theme = PROFILE_THEMES[settings.theme];
  const courseNames = topCourses.map((c) => c.courseName);

  const insight = useMemo(
    () =>
      stats
        ? buildLearningProfile(stats, settings.preferences, courseNames)
        : null,
    [stats, settings.preferences, courseNames],
  );

  const achievements = useMemo(
    () => (stats ? buildLearningAchievements(stats) : []),
    [stats],
  );

  const recommendations = useMemo(
    () =>
      stats ? buildRecommendations(stats, settings.preferences, courseNames) : [],
    [stats, settings.preferences, courseNames],
  );

  const level = useMemo(() => (stats ? computeStudyLevel(stats) : null), [stats]);
  const profileLoading = stats === null;
  const profileProgress = useLoadingProgress(profileLoading, "profile");

  const earnedCount = achievements.filter((a) => a.earned).length;

  function togglePreference(key: StudyPreferenceKey) {
    setSettings((s) => ({
      ...s,
      preferences: { ...s.preferences, [key]: !s.preferences[key] },
    }));
  }

  function setTheme(themeKey: ProfileTheme) {
    setSettings((s) => ({ ...s, theme: themeKey }));
    applyProfileTheme(themeKey);
  }

  function toggleStudyRanking(value: boolean) {
    setShowInStudyRanking(value);
    fetch("/api/profile/study-ranking", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showInStudyRanking: value }),
    }).catch(() => undefined);
  }

  function addGoal() {
    const label = newGoal.trim();
    if (!label) return;
    setSettings((s) => ({ ...s, goals: [...s.goals, createGoal(label)] }));
    setNewGoal("");
  }

  function toggleGoal(goal: AcademicGoal) {
    setSettings((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === goal.id ? { ...g, completed: !g.completed } : g)),
    }));
  }

  function removeGoal(id: string) {
    setSettings((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }

  const isNewUser =
    stats &&
    stats.organizersCreated === 0 &&
    stats.pagesUnderstood === 0 &&
    stats.materialsOpened === 0 &&
    stats.questionsAnswered === 0;

  const statCards = stats
    ? [
        { label: "Páginas comprendidas", value: String(stats.pagesUnderstood), icon: BookOpen },
        { label: "Organizadores", value: String(stats.organizersCreated), icon: Brain },
        { label: "Mazos guardados", value: String(stats.decksSaved), icon: Layers },
        { label: "Preguntas", value: String(stats.questionsAnswered), icon: FileQuestion },
      ]
    : [];

  return (
    <div className="profile-page space-y-6">
      <ProfileHero
        fullName={fullName}
        currentCycleLabel={currentCycleLabel}
        stats={stats}
        favoritesCount={favoritesCount}
        level={level}
        theme={theme}
        avatarUrl={initialAvatarUrl}
      />

      {isNewUser ? <ProfileOnboarding /> : null}

      <BetaJulyChallengePanel />

      {stats ? (
        <section className="profile-panel">
          <p className="profile-kicker">Esta semana</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs profile-text">
            <span className="profile-chip">
              {stats.weeklyPagesUnderstood} páginas comprendidas
            </span>
            <span className="profile-chip">
              {stats.weeklyMaterialsOpened} materiales abiertos
            </span>
            <span className="profile-chip">
              {stats.weeklyOrganizers} organizadores
            </span>
          </div>
        </section>
      ) : null}

      <StudyHoursLeaderboard
        currentCycleNumber={currentCycleNumber}
        currentCycleLabel={currentCycleLabel}
        showInStudyRanking={showInStudyRanking}
        onToggleRanking={toggleStudyRanking}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileAccountSection email={email} fullName={fullName} />
        <ProfileLegalPanel />
      </div>

      {/* Stats */}
      {statCards.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="profile-stat-card"
              >
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon size={12} style={{ color: theme.accent }} />
                  {card.label}
                </p>
                <p className="profile-stat-value mt-2 text-2xl">{card.value}</p>
              </motion.div>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* AI Learning Profile */}
        <section className="profile-panel lg:col-span-3">
          <p className="profile-kicker">
            <Brain size={13} />
            Perfil de aprendizaje IA
          </p>
          {insight ? (
            <div className="mt-4 space-y-4">
              <div className="profile-subcard">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estilo de estudio</p>
                <p className="profile-text-strong mt-1 text-lg font-bold">{insight.studyStyle}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="profile-kicker mb-2">Fortalezas</p>
                  <ul className="space-y-1.5">
                    {insight.strengths.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm profile-text">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-300">Áreas por reforzar</p>
                  <ul className="space-y-1.5">
                    {insight.areasToImprove.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm profile-text">
                        <Target size={14} className="mt-0.5 shrink-0 text-amber-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <LoadingState
              active={profileLoading}
              preset="profile"
              percent={profileProgress.percent}
              message={profileProgress.message}
              stageLabel={profileProgress.stageLabel}
              variant="inline"
              className="mt-4"
            />
          )}
        </section>

        {/* Recommendations */}
        <section className="profile-panel lg:col-span-2">
          <p className="profile-kicker">
            <Zap size={13} />
            Recomendaciones
          </p>
          <div className="mt-4 space-y-2">
            {recommendations.length ? (
              recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={rec.href}
                  className="profile-rec-link group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold profile-text-strong">{rec.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{rec.description}</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-accent">
                      {rec.actionLabel}
                      <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                    </p>
                  </div>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sigue estudiando para recibir recomendaciones personalizadas.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top courses */}
        <section className="profile-panel">
          <p className="profile-kicker">
            <BookOpen size={13} />
            Materias más estudiadas
          </p>
          {topCourses.length ? (
            <div className="mt-4 space-y-3">
              {topCourses.slice(0, 5).map((course, index) => {
                const max = topCourses[0]?.count ?? 1;
                const pct = Math.round((course.count / max) * 100);
                return (
                  <div key={course.courseName}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium profile-text-strong">{course.courseName}</span>
                      <span className="text-xs text-muted-foreground">{course.count} sesiones</span>
                    </div>
                    <div className="profile-progress-track h-1.5">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${PROFILE_THEMES[settings.theme].gradient}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: index * 0.08, duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Abre materiales en la biblioteca para registrar tus materias favoritas.
            </p>
          )}
        </section>

        {/* Goals */}
        <section className="profile-panel">
          <p className="profile-kicker">
            <Target size={13} />
            Objetivos académicos
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUICK_GOAL_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => {
                  setSettings((s) => ({
                    ...s,
                    goals: [...s.goals, createGoal(template.label)],
                  }));
                }}
                className="profile-goal-template"
              >
                + {template.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              placeholder="Ej. Aprobar Civil I con 14"
              className="profile-input"
            />
            <button
              type="button"
              onClick={addGoal}
              className="shrink-0 rounded-xl px-4 text-xs font-semibold text-[#07131A]"
              style={{ background: theme.accent }}
            >
              Añadir
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {settings.goals.length ? (
              settings.goals.map((goal) => {
                const template = QUICK_GOAL_TEMPLATES.find((t) => t.label === goal.label);
                return (
                <li
                  key={goal.id}
                  className="profile-subcard profile-subcard--soft flex items-center gap-2 !py-2"
                >
                  <button type="button" onClick={() => toggleGoal(goal)} className="shrink-0 text-accent">
                    {goal.completed ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-muted-foreground" />}
                  </button>
                  <span className={`flex-1 text-sm ${goal.completed ? "text-muted-foreground line-through" : "profile-text-strong"}`}>
                    {goal.label}
                  </span>
                  {template && !goal.completed ? (
                    <Link
                      href={template.href}
                      className="shrink-0 text-[10px] font-semibold text-accent hover:underline"
                    >
                      Ir →
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeGoal(goal.id)}
                    className="text-[10px] text-muted-foreground hover:text-red-300"
                  >
                    ✕
                  </button>
                </li>
              );
              })
            ) : (
              <li className="text-sm text-muted-foreground">Define metas concretas para tu semestre.</li>
            )}
          </ul>
        </section>
      </div>

      {/* Achievements */}
      <section className="profile-panel">
        <div className="flex items-center justify-between gap-2">
          <p className="profile-kicker">
            <Trophy size={13} />
            Logros de aprendizaje
          </p>
          <span className="text-xs text-muted-foreground">
            {earnedCount} / {achievements.length}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {achievements.map((badge) => (
            <div
              key={badge.id}
              className={`profile-achievement ${badge.earned ? "is-earned" : ""}`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <p className="mt-2 text-xs font-semibold profile-text-strong">{badge.label}</p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{badge.description}</p>
              {!badge.earned && badge.progress !== undefined ? (
                <div className="profile-progress-track mt-2 h-1">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${badge.progress}%` }} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Preferences + Theme */}
      <section className="profile-panel">
        <p className="profile-kicker">
          <Palette size={13} />
          Preferencias de estudio
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(PREFERENCE_META) as StudyPreferenceKey[]).map((key) => {
            const meta = PREFERENCE_META[key];
            const Icon = meta.icon;
            const active = settings.preferences[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => togglePreference(key)}
                className={`profile-pref-btn ${active ? "is-active" : ""}`}
              >
                <Icon size={18} className={active ? "text-accent" : "text-muted-foreground"} />
                <p className="mt-2 text-sm font-semibold profile-text-strong">{meta.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{meta.description}</p>
              </button>
            );
          })}
        </div>

        <p className="mt-6 mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tema visual</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PROFILE_THEMES) as ProfileTheme[]).map((key) => {
            const t = PROFILE_THEMES[key];
            const selected = settings.theme === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTheme(key)}
                className={`profile-theme-btn ${selected ? "is-selected" : ""}`}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: t.accent, boxShadow: selected ? `0 0 8px ${t.glow}` : undefined }} />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Compact settings */}
      <section className="profile-panel profile-panel--muted">
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="profile-settings-toggle"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Settings2 size={16} />
            Datos académicos
          </span>
          <ChevronRight size={16} className={`text-muted-foreground transition ${showSettings ? "rotate-90" : ""}`} />
        </button>
        {showSettings ? (
          <div className="profile-settings-divider px-5 pb-5 pt-4">
            <ProfileForm
              fullName={fullName}
              currentCycle={
                currentCycleNumber != null && currentCycleLabel
                  ? { cycleNumber: currentCycleNumber, cycleLabel: currentCycleLabel }
                  : null
              }
              compact
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
