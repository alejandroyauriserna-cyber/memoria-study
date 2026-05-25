"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Layers3,
  Scale,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { get } from "idb-keyval";
import { UploadGenerator } from "@/components/study/upload-generator";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

const stats = [
  { label: "Universidad", value: "UNT", icon: Scale },
  { label: "Modos de estudio", value: "5", icon: Layers3 },
  { label: "PDF + OCR", value: "Escaneado", icon: FileText },
  { label: "Organización", value: "Por semana", icon: Users },
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
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold text-accent">
              {UNT_DERECHO.university} · {UNT_DERECHO.career}
            </p>
            <h1 className="mt-4 max-w-2xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
              MemoriaStudy
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Convierte PDFs de tus cursos de Derecho en material de repaso en español:
              flashcards, definiciones, juego de pares, completar espacios y quiz por semana
              académica.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-semibold text-background hover:-translate-y-0.5 hover:bg-foreground/90"
              >
                Ir al panel <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:-translate-y-0.5 hover:bg-muted"
              >
                Ingresar
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-5 shadow-sm"
              >
                <stat.icon className="text-accent" size={21} />
                <p className="mt-8 text-3xl font-semibold tracking-tight">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <UploadGenerator />
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Tutor sobre tu PDF</h2>
          <p className="mt-2 text-muted-foreground">
            Haz preguntas jurídicas sobre el documento que acabas de procesar (en español).
          </p>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Explica la diferencia entre vigencia y eficacia de una norma..."
            className="mt-5 min-h-[140px] w-full rounded-xl border border-border bg-background p-4 outline-none focus:border-accent"
          />
          <button
            onClick={askPdf}
            disabled={loading}
            className="mt-4 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Analizando..." : "Preguntar al tutor"}
          </button>
          {answer ? (
            <div className="mt-6 rounded-xl border border-border bg-background p-5">
              <p className="whitespace-pre-wrap leading-7">{answer}</p>
            </div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
