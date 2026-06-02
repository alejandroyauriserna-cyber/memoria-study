"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Library } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { AcademicTutorChat } from "@/components/study/academic-tutor-chat";
import { UploadGenerator } from "@/components/study/upload-generator";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

const highlights = [
  {
    label: "Organizadores visuales",
    description: "Mapas conceptuales y resúmenes generados por IA a partir de tus PDFs.",
    icon: Brain,
  },
  {
    label: "Biblioteca colaborativa",
    description: "Apuntes y materiales compartidos por curso, ciclo y carrera.",
    icon: Library,
  },
  {
    label: "Estudio activo",
    description: "Flashcards, quiz y tutor jurídico con contexto del documento.",
    icon: BookOpen,
  },
];

export default function Home() {
  return (
    <AppShell>
      <div className="ms-page mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="ms-panel p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">
            Plataforma académica de Derecho · {UNT_DERECHO.university}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-[#F5F7FA] md:text-5xl">
            Plataforma inteligente para el estudio jurídico
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            MemoriaStudy ayuda a estudiantes de Derecho a organizar apuntes, generar material de estudio con IA y
            colaborar en una biblioteca académica confiable.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="tron-btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold"
            >
              Ir al panel <ArrowRight size={16} />
            </Link>
            <Link
              href="/library"
              className="tron-btn-secondary inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-semibold"
            >
              Explorar biblioteca
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.label} className="ms-panel p-5">
              <item.icon size={22} className="text-[#00FFD5]" />
              <h2 className="mt-3 text-lg font-semibold text-[#F5F7FA]">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <AcademicTutorChat />
          <div className="ms-panel p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">Generador</p>
            <h2 className="mt-2 text-2xl font-bold text-[#F5F7FA]">Material de estudio desde PDF</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Sube un documento, define el contexto académico y genera flashcards, definiciones y preguntas de repaso.
            </p>
            <div className="mt-6">
              <UploadGenerator />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
