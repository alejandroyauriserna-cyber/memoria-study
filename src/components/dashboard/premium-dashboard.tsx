"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Brain,
  Gavel,
  Library,
  PenLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { DashboardOnboarding } from "@/components/dashboard/dashboard-onboarding";
import { PwaInstallHint } from "@/components/dashboard/pwa-install-hint";
import { getTimeGreeting } from "@/lib/home/greeting";
import type {
  AiSuggestion,
  MemoriaDashboardProps,
  RecentContinueItem,
  RecentItemKind,
} from "@/lib/home/dashboard-types";
import "@/components/dashboard/premium-dashboard.css";

const DOCK = [
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/organizers", label: "Organizadores", icon: Brain },
  { href: "/fuentes-juridicas", label: "Fuentes", icon: Gavel },
  { href: "/upload-material", label: "Subir PDF", icon: Upload },
] as const;

const KIND_ICON: Record<RecentItemKind, typeof BookOpen> = {
  pdf: BookOpen,
  apunte: BookMarked,
  organizer: Brain,
  exam: Gavel,
  chat: Sparkles,
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function fade(index: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.04, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  };
}

export function PremiumDashboard({
  profileName,
  currentCycle,
  materialsThisWeek,
  studyHoursLabel,
  totalOrganizers,
  studyStreakDays,
  pagesUnderstood,
  showOnboarding,
  recentItems,
  suggestions,
}: MemoriaDashboardProps) {
  const greeting = getTimeGreeting();
  const firstName = profileName.split(/\s+/)[0] ?? profileName;
  const focal = recentItems[0] ?? null;
  const insight = suggestions[0] ?? null;
  const recentTail = recentItems.slice(focal ? 1 : 0, 5);

  return (
    <div className="home-app">
      <motion.div className="home-app__top" {...fade(0)}>
        <h1 className="home-app__greeting">
          {greeting}, {firstName}
          <em> — {currentCycle}</em>
        </h1>
        <div className="home-app__meta">
          <span>
            <strong>{studyStreakDays}</strong> d racha
          </span>
          <span>
            <strong>{totalOrganizers}</strong> organizadores
          </span>
        </div>
      </motion.div>

      {showOnboarding ? (
        <motion.div className="home-app__notice" {...fade(1)}>
          <DashboardOnboarding show />
        </motion.div>
      ) : null}

      <motion.section className="home-app__command" {...fade(2)} aria-label="Continuar estudiando">
        <div className="home-app__command-grid">
          <div className="home-app__command-main">
            <div>
              <p className="home-app__command-label">Continuar estudiando</p>
              {focal ? (
                <>
                  <h2 className="home-app__command-title">{focal.title}</h2>
                  <p className="home-app__command-desc">
                    {focal.subtitle}
                    <span className="home-app__command-time"> · {formatRelative(focal.at)}</span>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="home-app__command-title">Abre un material o sube un PDF</h2>
                  <p className="home-app__command-desc">
                    El tutor jurídico y los organizadores se activan desde tu biblioteca.
                  </p>
                </>
              )}
            </div>

            <div className="home-app__actions">
              {focal ? (
                <Link href={focal.href} className="home-app__btn-primary">
                  Continuar
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <Link href="/library" className="home-app__btn-primary">
                  Ir a biblioteca
                  <ArrowRight size={15} />
                </Link>
              )}
              <Link href="/cuaderno" className="home-app__btn-cuaderno">
                <PenLine size={15} />
                Cuaderno IA
              </Link>
              <Link href="/upload-material" className="home-app__btn-ghost">
                Subir PDF
              </Link>
            </div>
          </div>

          <aside className="home-app__stats-rail" aria-label="Actividad">
            <div className="home-app__stat">
              <p className="home-app__stat-value">{studyHoursLabel}</p>
              <p className="home-app__stat-label">Tiempo estimado</p>
            </div>
            <div className="home-app__stat">
              <p className="home-app__stat-value">{materialsThisWeek}</p>
              <p className="home-app__stat-label">Nuevos esta semana</p>
            </div>
            <div className="home-app__stat">
              <p className="home-app__stat-value">{pagesUnderstood}</p>
              <p className="home-app__stat-label">Páginas guiadas</p>
            </div>
          </aside>
        </div>
      </motion.section>

      <div className="home-app__bento">
        <motion.section className="home-app__panel" {...fade(3)} aria-label="Sugerencia IA">
          <div className="home-app__panel-head">
            <p className="home-app__panel-title">Sugerencia IA</p>
          </div>
          {insight ? (
            <>
              <p className="home-app__insight-text">{insight.sourceTitle}</p>
              <p className="home-app__insight-context">{insight.context}</p>
              <div className="home-app__chips">
                {insight.actions.map((action) => (
                  <Link key={action.id} href={action.href} className="home-app__chip">
                    {action.label}
                    <ArrowRight size={11} />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="home-app__insight-text">
                Sube material o abre el cuaderno para recibir el siguiente paso de estudio.
              </p>
              <div className="home-app__chips">
                <Link href="/cuaderno" className="home-app__chip">
                  Abrir Cuaderno IA
                  <ArrowRight size={11} />
                </Link>
              </div>
            </>
          )}
        </motion.section>

        <motion.section className="home-app__panel" {...fade(4)} aria-label="Recientes">
          <div className="home-app__panel-head">
            <p className="home-app__panel-title">Recientes</p>
            <Link href="/library" className="home-app__panel-link">
              Ver todo
            </Link>
          </div>
          <div className="home-app__list">
            {recentTail.length ? (
              recentTail.map((item) => {
                const Icon = KIND_ICON[item.kind];
                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={item.href}
                    className="home-app__list-item"
                  >
                    <span className="home-app__list-icon">
                      <Icon size={12} />
                    </span>
                    <span className="home-app__list-label">{item.title}</span>
                    <span className="home-app__list-time">{formatRelative(item.at)}</span>
                  </Link>
                );
              })
            ) : (
              <p className="home-app__empty">Tu actividad reciente aparecerá aquí.</p>
            )}
          </div>
        </motion.section>
      </div>

      <motion.nav className="home-app__dock" {...fade(5)} aria-label="Herramientas">
        {DOCK.map((item) => (
          <Link key={item.href} href={item.href} className="home-app__dock-item">
            <item.icon size={13} strokeWidth={1.75} />
            {item.label}
          </Link>
        ))}
      </motion.nav>

      <PwaInstallHint />
    </div>
  );
}
