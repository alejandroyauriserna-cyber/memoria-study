"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  Gavel,
  GraduationCap,
  Network,
  Scale,
  Send,
  Sparkles,
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { get } from "idb-keyval";

const QUICK_ACTIONS = [
  { href: "/upload-material", label: "Subir PDF", icon: FileText },
  { href: "/cuaderno", label: "Analizar caso", icon: Scale, query: "Analiza el siguiente caso jurídico: " },
  { href: "/upload-material", label: "Preparar examen", icon: GraduationCap },
  { href: "/upload-material", label: "Crear resumen", icon: BookOpen },
  { href: "/organizers", label: "Organizador visual", icon: Network },
] as const;

export function LegalAiHero() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const queryProgress = useLoadingProgress(loading, "aiGenerate");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    try {
      setLoading(true);
      setError("");
      setAnswer("");

      const pdfText = await get<string>("pdfText");
      const endpoint = pdfText ? "/api/chat" : "/api/legal-assistant";
      const body = pdfText ? { pdfText, question: trimmed } : { question: trimmed };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo consultar al asistente.");
      }
      setAnswer(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al consultar");
    } finally {
      setLoading(false);
    }
  }

  function applyQuickPrompt(prefix: string) {
    setQuestion((prev) => (prev.trim() ? prev : prefix));
    const el = document.getElementById("ms-legal-prompt");
    el?.focus();
  }

  return (
    <section
      id="asistente"
      className="ms-home-hero relative overflow-hidden px-5 py-10 md:px-10 md:py-14 scroll-mt-24"
    >
      <Scale className="ms-home-legal-watermark hidden md:block" size={160} strokeWidth={0.75} />
      <div className="relative z-[1] mx-auto max-w-3xl text-center">
        <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          <Sparkles size={14} />
          Asistente jurídico UNT
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          ¿Qué deseas estudiar hoy?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
          Tu asistente jurídico universitario para cursos, casos, jurisprudencia y exámenes.
        </p>
      </div>

      <form onSubmit={onSubmit} className="relative z-[1] mx-auto mt-8 max-w-3xl">
        <label htmlFor="ms-legal-prompt" className="sr-only">
          Pregunta al asistente jurídico
        </label>
        <textarea
          id="ms-legal-prompt"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          className="ms-home-prompt w-full"
          placeholder={
            "Pregunta un concepto jurídico\nAnaliza un caso\nResume un PDF\nPrepárame para un examen"
          }
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Con PDF procesado, las respuestas usan el contexto de tu documento.
          </p>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="tron-btn-primary inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold disabled:opacity-50"
          >
            {loading ? <Send size={16} /> : <Send size={16} />}
            {loading ? `Analizando… ${queryProgress.percent}%` : "Consultar IA"}
          </button>
        </div>
      </form>

      {loading ? (
        <LoadingState
          active
          preset="aiGenerate"
          percent={queryProgress.percent}
          message={queryProgress.message}
          stageLabel={queryProgress.stageLabel}
          className="relative z-[1] mx-auto mt-6 max-w-3xl"
        />
      ) : null}

      <div className="relative z-[1] mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          if ("query" in action && action.query) {
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => applyQuickPrompt(action.query)}
                className="ms-home-chip"
              >
                <Icon size={15} className="text-accent" />
                {action.label}
              </button>
            );
          }
          return (
            <Link key={action.label} href={action.href} className="ms-home-chip">
              <Icon size={15} className="text-accent" />
              {action.label}
            </Link>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-[1] mx-auto mt-6 max-w-3xl text-center text-sm text-[#FF8A00]"
          >
            {error}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => router.push("/upload-material")}
            >
              Subir PDF
            </button>
          </motion.p>
        ) : null}
        {answer ? (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-[1] mx-auto mt-8 max-w-3xl"
          >
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-accent">
              <Gavel size={14} />
              Respuesta jurídica
            </div>
            <div className="ms-home-answer whitespace-pre-wrap">{answer}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
