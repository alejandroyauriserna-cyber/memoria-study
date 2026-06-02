"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, FileText, Loader2, Search, Sparkles, Star } from "lucide-react";
import { MaterialCard } from "@/components/library/material-card";
import type { Material } from "@/types/material";
import type { SearchSuggestion } from "@/lib/search/score";

const DEBOUNCE_MS = 280;

export function LibrarySearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<Material[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  const fetchSuggestions = useCallback(
    async (term: string, favorites: boolean) => {
      if (!term) {
        setSuggestions([]);
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/materials/search?q=${encodeURIComponent(term)}&suggest=1&favorites=${favorites ? "1" : "0"}&limit=10`,
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudieron cargar sugerencias.");
        }

        setSuggestions(payload.suggestions ?? []);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Error buscando materiales.");
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchFullResults = useCallback(async (term: string, favorites: boolean) => {
    if (!term) return;
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/materials/search?q=${encodeURIComponent(term)}&favorites=${favorites ? "1" : "0"}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudieron cargar los resultados.");
      }
      setResults(payload.materials ?? []);
      setCommittedQuery(term);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error buscando materiales.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    setOpen(true);
    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(trimmed, favoritesOnly);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [trimmed, favoritesOnly, fetchSuggestions]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectSuggestion = useCallback(
    (item: SearchSuggestion) => {
      setOpen(false);
      setQuery(item.title);
      if (item.kind === "material") {
        window.location.href = item.href;
      } else {
        window.location.href = item.href;
      }
    },
    [],
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!open || !suggestions.length) {
      if (event.key === "Enter" && trimmed) {
        event.preventDefault();
        fetchFullResults(trimmed, favoritesOnly);
        setOpen(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = suggestions[activeIndex >= 0 ? activeIndex : 0];
      if (item) selectSuggestion(item);
    }
  }

  const showDropdown = open && hasQuery;

  return (
    <section className={compact ? "" : "ms-panel p-8"}>
      {!compact ? (
      <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00FFD5]">Buscador académico</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#F5F7FA]">Encuentra materiales al instante</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Escribe y obtén sugerencias en tiempo real: títulos, PDFs, cursos y organizadores generados.
          </p>
      </div>
      ) : null}

      <div ref={containerRef} className={compact ? "relative" : "relative mt-6"}>
        <label className="relative block">
          <span className="sr-only">Buscar materiales</span>
          <Search className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#00FFD5] ${compact ? "left-3 h-4 w-4" : "left-4 h-5 w-5"}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(-1);
            }}
            onFocus={() => hasQuery && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Buscar título, PDF, curso..."
            className={`w-full rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(7,19,26,0.6)] pr-12 text-sm text-[#F5F7FA] outline-none focus:border-[rgba(0,255,213,0.45)] focus:shadow-[0_0_24px_rgba(0,255,213,0.12)] ${
              compact ? "h-11 pl-10" : "h-14 pl-14"
            }`}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="search-suggestions"
          />
          {isLoading ? (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[#00FFD5]" />
          ) : null}
        </label>

        <AnimatePresence>
          {showDropdown ? (
            <motion.div
              id="search-suggestions"
              role="listbox"
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.92)] shadow-[0_0_40px_rgba(0,255,213,0.12),0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            >
              {suggestions.length === 0 && !isLoading ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Sin coincidencias para «{trimmed}»</p>
              ) : (
                <ul className="max-h-[min(420px,50vh)] overflow-y-auto py-2">
                  {suggestions.map((item, index) => (
                    <li key={`${item.kind}-${item.id}`} role="option" aria-selected={index === activeIndex}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => selectSuggestion(item)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                          index === activeIndex
                            ? "bg-[rgba(0,255,213,0.1)] shadow-[inset_0_0_24px_rgba(0,255,213,0.06)]"
                            : "hover:bg-[rgba(0,255,213,0.06)]"
                        }`}
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] bg-[rgba(0,255,213,0.06)]">
                          {item.kind === "organizer" ? (
                            <Brain size={16} className="text-[#00FFD5]" />
                          ) : (
                            <FileText size={16} className="text-[#00BFFF]" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[#F5F7FA]">{item.title}</span>
                            {item.hasOrganizer ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(0,255,213,0.25)] bg-[rgba(0,255,213,0.08)] px-2 py-0.5 text-[10px] font-semibold text-[#00FFD5]">
                                <Sparkles size={10} /> Organizador IA
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-[#00FFD5]/70">{item.meta}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-[rgba(0,255,213,0.1)] px-4 py-2 text-[10px] text-muted-foreground">
                ↑ ↓ navegar · Enter abrir · Esc cerrar
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[rgba(0,255,213,0.15)] bg-[rgba(0,255,213,0.06)] px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:text-[#00FFD5]">
        <input
          type="checkbox"
          checked={favoritesOnly}
          onChange={(event) => setFavoritesOnly(event.target.checked)}
          className="h-4 w-4 accent-[#00FFD5]"
        />
        <Star size={16} /> Solo favoritos
      </label>

      {error ? <p className="mt-4 text-sm text-[#FF8A00]">{error}</p> : null}

      {committedQuery && results.length > 0 ? (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            {results.length} resultado{results.length === 1 ? "" : "s"} para «{committedQuery}»
          </p>
          <div className="grid gap-4">
            {results.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
