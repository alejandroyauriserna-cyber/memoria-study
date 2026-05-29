"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { get } from "idb-keyval";
import { UploadGenerator } from "@/components/study/upload-generator";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

const highlights = [
  { label: "Estudio enfocado", description: "Materiales organizados por ciclo académico." },
  { label: "Colaboración UNT", description: "Comparte tus apuntes con otros estudiantes." },
  { label: "Aprendizaje activo", description: "Genera resúmenes y organizadores visuales." },
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askPdf() {
    try {
      setLoading(true);
      const pdfText = await get("pdfText");

      if (!pdfText) {
        alert("Primero genera un mazo desde un PDF para activar el tutor.");
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText, question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo consultar el PDF.");
      }

      setAnswer(data.answer);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Error al consultar el PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="glass-card rounded-[32px] p-10 md:p-12">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent">
                UNT Derecho · Plataforma Premium
              </span>
              <h1 className="mt-6 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                Estudia, comparte y crea organizadores con estilo.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                Transforma los apuntes de Derecho UNT en recursos visuales, flashcards y materiales colaborativos para cada ciclo.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Ciclo actual</p>
                  <p className="mt-3 text-2xl font-semibold">Ciclo V</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Nivel</p>
                  <p className="mt-3 text-2xl font-semibold">Estudiante</p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Materiales</p>
                  <p className="mt-3 text-2xl font-semibold">Biblioteca colaborativa</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-3xl bg-foreground px-6 text-sm font-semibold text-background transition hover:-translate-y-0.5 hover:bg-foreground/90"
                >
                  Ir al panel <ArrowRight size={16} />
                </Link>
                <Link
                  href="/library"
                  className="inline-flex h-12 items-center justify-center rounded-3xl border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-muted"
                >
                  Explorar Biblioteca
                </Link>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="glass-card rounded-[32px] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Destacado</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Aprende con organizadores visuales</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Crea mapas conceptuales, cuadros comparativos y resúmenes diseñados para tus cursos de Derecho.
              </p>
              <div className="mt-8 grid gap-4">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-border bg-background p-4 shadow-sm">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Herramienta rápida</p>
              <p className="mt-4 text-xl font-semibold tracking-tight">Tutor PDF</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Haz preguntas sobre tus documentos procesados y recibe respuestas en lenguaje académico.
              </p>
              <div className="mt-6 rounded-3xl border border-border bg-muted p-4">
                <p className="text-sm text-muted-foreground">Pregunta ejemplo:</p>
                <p className="mt-2 text-sm text-foreground">¿Cuál es la diferencia entre normas sancionadoras y dispositivas?</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card rounded-[32px] p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Tu espacio</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Organiza tus apuntes como una biblioteca profesional.</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Explora, guarda y estudia con una experiencia que se siente moderna y enfocada en estudiantes de Derecho.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-background p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Sube</p>
                <p className="mt-3 text-xl font-semibold text-foreground">Documentos, PDFs y guías</p>
              </div>
              <div className="rounded-3xl bg-background p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Crea</p>
                <p className="mt-3 text-xl font-semibold text-foreground">Resúmenes y organizadores</p>
              </div>
              <div className="rounded-3xl bg-background p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Comparte</p>
                <p className="mt-3 text-xl font-semibold text-foreground">Con tu comunidad UNT</p>
              </div>
              <div className="rounded-3xl bg-background p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Aprende</p>
                <p className="mt-3 text-xl font-semibold text-foreground">De forma visual y práctica</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[32px] p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Nivel</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight">Estudiante</h3>
              </div>
              <Sparkles className="h-10 w-10 text-accent" />
            </div>
            <div className="mt-8 rounded-3xl bg-muted p-5">
              <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>Progreso al siguiente nivel</span>
                <span>60%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-background">
                <div className="h-full w-3/5 rounded-full bg-accent" />
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Insignias</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">Colaborador</span>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">Organizador</span>
                  <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">Activo</span>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-background p-4">
                <p className="text-sm font-semibold text-foreground">Tendencias de la semana</p>
                <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                  <li>Material más descargado</li>
                  <li>Material mejor valorado</li>
                  <li>Organizador más usado</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-accent">Experiencia</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Tu panel principal es tu centro de estudio.</h2>
            </div>
            <Link href="/favorites" className="inline-flex h-12 items-center justify-center rounded-3xl bg-foreground px-6 text-sm font-semibold text-background transition hover:bg-foreground/90">
              Ver favoritos
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-muted p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Materiales subidos</p>
              <p className="mt-3 text-3xl font-semibold">0</p>
            </div>
            <div className="rounded-3xl border border-border bg-muted p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Descargas</p>
              <p className="mt-3 text-3xl font-semibold">0</p>
            </div>
            <div className="rounded-3xl border border-border bg-muted p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Organizadores</p>
              <p className="mt-3 text-3xl font-semibold">0</p>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
