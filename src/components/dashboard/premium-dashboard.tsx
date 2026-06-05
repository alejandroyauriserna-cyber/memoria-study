"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
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

const SECONDARY_NAV = [
  { href: "/library", label: "Biblioteca", icon: Library },
  { href: "/organizers", label: "Organizadores", icon: Brain },
  { href: "/fuentes-juridicas", label: "Fuentes jurídicas", icon: Gavel },
  { href: "/upload-material", label: "Subir material", icon: Upload },
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
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}

function pickFocalItem(items: RecentContinueItem[]): RecentContinueItem | null {
  return items[0] ?? null;
}

function pickPrimarySuggestion(suggestions: AiSuggestion[]): AiSuggestion | null {
  return suggestions[0] ?? null;
}

function fadeTransition(index: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
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
  const focal = pickFocalItem(recentItems);
  const insight = pickPrimarySuggestion(suggestions);
  const recentTail = recentItems.slice(focal ? 1 : 0, 4);

  return (
    <div className="premium-dash">
      <div className="premium-dash__ambient" aria-hidden />

      <motion.header className="premium-dash__header" {...fadeTransition(0)}>
        <div>
          <p className="premium-dash__eyebrow">{currentCycle} · Derecho UNT</p>
          <h1 className="premium-dash__title">
            {greeting}, {firstName}
          </h1>
          <p className="premium-dash__subtitle">
            Retoma donde lo dejaste o abre tu Cuaderno IA — todo conectado en un solo flujo.
          </p>
        </div>
        <div className="premium-dash__metrics" aria-label="Resumen de actividad">
          <span>
            <strong>{studyStreakDays}</strong> días racha
          </span>
          <span className="premium-dash__metrics-dot" aria-hidden />
          <span>
            <strong>{studyHoursLabel}</strong>
          </span>
          <span className="premium-dash__metrics-dot" aria-hidden />
          <span>
            <strong>{materialsThisWeek}</strong> esta semana
          </span>
          <span className="premium-dash__metrics-dot" aria-hidden />
          <span>
            <strong>{pagesUnderstood}</strong> págs.
          </span>
          <span className="premium-dash__metrics-dot" aria-hidden />
          <span>
            <strong>{totalOrganizers}</strong> org.
          </span>
        </div>
      </motion.header>

      {showOnboarding ? (
        <motion.div className="premium-dash__banner" {...fadeTransition(1)}>
          <DashboardOnboarding show />
        </motion.div>
      ) : null}

      <div className="premium-dash__bento">
        {/* Hero central: continuar estudiando */}
        <motion.section
          className="premium-dash__glass premium-dash__hero"
          {...fadeTransition(2)}
          aria-label="Continuar estudiando"
        >
          <div>
            <div className="premium-dash__hero-top">
              <p className="premium-dash__hero-kicker">
                <span className="premium-dash__hero-kicker-pulse" aria-hidden />
                Continuar estudiando
              </p>
              {focal ? (
                <span className="premium-dash__hero-time">{formatRelative(focal.at)}</span>
              ) : null}
            </div>
            {focal ? (
              <>
                <h2 className="premium-dash__hero-title">{focal.title}</h2>
                <p className="premium-dash__hero-meta">{focal.subtitle}</p>
              </>
            ) : (
              <>
                <h2 className="premium-dash__hero-title">Tu próxima sesión empieza aquí</h2>
                <p className="premium-dash__hero-meta">
                  Abre un PDF de la biblioteca o sube material — el tutor y los organizadores se
                  activan al instante.
                </p>
              </>
            )}
          </div>
          <div className="premium-dash__hero-actions">
            {focal ? (
              <Link href={focal.href} className="premium-dash__cta-primary">
                Continuar
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href="/library" className="premium-dash__cta-primary">
                Ir a biblioteca
                <ArrowRight size={16} />
              </Link>
            )}
            <Link href="/upload-material" className="premium-dash__cta-ghost">
              Subir PDF
            </Link>
          </div>
        </motion.section>

        {/* Cuaderno IA — función principal */}
        <motion.div {...fadeTransition(3)}>
          <Link href="/cuaderno" className="premium-dash__glass premium-dash__cuaderno">
            <div>
              <span className="premium-dash__cuaderno-badge">
                <Sparkles size={10} />
                Función principal
              </span>
              <div className="premium-dash__cuaderno-icon-wrap" style={{ marginTop: "1.25rem" }}>
                <PenLine size={22} strokeWidth={1.75} />
              </div>
              <h2 className="premium-dash__cuaderno-title">Cuaderno IA</h2>
              <p className="premium-dash__cuaderno-desc">
                Apuntes vivos, stickers, diccionario jurídico y generación sin depender de un PDF.
              </p>
            </div>
            <span className="premium-dash__cuaderno-cta">
              Abrir cuaderno
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </motion.div>

        {/* IA proactiva */}
        <motion.section
          className="premium-dash__glass premium-dash__insight"
          {...fadeTransition(4)}
          aria-label="Sugerencia IA"
        >
          <p className="premium-dash__insight-kicker">
            <Sparkles size={11} />
            IA proactiva
          </p>
          {insight ? (
            <>
              <p className="premium-dash__insight-body">{insight.sourceTitle}</p>
              <p className="premium-dash__insight-source">{insight.context}</p>
              <div className="premium-dash__insight-actions">
                {insight.actions.map((action) => (
                  <Link key={action.id} href={action.href} className="premium-dash__pill">
                    {action.label}
                    <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="premium-dash__insight-body">
                La IA sugerirá tu siguiente paso cuando subas material o abras el cuaderno.
              </p>
              <div className="premium-dash__insight-actions">
                <Link href="/cuaderno" className="premium-dash__pill">
                  Abrir Cuaderno IA
                  <ArrowRight size={12} />
                </Link>
              </div>
            </>
          )}
        </motion.section>

        {/* Actividad reciente — lista, no tarjetas */}
        <motion.section
          className="premium-dash__glass premium-dash__recent"
          {...fadeTransition(5)}
          aria-label="Actividad reciente"
        >
          <div className="premium-dash__recent-head">
            <p className="premium-dash__eyebrow">Recientes</p>
            <Link
              href="/library"
              className="text-[11px] font-medium text-[var(--accent)] hover:underline"
            >
              Ver biblioteca
            </Link>
          </div>
          <div className="premium-dash__recent-list">
            {recentTail.length ? (
              recentTail.map((item) => {
                const Icon = KIND_ICON[item.kind];
                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={item.href}
                    className="premium-dash__recent-item"
                  >
                    <span className="premium-dash__recent-icon">
                      <Icon size={13} />
                    </span>
                    <span className="premium-dash__recent-title">{item.title}</span>
                    <span className="premium-dash__recent-time">{formatRelative(item.at)}</span>
                  </Link>
                );
              })
            ) : (
              <p className="py-2 text-xs leading-relaxed text-muted-foreground">
                Sin historial reciente. Tu última sesión aparecerá en el hero central.
              </p>
            )}
          </div>
        </motion.section>

        {/* Accesos secundarios — strip, no tarjetas */}
        <motion.nav
          className="premium-dash__nav-strip"
          {...fadeTransition(6)}
          aria-label="Más herramientas"
        >
          {SECONDARY_NAV.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="premium-dash__nav-link">
              <item.icon size={14} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
        </motion.nav>

        <PwaInstallHint />
      </div>
    </div>
  );
}
