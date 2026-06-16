"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  ChevronRight,
  Clock,
  FileText,
  Gavel,
  Layers3,
  Scale,
  Search,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { DashboardOnboarding } from "@/components/dashboard/dashboard-onboarding";
import { useTimeGreeting } from "@/lib/home/use-time-greeting";
import { formatContinueRelative } from "@/lib/home/build-continue-studying";
import type { MemoriaDashboardProps } from "@/lib/home/dashboard-types";
import type { MicroStudyDashboardProps } from "@/types/micro-study";
import {
  PROFESSIONAL_STAGES,
  resolveProfessionalStage,
} from "@/lib/micro-study/professional-route";
import { recordMicroActivity } from "@/lib/micro-study/record-activity";
import "@/components/micro-study/micro-study-mobile.css";
import "@/components/micro-study/micro-study-desktop.css";

const QUICK_LINKS = [
  { href: "/organizers", label: "Organizadores", icon: Brain },
  { href: "/fuentes-juridicas", label: "Fuentes", icon: Gavel },
  { href: "/upload-material", label: "Subir PDF", icon: Upload },
  { href: "/cuaderno", label: "Cuaderno IA", icon: Layers3 },
] as const;

function fade(index: number) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  };
}

type Props = MemoriaDashboardProps & { microStudy: MicroStudyDashboardProps };

