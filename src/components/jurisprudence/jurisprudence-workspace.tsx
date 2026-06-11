"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Gavel, Library, PlusCircle } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { JurisprudenceFilters } from "@/components/jurisprudence/jurisprudence-filters";
import { JurisprudenceResultCard } from "@/components/jurisprudence/jurisprudence-result-card";
import { JurisprudenceSearchBar } from "@/components/jurisprudence/jurisprudence-search-bar";
import { JurisprudenceContributePanel } from "@/components/jurisprudence/jurisprudence-contribute-panel";
import {
  JurisprudenceMyContributions,
} from "@/components/jurisprudence/jurisprudence-contributions-panel";
import {
  buildBibliotecaShareUrl,
  filterStateFromSearchParams,
  filterStateToSearchParams,
  type JurisprudenceFilterState,
} from "@/lib/jurisprudence/filters";
import {
  getJurisprudenceFavoriteIds,
  persistJurisprudenceFavorite,
  syncJurisprudenceFavoritesFromApi,
  toggleJurisprudenceFavorite,
} from "@/lib/jurisprudence/favorites-storage";
import { JURISPRUDENCE_SEARCH_EXAMPLES } from "@/lib/jurisprudence/labels";
import type { JurisprudenceRecord } from "@/types/jurisprudence";

type SearchResponse = {
  items: JurisprudenceRecord[];
  total: number;
  suggestions?: string[];
  filterOptions?: { organos: string[]; years: number[] };
  error?: string;
};

function buildSearchUrl(filters: JurisprudenceFilterState, query: string, suggest = false) {
  const params = new URLSearchParams();
  const searchFilters = filterStateToSearchParams(filters, query);

  if (searchFilters.query) params.set("q", searchFilters.query);
  if (searchFilters.materias?.length) params.set("materia", searchFilters.materias.join(","));
  if (searchFilters.tipos?.length) params.set("tipo", searchFilters.tipos.join(","));
  if (searchFilters.years?.length) params.set("year", searchFilters.years.join(","));
  if (searchFilters.organos?.length) params.set("organo", searchFilters.organos.join("|"));
  if (searchFilters.favoritesOnly) params.set("favorites", "1");
  if (suggest) params.set("suggest", "1");

  return `/api/jurisprudence/search?${params.toString()}`;
}

type AccessState = {
  authenticated: boolean;
  canContribute: boolean;
  isModerator: boolean;
  emailConfirmed?: boolean;
  denialMessage?: string | null;
  untDomains?: string[];
};

