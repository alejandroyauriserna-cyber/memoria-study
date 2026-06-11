"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Brain,
  Clock,
  Gavel,
  Layers3,
  LibraryBig,
  PenLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { DashboardOnboarding } from "@/components/dashboard/dashboard-onboarding";
import { PwaInstallHint } from "@/components/dashboard/pwa-install-hint";
import { useTimeGreeting } from "@/lib/home/use-time-greeting";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import type {
  MemoriaDashboardProps,
  RecentContinueItem,
  RecentItemKind,
} from "@/lib/home/dashboard-types";
import "@/components/dashboard/premium-dashboard.css";

const KIND_ICON: Record<RecentItemKind, typeof BookOpen> = {
  pdf: BookOpen,
  apunte: BookMarked,
  organizer: Brain,
  exam: Gavel,
  chat: Sparkles,
};

const QUICK_LINKS = [
  { href: "/organizers", label: "Organizadores", icon: Brain },
  { href: "/fuentes-juridicas", label: "Fuentes", icon: Gavel },
  { href: "/upload-material", label: "Subir PDF", icon: Upload },
] as const;

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
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export function PremiumDashboard({
  profileName,
  currentCycle,
  materialsThisWeek,
  studyHoursLabel,
  totalOrganizers,
  totalShared,
  studyStreakDays,
  pagesUnderstood,
  showOnboarding,
  recentItems,
  suggestions,
}: MemoriaDashboardProps) {
  const greeting = useTimeGreeting();
  const firstName = profileName.split(/\s+/)[0] ?? profileName;
  const focal = recentItems[0] ?? null;
  const insight = suggestions[0] ?? null;
  const recentTail = recentItems.slice(focal ? 1 : 0, 4);

  return (
    <div className="dash-home ms-home">
      <motion.header className="dash-home__head" {...fade(0)}>
        <div>
          <p className="dash-home__kicker">
            <Sparkles size={13} />
            {currentCycle ? `${UNT_DERECHO.university} / ${currentCycle}` : UNT_DERECHO.university}
          </p>
          <h1 className="dash-home__greeting">
            {greeting}, {firstName}
          </h1>
        </div>
        <div className="dash-home__metrics-inline" aria-label="Métricas secundarias">
          <span>
            <strong>{studyStreakDays}</strong> d racha
          </span>
          <span>
            <strong>{materialsThisWeek}</strong> nuevos
          </span>
          <span>
            <strong>{pagesUnderstood}</strong> págs.
          </span>
          <span>
            <strong>{totalOrganizers}</strong> org.
          </span>
          <span>
            <strong>{totalShared}</strong> docs
          </span>
        </div>
      </motion.header>

      {showOnboarding ? (
        <motion.div className="dash-home__notice" {...fade(1)}>
          <DashboardOnboarding show />
        </motion.div>
      ) : null}

      {/* 1. Hero — continuar estudiando */}
      <motion.section className="dash-home__hero" {...fade(2)} aria-label="Continuar estudiando">
        <div className="dash-home__hero-inner">
          <div>
            <p className="dash-home__hero-label">Sesión activa</p>
            {focal ? (
              <>
                <h2 className="dash-home__hero-title">{focal.title}</h2>
                <p className="dash-home__hero-topic">
                  Último tema: {focal.subtitle} · {formatRelative(focal.at)}
                </p>
              </>
            ) : (
              <>
                <h2 className="dash-home__hero-title">Continúa tu estudio jurídico</h2>
                <p className="dash-home__hero-topic">
                  Abre un material de tu biblioteca o sube un PDF para activar el tutor y los
                  organizadores.
                </p>
              </>
            )}
            <p className="dash-home__hero-time-badge">
              <Clock size={13} />
              Tiempo estimado: <strong>{studyHoursLabel}</strong>
            </p>
          </div>
          <div className="dash-home__hero-actions">
            {focal ? (
              <Link href={focal.href} className="dash-home__btn-primary">
                Continuar estudiando
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href="/library" className="dash-home__btn-primary">
                Ir a biblioteca
                <ArrowRight size={16} />
              </Link>
            )}
            <Link href="/upload-material" className="dash-home__btn-ghost">
              Subir PDF
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="dash-home__bento">
        {/* 2. Cuaderno IA — protagonista */}
        <motion.div {...fade(3)}>
          <Link href="/cuaderno" className="dash-home__glass dash-home__cuaderno">
            <div>
              <span className="dash-home__cuaderno-badge">
                <Layers3 size={11} />
                Función principal
              </span>
              <h3 className="dash-home__cuaderno-title">Cuaderno IA</h3>
              <p className="dash-home__cuaderno-copy">
                Apuntes vivos conectados con tus PDFs, fuentes jurídicas y sesiones de estudio. Sin
                depender de un documento para empezar.
              </p>
            </div>
            <span className="dash-home__cuaderno-cta">
              Abrir cuaderno
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </motion.div>

        {/* 3. Biblioteca jurídica — materiales académicos */}
        <motion.div {...fade(4)}>
          <Link href="/library" className="dash-home__glass dash-home__library">
            <LibraryBig size={22} className="dash-home__library-icon" strokeWidth={1.5} />
            <h3 className="dash-home__library-title">Materiales académicos</h3>
            <p className="dash-home__library-copy">
              PDFs y apuntes por ciclo y curso con progreso real de estudio guiado.
            </p>
          </Link>
        </motion.div>

        {/* Biblioteca Jurídica — jurisprudencia */}
        <motion.div {...fade(4)}>
          <Link href="/biblioteca-juridica" className="dash-home__glass dash-home__library">
            <Gavel size={22} className="dash-home__library-icon" strokeWidth={1.5} />
            <h3 className="dash-home__library-title">Biblioteca Jurídica</h3>
            <p className="dash-home__library-copy">
              Casaciones, sentencias y resoluciones — encuentra jurisprudencia en segundos.
            </p>
          </Link>
        </motion.div>

        {/* IA proactiva — compacta */}
        <motion.section className="dash-home__glass dash-home__insight" {...fade(5)} aria-label="Sugerencia IA">
          <p className="dash-home__panel-label">Sugerencia IA</p>
          {insight ? (
            <>
              <p className="dash-home__insight-text">{insight.sourceTitle}</p>
              <p className="dash-home__insight-context">{insight.context}</p>
              <div className="dash-home__chips">
                {insight.actions.map((action) => (
                  <Link key={action.id} href={action.href} className="dash-home__chip">
                    {action.label}
                    <ArrowRight size={11} />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="dash-home__insight-text">
                La IA propondrá tu siguiente paso cuando subas material o abras el cuaderno.
              </p>
              <div className="dash-home__chips">
                <Link href="/cuaderno" className="dash-home__chip">
                  <PenLine size={12} />
                  Cuaderno IA
                </Link>
              </div>
            </>
          )}
        </motion.section>

        {/* 4. Actividad reciente — timeline estilo landing */}
        <motion.section className="dash-home__glass dash-home__recent" {...fade(6)} aria-label="Actividad reciente">
          <div className="dash-home__recent-head">
            <p className="dash-home__panel-label">Actividad reciente</p>
            <Link href="/library" className="dash-home__recent-link">
              Ver biblioteca
            </Link>
          </div>
          <div className="dash-home__timeline">
            {recentTail.length ? (
              recentTail.map((item) => {
                const Icon = KIND_ICON[item.kind];
                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    href={item.href}
                    className="dash-home__timeline-row"
                  >
                    <span className="dash-home__timeline-icon">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="dash-home__timeline-title">{item.title}</span>
                      <span className="dash-home__timeline-sub">{item.subtitle}</span>
                    </span>
                    <span className="dash-home__timeline-time">{formatRelative(item.at)}</span>
                  </Link>
                );
              })
            ) : (
              <p className="dash-home__empty">
                Tu historial aparecerá aquí en cuanto retomes un material o organizador.
              </p>
            )}
          </div>
        </motion.section>
      </div>

      <motion.nav className="dash-home__chips" {...fade(7)} aria-label="Accesos rápidos">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="dash-home__chip">
            <item.icon size={12} />
            {item.label}
          </Link>
        ))}
      </motion.nav>

      <PwaInstallHint />
    </div>
  );
}
