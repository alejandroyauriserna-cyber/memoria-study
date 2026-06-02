"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Layers3, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/ui/shell";
import { TronTutorChat } from "@/components/study/tron-tutor-chat";
import { UploadGenerator } from "@/components/study/upload-generator";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

const highlights = [
  { label: "Red de conocimiento", description: "Organizadores holográficos con IA." },
  { label: "Biblioteca futurista", description: "Materiales en cápsulas interactivas." },
  { label: "Estudio inmersivo", description: "Flashcards 3D y mapas Tron." },
];

export default function Home() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 28, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="tron-panel relative overflow-hidden rounded-2xl p-10 md:p-14"
          >
            <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-[rgba(0,255,213,0.1)] blur-3xl" />
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,255,213,0.25)] bg-[rgba(0,255,213,0.08)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">
              <Zap size={14} />
              {UNT_DERECHO.career} · 2030
            </span>
            <h1 className="mt-8 text-5xl font-bold tracking-tight text-[#F5F7FA] sm:text-6xl">
              Estudia como si vivieras en{" "}
              <span className="tron-glow-text">Tron Legacy</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              MemoriaStudy transforma tus apuntes en una plataforma de IA futurista: mapas luminosos,
              flashcards premium y tutor inteligente.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="tron-btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold"
              >
                Ir al panel <ArrowRight size={16} />
              </Link>
              <Link
                href="/library"
                className="tron-btn-secondary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold"
              >
                Explorar Biblioteca
              </Link>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid gap-4"
          >
            <div className="tron-panel rounded-2xl p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Experiencia</p>
              <h2 className="mt-4 text-2xl font-bold text-[#F5F7FA]">IA cinematográfica para Derecho</h2>
              <div className="mt-6 grid gap-3">
                {highlights.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] p-4"
                  >
                    <p className="text-sm font-semibold text-[#F5F7FA]">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <TronTutorChat />
          <div className="tron-panel rounded-2xl p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">Generador</p>
                <h3 className="mt-3 text-2xl font-bold text-[#F5F7FA]">PDF → Organizador IA</h3>
              </div>
              <Layers3 className="h-10 w-10 text-[#00FFD5]" />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Sube un documento y la IA construye mapas conceptuales, flashcards y resúmenes en segundos.
            </p>
            <div className="mt-6">
              <UploadGenerator />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="tron-panel rounded-2xl p-8 md:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#00FFD5]">
                <Sparkles size={16} />
                Plataforma premium
              </p>
              <h2 className="mt-2 text-3xl font-bold text-[#F5F7FA]">Tu centro de comando de estudio</h2>
            </div>
            <Link href="/organizers" className="tron-btn-primary inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold">
              Ver organizadores
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
