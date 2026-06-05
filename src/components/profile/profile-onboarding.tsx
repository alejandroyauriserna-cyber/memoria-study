"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Gavel, Map, Upload } from "lucide-react";

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

export function ProfileOnboarding() {
  return (
    <section className="rounded-2xl border border-dashed border-[rgba(0,255,213,0.2)] bg-[rgba(0,255,213,0.04)] p-5">
      <p className="text-sm font-semibold text-[#F5F7FA]">Empieza tu ruta en MemoriaStudy</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Completa estos pasos para desbloquear estadísticas, logros y recomendaciones personalizadas.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.href}
              href={step.href}
              className="group flex items-start gap-3 rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-4 transition hover:border-[rgba(0,255,213,0.28)]"
            >
              <Icon size={18} className="mt-0.5 shrink-0 text-[#00FFD5]" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#F5F7FA]">{step.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{step.description}</p>
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#00FFD5]">
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
