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
  Clock,
  FileQuestion,
  GitBranch,
  Layers,
  Map,
  Palette,
  Settings2,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { ProfileAccountSection } from "@/components/profile/profile-account-section";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileLegalPanel } from "@/components/profile/profile-legal-panel";
import { ProfileOnboarding } from "@/components/profile/profile-onboarding";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import {
  aggregateClientLearningStats,
  formatStudyHours,
  type AggregatedLearningStats,
} from "@/lib/profile/aggregate-learning-stats";
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
import { applyDarkMode, readDarkModePreference } from "@/lib/theme/app-theme";

type CourseStudyCount = { courseName: string; count: number };

type Props = {
  email?: string | null;
  fullName: string;
  currentCycleLabel: string;
  currentCycleNumber?: number | null;
  organizersCount: number;
  serverStats: ServerLearningStats;
  topCourses: CourseStudyCount[];
  initialSettings?: Partial<ProfileStudySettings>;
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
  initialSettings,
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

  useEffect(() => {
    setStats(aggregateClientLearningStats(organizersCount, serverStats));
  }, [organizersCount, serverStats]);

  useEffect(() => {
    applyDarkMode(readDarkModePreference());
  }, []);

  useEffect(() => {
    saveProfileStudySettings(settings);
    document.documentElement.dataset.profileTheme = settings.theme;

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
        { label: "Horas estudiadas", value: formatStudyHours(stats.studyMinutes), icon: Clock },
        { label: "Páginas comprendidas", value: String(stats.pagesUnderstood), icon: BookOpen },
        { label: "Racha de estudio", value: `${stats.studyStreakDays} días`, icon: Zap },
        { label: "Organizadores", value: String(stats.organizersCreated), icon: Brain },
        { label: "Mazos guardados", value: String(stats.decksSaved), icon: Layers },
        { label: "Preguntas", value: String(stats.questionsAnswered), icon: FileQuestion },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl border p-6 md:p-8"
        style={{
          borderColor: `${theme.accent}33`,
          background: `linear-gradient(135deg, rgba(7,19,26,0.95) 0%, rgba(16,39,48,0.85) 100%)`,
          boxShadow: `0 0 48px ${theme.glow}`,
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: theme.accent }} />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
              <Sparkles size={12} />
              Centro de aprendizaje
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F5F7FA] md:text-4xl">
              {fullName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {insight?.summary ??
                "Tu asistente académico personal — seguimiento, objetivos y recomendaciones de estudio."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-[#07131A]"
                style={{ background: `linear-gradient(135deg, ${theme.accent}, rgba(0,191,255,0.85))` }}
              >
                {currentCycleLabel}
              </span>
              {level ? (
                <span className="rounded-full border border-[rgba(0,255,213,0.2)] bg-[rgba(0,255,213,0.08)] px-3 py-1 text-xs font-semibold text-[#00FFD5]">
                  {level.level} · {level.points} pts
                </span>
              ) : null}
              {stats?.reputationPoints ? (
                <span className="rounded-full border border-[rgba(255,214,0,0.2)] bg-[rgba(255,214,0,0.08)] px-3 py-1 text-xs font-semibold text-[#FDE68A]">
                  {stats.reputationPoints} reputación
                </span>
              ) : null}
              {insight ? (
                <span className="rounded-full border border-[rgba(0,255,213,0.15)] px-3 py-1 text-xs text-muted-foreground">
                  Estilo: {insight.studyStyle}
                </span>
              ) : null}
            </div>
          </div>

          {level ? (
            <div className="flex shrink-0 flex-col items-center gap-2">
              <div className="relative h-24 w-24">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(0,255,213,0.1)" strokeWidth="8" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${level.progress * 2.64} 264`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-[#F5F7FA]">{level.progress}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Nivel</span>
                </div>
              </div>
              {level.nextLevel ? (
                <p className="text-[10px] text-muted-foreground">→ {level.nextLevel}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {isNewUser ? <ProfileOnboarding /> : null}

      {stats ? (
        <section className="rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
            Esta semana
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#F5F7FA]/85">
            <span className="rounded-full border border-[rgba(0,255,213,0.15)] px-3 py-1">
              {stats.weeklyPagesUnderstood} páginas comprendidas
            </span>
            <span className="rounded-full border border-[rgba(0,255,213,0.15)] px-3 py-1">
              {stats.weeklyMaterialsOpened} materiales abiertos
            </span>
            <span className="rounded-full border border-[rgba(0,255,213,0.15)] px-3 py-1">
              {stats.weeklyOrganizers} organizadores
            </span>
          </div>
        </section>
      ) : null}

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
                className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(16,39,48,0.6)] p-4 backdrop-blur-sm"
              >
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon size={12} style={{ color: theme.accent }} />
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#F5F7FA]">{card.value}</p>
              </motion.div>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* AI Learning Profile */}
        <section className="lg:col-span-3 rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
            <Brain size={13} />
            Perfil de aprendizaje IA
          </p>
          {insight ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.5)] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estilo de estudio</p>
                <p className="mt-1 text-lg font-bold text-[#F5F7FA]">{insight.studyStyle}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#00FFD5]">Fortalezas</p>
                  <ul className="space-y-1.5">
                    {insight.strengths.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#F5F7FA]/85">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#00FFD5]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-300">Áreas por reforzar</p>
                  <ul className="space-y-1.5">
                    {insight.areasToImprove.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-[#F5F7FA]/85">
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
        <section className="lg:col-span-2 rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
            <Zap size={13} />
            Recomendaciones
          </p>
          <div className="mt-4 space-y-2">
            {recommendations.length ? (
              recommendations.map((rec) => (
                <Link
                  key={rec.id}
                  href={rec.href}
                  className="group flex items-start gap-3 rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.45)] p-3 transition hover:border-[rgba(0,255,213,0.28)] hover:bg-[rgba(0,255,213,0.06)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#F5F7FA]">{rec.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{rec.description}</p>
                    <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#00FFD5]">
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
        <section className="rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
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
                      <span className="font-medium text-[#F5F7FA]">{course.courseName}</span>
                      <span className="text-xs text-muted-foreground">{course.count} sesiones</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
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
        <section className="rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
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
                className="rounded-full border border-[rgba(0,255,213,0.15)] px-2.5 py-1 text-[10px] font-semibold text-[#00FFD5] hover:bg-[rgba(0,255,213,0.08)]"
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
              className="h-10 flex-1 rounded-xl border border-[rgba(0,255,213,0.15)] bg-[rgba(16,39,48,0.6)] px-3 text-sm text-[#F5F7FA] outline-none placeholder:text-muted-foreground focus:border-[rgba(0,255,213,0.35)]"
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
                  className="flex items-center gap-2 rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.4)] px-3 py-2"
                >
                  <button type="button" onClick={() => toggleGoal(goal)} className="shrink-0 text-[#00FFD5]">
                    {goal.completed ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-muted-foreground" />}
                  </button>
                  <span className={`flex-1 text-sm ${goal.completed ? "text-muted-foreground line-through" : "text-[#F5F7FA]"}`}>
                    {goal.label}
                  </span>
                  {template && !goal.completed ? (
                    <Link
                      href={template.href}
                      className="shrink-0 text-[10px] font-semibold text-[#00FFD5] hover:underline"
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
      <section className="rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
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
              className={`rounded-xl border p-3 text-center transition ${
                badge.earned
                  ? "border-[rgba(0,255,213,0.3)] bg-[rgba(0,255,213,0.08)]"
                  : "border-[rgba(0,255,213,0.08)] bg-[rgba(16,39,48,0.35)] opacity-60"
              }`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <p className="mt-2 text-xs font-semibold text-[#F5F7FA]">{badge.label}</p>
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{badge.description}</p>
              {!badge.earned && badge.progress !== undefined ? (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
                  <div className="h-full rounded-full bg-[#00FFD5]" style={{ width: `${badge.progress}%` }} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Preferences + Theme */}
      <section className="rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.55)] p-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
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
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-[rgba(0,255,213,0.35)] bg-[rgba(0,255,213,0.1)]"
                    : "border-[rgba(0,255,213,0.1)] bg-[rgba(16,39,48,0.4)] opacity-70"
                }`}
              >
                <Icon size={18} className={active ? "text-[#00FFD5]" : "text-muted-foreground"} />
                <p className="mt-2 text-sm font-semibold text-[#F5F7FA]">{meta.label}</p>
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
                onClick={() => {
                  setTheme(key);
                  applyDarkMode(readDarkModePreference());
                }}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  selected ? "border-[rgba(0,255,213,0.4)] bg-[rgba(0,255,213,0.1)]" : "border-[rgba(0,255,213,0.12)]"
                }`}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: t.accent, boxShadow: selected ? `0 0 8px ${t.glow}` : undefined }} />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Compact settings */}
      <section className="rounded-2xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.4)]">
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Settings2 size={16} />
            Datos académicos
          </span>
          <ChevronRight size={16} className={`text-muted-foreground transition ${showSettings ? "rotate-90" : ""}`} />
        </button>
        {showSettings ? (
          <div className="border-t border-[rgba(0,255,213,0.08)] px-5 pb-5 pt-4">
            <ProfileForm
              fullName={fullName}
              currentCycle={
                currentCycleNumber && currentCycleLabel
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
