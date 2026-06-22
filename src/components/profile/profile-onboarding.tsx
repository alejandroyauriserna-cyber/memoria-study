"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Gavel, Map, Upload } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Sube tu primer PDF",
    description: "Material de curso, apuntes o sentencias para generar mazos y organizadores.",
    href: "/upload-material",
    label: "Subir material",
  },
  {
    icon: Gavel,
    title: "Configura fuentes jurídicas",
    description: "Sincroniza LP Derecho y jurisprudencia para el profesor IA verificable.",
    href: "/fuentes-juridicas",
    label: "Fuentes jurídicas",
  },
  {
    icon: BookOpen,
    title: "Prueba estudio guiado",
    description: "Estudia página por página con el tutor jurídico especializado.",
    href: "/library",
    label: "Ir a biblioteca",
  },
  {
    icon: Map,
    title: "Crea un organizador",
    description: "Mapa conceptual o resumen visual desde tu material.",
    href: "/organizers",
    label: "Organizadores IA",
  },
];

export function ProfileOnboarding({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <>
        <p className="ms-home-onboarding__title">Primera sesión</p>
        <p className="ms-home-onboarding__lead">
          Cuatro pasos para activar tu espacio.{" "}
          <Link href="/guia" className="ms-home-onboarding__guide-link">
            <Compass size={11} aria-hidden />
            ¿Qué hace cada cosa?
          </Link>
        </p>
        <div className="ms-home-onboarding__pills">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.href}
                href={step.href}
                className="ms-home-onboarding__pill"
              >
                <Icon size={12} aria-hidden />
                {step.label}
                <ArrowRight size={11} aria-hidden />
              </Link>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <section className="rounded-2xl border border-dashed border-[var(--pd-border-accent,var(--border))] bg-[var(--accent-soft)] p-5">
      <p className="text-sm font-semibold text-foreground">Empieza tu ruta en MemoriaStudy</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Completa estos pasos para desbloquear estadísticas, logros y recomendaciones personalizadas.{" "}
        <Link href="/guia" className="font-semibold text-[var(--accent)] hover:underline">
          Ver guía de todas las funciones →
        </Link>
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.href}
              href={step.href}
              className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_50%,transparent)] p-4 transition hover:border-[var(--pd-border-accent,var(--border))]"
            >
              <Icon size={18} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.description}</p>
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)]">
                  {step.label}
                  <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
