"use client";

import { useState } from "react";
import { BookOpen, Search, Sparkles } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import {
  DICTIONARY_EXAMPLES,
  DICTIONARY_FEATURED_PREVIEW,
  DICTIONARY_STARTER_HINTS,
} from "@/lib/cuaderno/dictionary-starter";
import type { CuadernoDictionaryResponse } from "@/types/cuaderno";

function DictionaryResult({ entry }: { entry: CuadernoDictionaryResponse }) {
  return (
    <article className="cn-dict-result space-y-4">
      <h3 className="cn-dict-result-term">{entry.term}</h3>
      {entry.sections.map((section) => (
        <div key={section.id}>
          <h4 className="cn-dict-result-section-title">{section.title}</h4>
          <p className="cn-dict-result-section-body whitespace-pre-wrap">{section.content}</p>
        </div>
      ))}
    </article>
  );
}

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
      <div className="cn-surface-panel cn-dict-panel p-8">
        <div className="flex items-center gap-3">
          <div className="cn-dict-icon">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="cn-hero-title text-2xl font-bold text-foreground">Diccionario Jurídico</h2>
            <p className="text-sm text-muted-foreground">
              Consulta conceptos clave del derecho peruano con fichas estructuradas para estudio.
            </p>
          </div>
        </div>

        <label className="mt-8 block">
          <span className="text-sm font-medium text-foreground/80">¿Qué significa?</span>
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
              className="cn-surface-input w-full py-3.5 pl-11 pr-4 text-sm"
            />
          </div>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {DICTIONARY_EXAMPLES.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => lookup(sample)}
              className="cn-surface-chip"
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
          {loading ? `Consultando… ${dictProgress.percent}%` : "Consultar con IA"}
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

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {entry ? (
        <DictionaryResult entry={entry} />
      ) : !loading ? (
        <div className="space-y-6">
          <div className="cn-dict-starter">
            <div className="cn-dict-starter-head">
              <Sparkles size={16} />
              <h3>Conceptos frecuentes en la carrera</h3>
            </div>
            <p className="cn-dict-starter-lead">
              Toca un concepto para generar una ficha completa con definición, ejemplo, relación con el curso y
              claves de examen.
            </p>
            <div className="cn-dict-starter-grid">
              {DICTIONARY_EXAMPLES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => lookup(sample)}
                  className="cn-dict-starter-card"
                >
                  <strong>{sample}</strong>
                  <span>{DICTIONARY_STARTER_HINTS[sample]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="cn-dict-preview">
            <p className="cn-dict-preview-kicker">Vista previa · ejemplo</p>
            <DictionaryResult entry={DICTIONARY_FEATURED_PREVIEW} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
