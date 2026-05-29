"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search, FileSearch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialCard } from "@/components/library/material-card";
import type { Material } from "@/types/material";

export function LibrarySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/materials/search?q=${encodeURIComponent(trimmed)}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudieron cargar los resultados.");
      }

      setResults(payload.materials ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error buscando materiales.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">Buscador académico</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Encuentra apuntes, PDFs y resúmenes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Busca por curso, título, tipo de material o descripción en toda la biblioteca.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar materiales</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cursos, apuntes, resúmenes o PDFs"
            className="mt-2 h-12 w-full rounded-lg border border-border bg-background px-12 text-sm outline-none focus:border-accent"
          />
        </label>

        <Button type="submit" disabled={isLoading} className="h-12 w-full sm:w-auto">
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : <FileSearch size={16} />}
          Buscar
        </Button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

      {hasQuery ? (
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="rounded-2xl border border-border bg-muted p-5 text-sm text-muted-foreground">Buscando resultados...</div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-border bg-muted p-5 text-sm text-muted-foreground">No se encontraron materiales para esta búsqueda.</div>
          ) : (
            <div className="grid gap-4">
              {results.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