export function JurisprudenceWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUrl = useMemo(
    () => filterStateFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [query, setQuery] = useState(initialUrl.query);
  const [committedQuery, setCommittedQuery] = useState(initialUrl.query);
  const [filters, setFilters] = useState<JurisprudenceFilterState>(initialUrl.filters);
  const [highlightDocId, setHighlightDocId] = useState<string | null>(initialUrl.docId);
  const [items, setItems] = useState<JurisprudenceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [previewItems, setPreviewItems] = useState<JurisprudenceRecord[]>([]);
  const [organos, setOrganos] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [access, setAccess] = useState<AccessState>({
    authenticated: false,
    canContribute: false,
    isModerator: false,
  });
  const searchProgress = useLoadingProgress(isLoading, "search");
  const committedQueryRef = useRef(committedQuery);
  committedQueryRef.current = committedQuery;

  const syncShareUrl = useCallback(
    (term: string, nextFilters: JurisprudenceFilterState, docId?: string | null) => {
      const path = buildBibliotecaShareUrl(nextFilters, term, docId ?? highlightDocId);
      router.replace(path, { scroll: false });
    },
    [highlightDocId, router],
  );

  useEffect(() => {
    if (!highlightDocId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`doc-${highlightDocId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [highlightDocId, items]);

  useEffect(() => {
    setFavoriteIds(getJurisprudenceFavoriteIds());
    void syncJurisprudenceFavoritesFromApi().then(setFavoriteIds);
    void fetch("/api/jurisprudence/access")
      .then((res) => res.json())
      .then((payload: AccessState) => setAccess(payload))
      .catch(() => undefined);
  }, []);

  const runSearch = useCallback(
    async (term: string, nextFilters = filters, suggest = false) => {
      if (!suggest) {
        setIsLoading(true);
      }
      setError("");

      try {
        const response = await fetch(buildSearchUrl(nextFilters, term, suggest));
        const payload = (await response.json()) as SearchResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo completar la búsqueda.");
        }

        if (suggest) {
          setSuggestions(payload.suggestions ?? []);
          setPreviewItems(payload.items ?? []);
          return;
        }

        setItems(payload.items ?? []);
        setTotal(payload.total ?? 0);
        setSuggestions(payload.suggestions ?? []);
        setPreviewItems([]);
        setCommittedQuery(term);
        setHasSearched(Boolean(term.trim()));
        if (!suggest) {
          syncShareUrl(term, nextFilters);
        }

        if (payload.filterOptions) {
          setOrganos(payload.filterOptions.organos);
          setYears(payload.filterOptions.years);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Error de búsqueda.");
        if (!suggest) {
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!suggest) {
          setIsLoading(false);
        }
      }
    },
    [filters, syncShareUrl],
  );

  useEffect(() => {
    syncShareUrl(committedQueryRef.current, filters);
  }, [filters, syncShareUrl]);

  useEffect(() => {
    void runSearch(committedQueryRef.current, filters, false);
  }, [filters, runSearch]);

  const handleToggleSave = useCallback(async (id: string) => {
    const saved = toggleJurisprudenceFavorite(id);
    setFavoriteIds(getJurisprudenceFavoriteIds());
    await persistJurisprudenceFavorite(id, saved);

    if (filters.favoritesOnly) {
      void runSearch(committedQuery, filters, false);
    }
  }, [committedQuery, filters, runSearch]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const showEmptyBrowse = !hasSearched && !committedQuery && items.length > 0;

  return (
    <div className="bj-page">
      <header className="bj-hero">
        <div className="bj-hero__copy">
          <p className="ms-home-kicker">
            <BookOpen size={14} />
            Biblioteca Jurídica
          </p>
          <h1>Encuentra jurisprudencia en segundos</h1>
          <p className="ms-home-lead">
            Casaciones, sentencias, resoluciones y precedentes — sin perder tiempo en Google,
            LP Pasión por el Derecho o portales del Poder Judicial. Los aportes los revisan
            moderadores UNT antes de publicarse.
          </p>
          {access.canContribute ? (
            <button
              type="button"
              className="bj-hero__contribute"
              onClick={() => setContributeOpen(true)}
            >
              <PlusCircle size={16} />
              Aportar sentencia
            </button>
          ) : access.authenticated ? (
            <p className="bj-hero__access-note">{access.denialMessage}</p>
          ) : (
            <Link href="/auth" className="bj-hero__contribute">
              <PlusCircle size={16} />
              Inicia sesión con @unitru.edu.pe
            </Link>
          )}
        </div>

        <div className="bj-hero__stats">
          <div className="bj-hero__stat">
            <span className="bj-hero__stat-icon">
              <Gavel size={18} />
            </span>
            <span>
              <strong>{total || items.length}</strong>
              <em>Resoluciones</em>
            </span>
          </div>
          <div className="bj-hero__stat">
            <span className="bj-hero__stat-icon is-purple">
              <Library size={18} />
            </span>
            <span>
              <strong>{favoriteIds.length}</strong>
              <em>Guardadas</em>
            </span>
          </div>
        </div>

        <div className="bj-hero__search">
          <JurisprudenceSearchBar
            query={query}
            onQueryChange={setQuery}
            onSuggest={(term) => runSearch(term, filters, true)}
            onCommit={(term) => runSearch(term, filters, false)}
            suggestions={suggestions}
            previewItems={previewItems}
            isLoading={isLoading}
            hasSearched={hasSearched}
          />
        </div>
      </header>

      {access.canContribute ? (
        <JurisprudenceMyContributions
          onChanged={() => void runSearch(committedQueryRef.current, filters, false)}
        />
      ) : null}

      {access.isModerator ? (
        <Link href="/admin/biblioteca-juridica" className="bj-admin-banner">
          Panel de administración — moderar aportes y reportes
        </Link>
      ) : null}

      <div className="bj-layout">
        <JurisprudenceFilters
          filters={filters}
          onChange={setFilters}
          organos={organos}
          years={years}
          collapsed={filtersCollapsed}
          onToggleCollapse={() => setFiltersCollapsed((v) => !v)}
        />

        <section className="bj-results" aria-live="polite">
          {isLoading ? (
            <LoadingState
              active
              preset="search"
              percent={searchProgress.percent}
              message={searchProgress.message}
              stageLabel={searchProgress.stageLabel}
              className="bj-results__loading"
            />
          ) : null}

          {error ? <p className="bj-results__error">{error}</p> : null}

          {!isLoading && !error ? (
            <>
              <div className="bj-results__head">
                <p>
                  {committedQuery ? (
                    <>
                      <strong>{total}</strong> resultado{total === 1 ? "" : "s"} para{" "}
                      <em>&ldquo;{committedQuery}&rdquo;</em>
                    </>
                  ) : showEmptyBrowse ? (
                    <>
                      <strong>{total}</strong> resoluciones disponibles — usa el buscador o los filtros
                    </>
                  ) : (
                    <>Explora el catálogo curado de jurisprudencia peruana</>
                  )}
                </p>
              </div>

              {items.length === 0 ? (
                <div className="bj-empty">
                  <Gavel size={28} strokeWidth={1.5} />
                  <h2>Sin resultados</h2>
                  <p>Prueba con otro término o ajusta los filtros laterales.</p>
                  <div className="bj-empty__chips">
                    {JURISPRUDENCE_SEARCH_EXAMPLES.slice(0, 4).map((example) => (
                      <button
                        key={example}
                        type="button"
                        className="bj-empty__chip"
                        onClick={() => {
                          setQuery(example);
                          void runSearch(example, filters, false);
                        }}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  className="bj-results__grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.22 }}
                >
                  {items.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                    >
                      <JurisprudenceResultCard
                        record={record}
                        saved={favoriteSet.has(record.id)}
                        canReport={access.canContribute}
                        highlighted={highlightDocId === record.id}
                        onToggleSave={handleToggleSave}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          ) : null}
        </section>
      </div>

      <JurisprudenceContributePanel
        open={contributeOpen && access.canContribute}
        onClose={() => setContributeOpen(false)}
        onSubmitted={() => {
          void runSearch(committedQueryRef.current, filters, false);
        }}
      />
    </div>
  );
}
