"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import {
  JURISPRUDENCE_SEARCH_EXAMPLES,
  JURISPRUDENCE_SEARCH_PLACEHOLDER,
} from "@/lib/jurisprudence/labels";
import type { JurisprudenceRecord } from "@/types/jurisprudence";

const DEBOUNCE_MS = 280;

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  onSuggest: (term: string) => void;
  onCommit: (term: string) => void;
  suggestions: string[];
  previewItems: JurisprudenceRecord[];
  isLoading: boolean;
  hasSearched: boolean;
};

export const JurisprudenceSearchBar = forwardRef<HTMLInputElement, Props>(function JurisprudenceSearchBar(
  {
    query,
    onQueryChange,
    onSuggest,
    onCommit,
    suggestions,
    previewItems,
    isLoading,
    hasSearched,
  },
  forwardedRef,
) {
  const [open, setOpen] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | null>(null);

  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      localInputRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const trimmed = query.trim();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setExampleIndex((i) => (i + 1) % JURISPRUDENCE_SEARCH_EXAMPLES.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      onQueryChange(value);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setOpen(false);
        onCommit("");
        return;
      }
      setOpen(true);
      debounceRef.current = window.setTimeout(() => {
        onSuggest(value);
      }, DEBOUNCE_MS);
    },
    [onCommit, onQueryChange, onSuggest],
  );

  const commitSearch = (term: string) => {
    onQueryChange(term);
    onCommit(term);
    setOpen(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmed) commitSearch(trimmed);
  };

  return (
    <div className="bj-search" ref={containerRef}>
      <form className="bj-search__form" onSubmit={handleSubmit}>
        <div className="bj-search__icon">
          <Search size={20} strokeWidth={1.75} />
        </div>
        <input
          ref={setInputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => trimmed && setOpen(true)}
          placeholder={JURISPRUDENCE_SEARCH_PLACEHOLDER}
          className="bj-search__input"
          aria-label="Buscar jurisprudencia"
          autoComplete="off"
        />
        <button type="submit" className="bj-search__submit" disabled={!trimmed || isLoading}>
          {isLoading ? "Buscando…" : "Buscar"}
          <ArrowRight size={16} />
        </button>
      </form>

      {!hasSearched && !trimmed ? (
        <div className="bj-search__examples" aria-live="polite">
          <Sparkles size={14} />
          <span>Prueba:</span>
          <button
            type="button"
            className="bj-search__example"
            onClick={() => commitSearch(JURISPRUDENCE_SEARCH_EXAMPLES[exampleIndex])}
          >
            {JURISPRUDENCE_SEARCH_EXAMPLES[exampleIndex]}
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {open && (suggestions.length > 0 || previewItems.length > 0) ? (
          <motion.div
            className="bj-search__dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            {suggestions.length > 0 ? (
              <div className="bj-search__suggestions">
                <p className="bj-search__dropdown-label">Sugerencias</p>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="bj-search__suggestion"
                    onClick={() => commitSearch(suggestion)}
                  >
                    <Search size={14} />
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
            {previewItems.length > 0 ? (
              <div className="bj-search__preview">
                <p className="bj-search__dropdown-label">Resultados rápidos</p>
                {previewItems.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="bj-search__preview-item"
                    onClick={() => commitSearch(item.title)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.submateria}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
});
