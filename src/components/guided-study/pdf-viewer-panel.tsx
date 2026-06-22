"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { PdfJsViewer } from "@/components/guided-study/pdf-js-viewer";

export type PdfConceptFocus = {
  label: string;
  locatePhrase: string | null;
};

export function PdfViewerPanel({
  fileUrl,
  pageNumber,
  totalPages,
  conceptFocus,
  onPageChange,
  documentKind = "pdf",
  slideText,
}: {
  fileUrl: string;
  pageNumber: number;
  totalPages: number;
  conceptFocus?: PdfConceptFocus | null;
  onPageChange: (page: number) => void;
  documentKind?: "pdf" | "pptx";
  slideText?: string;
}) {
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goPrev = useCallback(() => {
    if (pageNumber > 1) onPageChange(pageNumber - 1);
  }, [pageNumber, onPageChange]);

  const goNext = useCallback(() => {
    if (pageNumber < totalPages) onPageChange(pageNumber + 1);
  }, [pageNumber, totalPages, onPageChange]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext]);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      void document.exitFullscreen();
      setFullscreen(false);
    }
  }

  const isPptx = documentKind === "pptx";
  const pageLabel = isPptx ? "Diapositiva" : "Página";
  const displayText = slideText?.trim() ?? "";
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredSlideText =
    isPptx && normalizedSearch && displayText
      ? displayText
          .split("\n")
          .filter((line) => line.toLowerCase().includes(normalizedSearch))
          .join("\n") || displayText
      : displayText;

  return (
    <div
      ref={containerRef}
      className="gs-panel-shell flex h-full min-h-0 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNumber <= 1}
            className="rounded-lg p-2 text-accent hover:bg-accent-soft disabled:opacity-30"
            aria-label={`${pageLabel} anterior`}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[5rem] text-center text-sm font-semibold text-foreground">
            {pageNumber} / {totalPages}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={pageNumber >= totalPages}
            className="rounded-lg p-2 text-accent hover:bg-accent-soft disabled:opacity-30"
            aria-label={`${pageLabel} siguiente`}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="rounded-lg p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            aria-label="Reducir zoom"
          >
            <ZoomOut size={16} />
          </button>
          <span className="w-12 text-center text-xs text-muted-foreground">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="rounded-lg p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            aria-label="Aumentar zoom"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        <div className="relative min-w-[6rem] flex-1">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isPptx ? "Buscar en la diapositiva" : "Buscar en la página (opcional)"}
            className="h-8 w-full rounded-lg border border-border bg-muted pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-lg p-2 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          aria-label="Pantalla completa"
        >
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div className="gs-pdf-viewer-canvas relative min-h-0 flex-1 bg-surface-strong">
        {conceptFocus ? (
          <div className="gs-pdf-highlight-bar">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
              {conceptFocus.locatePhrase
                ? isPptx
                  ? "Concepto en la diapositiva"
                  : "Concepto en el PDF"
                : "Concepto seleccionado"}
            </span>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-foreground">
              {conceptFocus.label}
            </p>
            {!conceptFocus.locatePhrase ? (
              <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
                Este concepto no tiene texto localizable en el documento (explicación reformulada por el
                profesor IA).
              </p>
            ) : null}
          </div>
        ) : null}
        {isPptx ? (
          <div
            className="h-full overflow-auto px-4 py-5"
            style={{ fontSize: `${zoom}%` }}
          >
            {filteredSlideText ? (
              <p className="whitespace-pre-wrap leading-relaxed text-foreground">{filteredSlideText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta diapositiva no tiene texto extraíble (puede ser solo imágenes).
              </p>
            )}
          </div>
        ) : (
          <PdfJsViewer
            fileUrl={fileUrl}
            pageNumber={pageNumber}
            zoom={zoom}
            searchQuery={searchQuery}
            locatePhrase={conceptFocus?.locatePhrase ?? null}
          />
        )}
      </div>
    </div>
  );
}
