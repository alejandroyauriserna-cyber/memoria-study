"use client";

import Link from "next/link";
import { BookOpen, Gavel, Sparkles } from "lucide-react";

export function CompactDashboardHero() {
  return (
    <section className="ms-home-glass flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="ms-home-section-title">Asistente jurídico</p>
        <h2 className="mt-1 text-lg font-bold text-[#F5F7FA]">¿En qué quieres profundizar hoy?</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Consulta normas, casos o abre estudio guiado desde tu biblioteca.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/library"
          className="tron-btn-primary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
        >
          <BookOpen size={14} />
          Biblioteca
        </Link>
        <Link
          href="/fuentes-juridicas"
          className="tron-btn-secondary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
        >
          <Gavel size={14} />
          Fuentes
        </Link>
        <Link
          href="/upload-material"
          className="tron-btn-secondary inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold"
        >
          <Sparkles size={14} />
          Subir PDF
        </Link>
      </div>
    </section>
  );
}
