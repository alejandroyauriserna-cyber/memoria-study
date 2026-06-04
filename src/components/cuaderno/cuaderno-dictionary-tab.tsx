"use client";

import { useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import type { CuadernoDictionaryResponse } from "@/types/cuaderno";

const EXAMPLES = [
  "Exhorto",
  "Acto jurídico",
  "Negocio jurídico",
  "Antijuridicidad",
  "Compensación",
  "Casación",
];

export function CuadernoDictionaryTab() {
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<CuadernoDictionaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dictProgress = useLoadingProgress(loading, "dictionary");

  async function lookup(query: string) {
    const q = query.trim();
    if (!q) return;
    setTerm(q);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cuaderno/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: q }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Error en diccionario");
      setEntry(payload.entry as CuadernoDictionaryResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error");
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#12181f] to-[#0a0e14] p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00FFD5]/15 text-[#00FFD5]">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="cn-hero-title text-2xl font-bold text-[#F5F7FA]">Diccionario Jurídico</h2>
            <p className="text-sm text-muted-foreground">Sin necesidad de PDF ni apunte abierto.</p>
          </div>
        </div>

        <label className="mt-8 block">
          <span className="text-sm font-medium text-[#F5F7FA]/80">¿Qué significa?</span>
          <div className="relative mt-2">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup(term)}
              placeholder="Ej.: Exhorto, acto jurídico…"
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3.5 pl-11 pr-4 text-sm text-[#F5F7FA] outline-none focus:border-[#00FFD5]/40"
            />
          </div>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => lookup(sample)}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-[#00FFD5]/30 hover:text-[#00FFD5]"
            >
              {sample}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={loading || !term.trim()}
          onClick={() => lookup(term)}
          className="tron-btn-primary mt-6 w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
        >
          {loading ? `Consultando… ${dictProgress.percent}%` : "Consultar"}
        </button>
      </div>

      {loading ? (
        <LoadingState
          active
          preset="dictionary"
          percent={dictProgress.percent}
          message={dictProgress.message}
          stageLabel={dictProgress.stageLabel}
        />
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {entry ? (
        <article className="space-y-4 rounded-2xl border border-[#00FFD5]/20 bg-[#00FFD5]/5 p-6">
          <h3 className="text-xl font-bold text-[#00FFD5]">{entry.term}</h3>
          {entry.sections.map((section) => (
            <div key={section.id}>
              <h4 className="text-sm font-semibold text-[#F5F7FA]">{section.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {section.content}
              </p>
            </div>
          ))}
        </article>
      ) : null}
    </section>
  );
}
