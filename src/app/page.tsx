import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock,
  FileUp,
  Layers3,
  LibraryBig,
  Network,
  Scale,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { DashboardOnboarding } from "@/components/dashboard/dashboard-onboarding";
import { LegalAiHero } from "@/components/home/legal-ai-hero";
import { getTimeGreeting } from "@/lib/home/greeting";
import { loadMemoriaDashboardProps } from "@/lib/home/load-dashboard-props";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

const PRODUCT_STEPS = [
  { icon: FileUp, label: "Sube tu PDF", detail: "Clases, separatas o casos" },
  { icon: BrainCircuit, label: "IA lo entiende", detail: "Conceptos, citas y preguntas" },
  { icon: BookOpenCheck, label: "Estudia activo", detail: "Examen, resumen y repaso" },
] as const;

const FEATURE_CARDS = [
  {
    icon: LibraryBig,
    title: "Biblioteca juridica",
    copy: "Materiales ordenados por ciclo, curso y progreso real de estudio.",
    href: "/library",
  },
  {
    icon: Network,
    title: "Organizadores visuales",
    copy: "Mapas, lineas de tiempo y rutas para convertir teoria densa en estructura clara.",
    href: "/organizers",
  },
  {
    icon: Layers3,
    title: "Cuaderno IA",
    copy: "Apuntes conectados con tus PDFs, fuentes y sesiones de estudio.",
    href: "/cuaderno",
  },
] as const;

export default async function Home() {
  let dashboardProps = null;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      dashboardProps = await loadMemoriaDashboardProps(user);
    }
  }

  const isAuthenticated = Boolean(dashboardProps);
  const firstName = dashboardProps?.profileName.split(/\s+/)[0] ?? "Estudiante";
  const greeting = getTimeGreeting();
  const focal = dashboardProps?.recentItems[0] ?? null;
  const sessionTitle = focal?.title ?? "Derecho Constitucional";
  const sessionSubtitle = focal?.subtitle ?? "Tu proxima sesion de estudio";
  const studyHoursLabel = dashboardProps?.studyHoursLabel ?? "45 min";
  const progressLabel = dashboardProps?.pagesUnderstood
    ? `${Math.min(99, Math.max(12, dashboardProps.pagesUnderstood * 3))}%`
    : "82%";

  return (
    <AppShell>
      <div className="ms-home mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {dashboardProps?.showOnboarding ? (
          <div className="mb-2">
            <DashboardOnboarding show />
          </div>
        ) : null}

        <section className="ms-home-landing">
          <div className="ms-home-landing-copy">
            <p className="ms-home-kicker">
              <Sparkles size={14} />
              {isAuthenticated
                ? `${greeting}, ${firstName} · ${dashboardProps?.currentCycle ?? UNT_DERECHO.career}`
                : `${UNT_DERECHO.university} / ${UNT_DERECHO.career}`}
            </p>
            <h1>Tu estudio juridico, convertido en un sistema inteligente.</h1>
            <p className="ms-home-lead">
              {isAuthenticated && focal
                ? `Retoma ${focal.title} desde donde lo dejaste. MemoriaStudy mantiene biblioteca, cuaderno y tutor IA alineados con tu ciclo.`
                : "MemoriaStudy une biblioteca, cuaderno, fuentes juridicas y tutor IA para estudiar Derecho con mas claridad, menos friccion y progreso visible desde el primer PDF."}
            </p>
            <div className="ms-home-actions">
              {isAuthenticated ? (
                <>
                  <Link
                    href={focal?.href ?? "/library"}
                    className="tron-btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold"
                  >
                    {focal ? "Continuar estudiando" : "Ir a biblioteca"}
                    <ArrowRight size={17} />
                  </Link>
                  <Link
                    href="/cuaderno"
                    className="tron-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold"
                  >
                    Abrir cuaderno IA
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="tron-btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold"
                  >
                    Empezar ahora <ArrowRight size={17} />
                  </Link>
                  <Link
                    href="#asistente"
                    className="tron-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold"
                  >
                    Probar asistente
                  </Link>
                </>
              )}
            </div>
            <div className={`ms-home-trust${isAuthenticated ? " !flex" : ""}`}>
              {isAuthenticated ? (
                <>
                  <span>
                    <CheckCircle2 size={15} />
                    {dashboardProps?.studyStreakDays ?? 0} d de racha
                  </span>
                  <span>
                    <Clock size={15} />
                    {studyHoursLabel} estimados
                  </span>
                  <span>
                    <CheckCircle2 size={15} />
                    {dashboardProps?.totalOrganizers ?? 0} organizadores
                  </span>
                </>
              ) : (
                <>
                  <span>
                    <CheckCircle2 size={15} />
                    Estudio guiado
                  </span>
                  <span>
                    <CheckCircle2 size={15} />
                    Fuentes verificables
                  </span>
                  <span>
                    <CheckCircle2 size={15} />
                    Organizacion por ciclo
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="ms-home-product-shot" aria-label="Vista previa de MemoriaStudy">
            <div className="ms-home-product-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="ms-home-product-grid">
              <div className="ms-home-product-panel ms-home-product-main">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
                      Sesion activa
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[#F5F7FA]">{sessionTitle}</h2>
                    {isAuthenticated ? (
                      <p className="mt-1 text-xs text-muted-foreground">{sessionSubtitle}</p>
                    ) : null}
                  </div>
                  <Scale size={34} className="text-[#00FFD5]" strokeWidth={1.4} />
                </div>
                <div className="mt-6 space-y-3">
                  {PRODUCT_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="ms-home-step-row">
                        <span className="ms-home-step-icon">
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <strong>{step.label}</strong>
                          <small>{step.detail}</small>
                        </span>
                        <em>{index + 1}</em>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="ms-home-product-panel">
                <p className="ms-home-mini-title">Progreso</p>
                <div className="ms-home-progress-ring">{progressLabel}</div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {isAuthenticated
                    ? `${dashboardProps?.pagesUnderstood ?? 0} paginas comprendidas en tus materiales.`
                    : "Repaso listo para examen oral y escrito."}
                </p>
              </div>
              <div className="ms-home-product-panel">
                <p className="ms-home-mini-title">Tutor IA</p>
                <div className="mt-4 space-y-2">
                  <span className="ms-home-chat-line w-full" />
                  <span className="ms-home-chat-line w-10/12" />
                  <span className="ms-home-chat-line w-7/12 is-hot" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ms-home-feature-band" aria-label="Funciones principales">
          {FEATURE_CARDS.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} href={feature.href} className="ms-home-feature-card">
                <Icon size={21} />
                <h2>{feature.title}</h2>
                <p>{feature.copy}</p>
              </Link>
            );
          })}
        </section>

        <LegalAiHero />

        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Scale size={14} className="text-[#00FFD5]/70" />
          {isAuthenticated
            ? "Tu espacio de estudio esta listo — continua desde biblioteca, cuaderno o tutor IA"
            : "Vista previa del asistente / requiere cuenta para guardar tu progreso"}
        </p>
      </div>
    </AppShell>
  );
}
