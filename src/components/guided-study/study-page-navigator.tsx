"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";

export function StudyPageNavigator({
  currentPage,
  totalPages,
  loading,
  loadingPercent,
  onPageChange,
  onGenerate,
  onExplainChapter,
  showExplainChapter,
  pageUnderstood,
}: {
  currentPage: number;
  totalPages: number;
  loading?: boolean;
  loadingPercent?: number;
  onPageChange: (page: number) => void;
  onGenerate: () => void;
  onExplainChapter?: () => void;
  showExplainChapter?: boolean;
  pageUnderstood?: boolean;
}) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  function goPrev() {
    if (currentPage > 1) onPageChange(currentPage - 1);
  }

  function goNext() {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  }

  function commitPageInput() {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(currentPage));
      return;
    }
    const next = Math.min(Math.max(1, parsed), totalPages);
    setPageInput(String(next));
    if (next !== currentPage) onPageChange(next);
  }

  return (
    <div className="gs-page-nav shrink-0 rounded-xl border border-border bg-card px-3 py-2">
      <div className="gs-page-nav-inner">
        <div className="gs-page-nav-pager">
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage <= 1}
            className="gs-page-nav-btn shrink-0"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="gs-page-nav-center shrink-0">
            <label className="sr-only" htmlFor="study-page-input">
              Número de página
            </label>
            <input
              id="study-page-input"
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitPageInput();
                }
              }}
              className="gs-page-nav-input"
            />
            <span className="whitespace-nowrap text-sm text-muted-foreground">/ {totalPages}</span>
            {pageUnderstood ? (
              <span className="gs-page-nav-understood" title="Página comprendida">
                ✓
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={currentPage >= totalPages}
            className="gs-page-nav-btn shrink-0"
            aria-label="Página siguiente"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight size={18} />
          </button>
        </div>

        <div
          className={`gs-page-nav-actions${showExplainChapter && onExplainChapter ? "" : " gs-page-nav-actions--solo"}`}
        >
          <button
            type="button"
            onClick={onGenerate}
            disabled={loading}
            className="gs-page-nav-generate"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin shrink-0" />
                <span className="truncate">
                  Explicando {loadingPercent != null ? `${loadingPercent}%` : ""}
                </span>
              </>
            ) : (
              <>
                <Sparkles size={15} className="shrink-0" />
                <span>Explicar página</span>
              </>
            )}
          </button>
          {showExplainChapter && onExplainChapter ? (
            <button
              type="button"
              onClick={onExplainChapter}
              disabled={loading}
              className="gs-page-nav-chapter"
            >
              <Sparkles size={14} className="shrink-0" />
              <span>Explicar capítulo</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