export function MicroStudyDashboard(props: Props) {
  const {
    profileName,
    currentCycle,
    showOnboarding,
    continueStudying,
    studyStreakDays,
    materialsThisWeek,
    pagesUnderstood,
    totalOrganizers,
    totalShared,
    microStudy,
  } = props;

  const greeting = useTimeGreeting();
  const firstName = profileName.split(/\s+/)[0] ?? profileName;
  const { progressToNext } = resolveProfessionalStage(microStudy.activityScore);
  const currentStageIndex = PROFESSIONAL_STAGES.findIndex(
    (s) => s.id === microStudy.professionalStage.id,
  );

  return (
    <div className="ms-micro ms-home">
      <motion.header className="ms-micro__head" {...fade(0)}>
        <div>
          <p className="ms-micro__kicker">
            <Scale size={13} aria-hidden className="ms-micro__kicker-mobile-only" />
            <Sparkles size={13} aria-hidden className="ms-micro__kicker-desktop-only" />
            <span className="ms-micro__kicker-mobile-only">{currentCycle ?? "MemoriaStudy"}</span>
            <span className="ms-micro__kicker-desktop-only">
              {currentCycle
                ? `${UNT_DERECHO.university} / ${currentCycle}`
                : UNT_DERECHO.university}
            </span>
          </p>
          <h1 className="ms-micro__greeting">
            {greeting}, {firstName}
          </h1>
        </div>
        <span className="ms-micro__streak-pill">{studyStreakDays} d activos</span>
        <div className="ms-micro__head-metrics" aria-label="Métricas de estudio">
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
        <motion.div {...fade(1)}>
          <DashboardOnboarding show />
        </motion.div>
      ) : null}

      {/* 1. Continuar estudiando — botón principal */}
      <motion.section {...fade(2)}>
        {continueStudying ? (
          <Link href={continueStudying.href} className="ms-micro__continue-hero">
            <span className="ms-micro__continue-hero-label">Continuar estudiando</span>
            <strong className="ms-micro__continue-hero-title">{continueStudying.title}</strong>
            <span className="ms-micro__continue-hero-meta">
              {continueStudying.courseName} · {continueStudying.studyPoint} ·{" "}
              {formatContinueRelative(continueStudying.lastActiveAt)}
            </span>
            <span className="ms-micro__continue-hero-cta">
              Retomar
              <ArrowRight size={18} />
            </span>
          </Link>
        ) : (
          <Link href="/library" className="ms-micro__continue-hero ms-micro__continue-hero--empty">
            <span className="ms-micro__continue-hero-label">Empezar a estudiar</span>
            <strong className="ms-micro__continue-hero-title">Abre tu biblioteca jurídica</strong>
            <span className="ms-micro__continue-hero-meta">
              Sube un PDF o abre un material para activar el tutor IA
            </span>
            <span className="ms-micro__continue-hero-cta">
              Ir a biblioteca
              <ArrowRight size={18} />
            </span>
          </Link>
        )}
      </motion.section>

      <div className="ms-micro__bento">
      {/* 2. Concepto del día — desde materiales del usuario */}
      <motion.article className="ms-micro__card ms-micro__card--concept" {...fade(3)}>
        <p className="ms-micro__card-label">
          <Scale size={14} />
          Concepto del día
        </p>
        <p className="ms-micro__card-source">{microStudy.dailyConcept.courseName}</p>
        <h2 className="ms-micro__card-title">{microStudy.dailyConcept.title}</h2>
        <p className="ms-micro__card-def">{microStudy.dailyConcept.definition}</p>
        <div className="ms-micro__card-foot">
          <Link
            href="/micro-estudio?step=concept&mode=daily-concept"
            className="ms-micro__card-btn"
            onClick={() => void recordMicroActivity("concept_reviewed", { source: "daily" })}
          >
            Ver explicación
            <ArrowRight size={14} />
          </Link>
          <span className="ms-micro__time">
            <Clock size={12} />
            {microStudy.dailyConcept.estimatedMinutes} min
          </span>
        </div>
      </motion.article>

      {/* 3. Sentencia destacada — jurisprudencia por tema */}
      <motion.article className="ms-micro__card ms-micro__card--sentencia" {...fade(4)}>
        <p className="ms-micro__card-label">
          <FileText size={14} />
          Sentencia destacada
        </p>
        <h2 className="ms-micro__card-title">{microStudy.dailySentencia.title}</h2>
        <div className="ms-micro__tags">
          <span>{microStudy.dailySentencia.materia}</span>
          <span>{microStudy.dailySentencia.tema}</span>
        </div>
        <p className="ms-micro__card-summary">{microStudy.dailySentencia.summary}</p>
        <p className="ms-micro__ai-badge">Resumen IA · {microStudy.dailySentencia.organo}</p>
        <div className="ms-micro__card-foot">
          <Link
            href={`/biblioteca-juridica?doc=${microStudy.dailySentencia.id}`}
            className="ms-micro__card-btn"
            onClick={() => void recordMicroActivity("sentencia_read", { source: "daily" })}
          >
            Leer en 2 minutos
            <ArrowRight size={14} />
          </Link>
          <Link href={microStudy.dailySentencia.searchHref} className="ms-micro__search-link">
            <Search size={12} />
            {microStudy.dailySentencia.searchTopic}
          </Link>
        </div>
      </motion.article>

      {/* 4. Tengo 5 minutos */}
      <motion.section className="ms-micro__five-min-wrap" {...fade(5)}>
        <Link href="/micro-estudio" className="ms-micro__five-min">
          <span className="ms-micro__five-min-icon">
            <Zap size={22} strokeWidth={2.2} />
          </span>
          <span className="ms-micro__five-min-copy">
            <strong>Tengo 5 minutos</strong>
            <small>3 conceptos · 2 flashcards · 1 pregunta</small>
          </span>
          <ChevronRight size={20} className="ms-micro__five-min-arrow" />
        </Link>
      </motion.section>

      {/* 5. Ruta profesional jurídica — compacta en móvil */}
      <motion.section className="ms-micro__route-full" {...fade(6)}>
        <div className="ms-micro__section-head">
          <h2>Ruta profesional</h2>
          <span className="ms-micro__route-current">
            {microStudy.professionalStage.emoji} {microStudy.professionalStage.label}
          </span>
        </div>

        {microStudy.nextProfessionalStage ? (
          <>
            <div className="ms-micro__bar-track ms-micro__route-progress-track">
              <div className="ms-micro__bar-fill" style={{ width: `${progressToNext}%` }} />
            </div>
            <p className="ms-micro__route-hint ms-micro__route-hint--next">
              Siguiente: {microStudy.nextProfessionalStage.emoji}{" "}
              {microStudy.nextProfessionalStage.label}
            </p>
          </>
        ) : null}

        <details className="ms-micro__route-details">
          <summary className="ms-micro__route-details-summary">Ver ruta completa</summary>
          <ol className="ms-micro__route-ladder">
            {PROFESSIONAL_STAGES.map((stage, index) => {
              const state =
                index < currentStageIndex
                  ? "done"
                  : index === currentStageIndex
                    ? "current"
                    : "locked";
              return (
                <li key={stage.id} className={`ms-micro__route-step is-${state}`}>
                  <span className="ms-micro__route-step-icon">{stage.emoji}</span>
                  <span className="ms-micro__route-step-label">{stage.label}</span>
                </li>
              );
            })}
          </ol>
        </details>
      </motion.section>
      </div>

      <motion.nav className="ms-micro__quick-links" {...fade(7)} aria-label="Accesos rápidos">
        {QUICK_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="ms-micro__quick-link">
            <item.icon size={12} />
            {item.label}
          </Link>
        ))}
      </motion.nav>
    </div>
  );
}
