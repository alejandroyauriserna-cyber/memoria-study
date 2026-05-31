"use client";

import { useMemo, useState } from "react";
import { FileSearch, Loader2, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialCard } from "@/components/library/material-card";
import type { Material } from "@/types/material";

export function LibrarySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Material[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
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
      const response = await fetch(`/api/materials/search?q=${encodeURIComponent(trimmed)}&favorites=${favoritesOnly ? "1" : "0"}`);
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
    <section className="rounded-[32px] border border-border bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Buscador académico</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Encuentra apuntes, PDFs y resúmenes</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Busca por curso, título, tipo de material o descripción en toda la biblioteca colaborativa.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar materiales</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar curso, título, descripción o nombre de archivo"
            className="mt-2 h-14 w-full rounded-3xl border border-border bg-muted px-14 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </label>

        <Button type="submit" disabled={isLoading} className="h-14 w-full sm:w-auto">
          {isLoading ? <Loader2 className="animate-spin" size={16} /> : <FileSearch size={16} />}
          Buscar
        </Button>
      </form>

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-3xl border border-border bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
        <input
          type="checkbox"
          checked={favoritesOnly}
          onChange={(event) => setFavoritesOnly(event.target.checked)}
          className="h-4 w-4 accent-current"
        />
        <Star size={16} /> Solo favoritos
      </label>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

      {hasQuery ? (
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="rounded-3xl border border-border bg-muted p-6 text-sm text-muted-foreground">Buscando resultados...</div>
          ) : results.length === 0 ? (
            <div className="rounded-3xl border border-border bg-muted p-6 text-sm text-muted-foreground">No se encontraron materiales para esta búsqueda.</div>
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
