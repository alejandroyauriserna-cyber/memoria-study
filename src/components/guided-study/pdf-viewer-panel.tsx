"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Maximize2,
  Minimize2,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { HighlightLegend, PageTextHighlighter } from "@/components/guided-study/page-text-highlighter";
import type { TextHighlight } from "@/types/guided-legal-study";
import "./guided-study.css";

export function PdfViewerPanel({
  fileUrl,
  pageNumber,
  totalPages,
  pageText,
  highlights,
  examOnly,
  activeHighlightId,
  onPageChange,
  onHighlightClick,
}: {
  fileUrl: string;
  pageNumber: number;
  totalPages: number;
  pageText?: string;
  highlights?: TextHighlight[];
  examOnly?: boolean;
  activeHighlightId?: string | null;
  onPageChange: (page: number) => void;
  onHighlightClick?: (highlightId: string) => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const pdfUrl = `${fileUrl}#page=${pageNumber}&zoom=${zoom}`;

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

  const visibleHighlights = highlights ?? [];

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.6)]"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(0,255,213,0.1)] px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={pageNumber <= 1}
            className="rounded-lg p-2 text-[#00FFD5] hover:bg-[rgba(0,255,213,0.08)] disabled:opacity-30"
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[5rem] text-center text-sm font-semibold text-[#F5F7FA]">
            {pageNumber} / {totalPages}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={pageNumber >= totalPages}
            className="rounded-lg p-2 text-[#00FFD5] hover:bg-[rgba(0,255,213,0.08)] disabled:opacity-30"
            aria-label="Página siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 10))} className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-white" aria-label="Reducir zoom">
            <ZoomOut size={16} />
          </button>
          <span className="w-12 text-center text-xs text-muted-foreground">{zoom}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(200, z + 10))} className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-white" aria-label="Aumentar zoom">
            <ZoomIn size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowHighlights((v) => !v)}
          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
            showHighlights
              ? "bg-[rgba(0,255,213,0.12)] text-[#00FFD5]"
              : "text-muted-foreground hover:bg-white/5"
          }`}
        >
          <Highlighter size={14} />
          Resaltado IA
        </button>

        <div className="relative min-w-[6rem] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar (Ctrl+F en PDF)"
            className="h-9 w-full rounded-lg border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] pl-8 pr-3 text-xs text-[#F5F7FA] placeholder:text-muted-foreground"
          />
        </div>

        <button type="button" onClick={toggleFullscreen} className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-white" aria-label="Pantalla completa">
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0a1419]">
        <iframe
          key={`${pdfUrl}-${pageNumber}`}
          src={pdfUrl}
          title="Visor PDF"
          className="h-full w-full border-0"
          style={{
            height: showHighlights && pageText ? "58%" : "100%",
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        />
      </div>

      {showHighlights && pageText ? (
        <div className="shrink-0 border-t border-[rgba(0,255,213,0.1)]">
          <HighlightLegend compact />
          <PageTextHighlighter
            pageText={pageText}
            highlights={visibleHighlights}
            examOnly={examOnly}
            activeHighlightId={activeHighlightId}
            onHighlightClick={onHighlightClick}
          />
        </div>
      ) : null}
    </div>
  );
}
