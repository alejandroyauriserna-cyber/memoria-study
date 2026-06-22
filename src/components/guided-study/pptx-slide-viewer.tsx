"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PptxSlideViewerProps = {
  fileUrl: string;
  pageNumber: number;
  zoom: number;
  fallbackText?: string;
};

function layoutCanvas(canvas: HTMLCanvasElement, container: HTMLElement, zoom: number) {
  const pad = 16;
  const availableW = Math.max(320, container.clientWidth - pad * 2);
  const availableH = Math.max(220, container.clientHeight - pad * 2);
  const zoomFactor = Math.max(0.5, zoom / 100);
  const cssW = Math.floor(availableW * zoomFactor);
  const cssH = Math.floor(availableH * zoomFactor);
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.max(1, Math.floor(cssW * dpr));
  canvas.height = Math.max(1, Math.floor(cssH * dpr));
}

export function PptxSlideViewer({
  fileUrl,
  pageNumber,
  zoom,
  fallbackText,
}: PptxSlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<InstanceType<typeof import("pptxviewjs").PPTXViewer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [useTextFallback, setUseTextFallback] = useState(false);
  const [containerVersion, setContainerVersion] = useState(0);

  const renderCurrentSlide = useCallback(async () => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!viewer || !canvas || !container) return;

    layoutCanvas(canvas, container, zoom);
    const slideIndex = Math.max(0, pageNumber - 1);
    await viewer.renderSlide(slideIndex, canvas);
  }, [pageNumber, zoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || useTextFallback) return;

    const observer = new ResizeObserver(() => {
      setContainerVersion((value) => value + 1);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [useTextFallback]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    async function init() {
      const activeCanvas = canvas;
      const activeContainer = container;
      if (!activeCanvas || !activeContainer) return;

      setLoading(true);
      setUseTextFallback(false);

      try {
        const { PPTXViewer } = await import("pptxviewjs");
        if (cancelled) return;

        const viewer = new PPTXViewer({
          canvas: activeCanvas,
          slideSizeMode: "fit",
          backgroundColor: "#ffffff",
        });
        viewerRef.current = viewer;

        const response = await fetch(fileUrl, { credentials: "include", cache: "force-cache" });
        if (!response.ok) {
          throw new Error(`No se pudo cargar la presentación (HTTP ${response.status}).`);
        }

        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        await viewer.loadFile(buffer);
        if (cancelled) return;

        layoutCanvas(activeCanvas, activeContainer, zoom);
        const slideIndex = Math.max(0, pageNumber - 1);
        await viewer.renderSlide(slideIndex, activeCanvas);
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setUseTextFallback(true);
          setLoading(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || loading || useTextFallback) return;

    let cancelled = false;
    setRendering(true);

    void renderCurrentSlide()
      .catch(() => {
        if (!cancelled) setUseTextFallback(true);
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pageNumber, zoom, loading, useTextFallback, containerVersion, renderCurrentSlide]);

  if (useTextFallback) {
    return (
      <div className="h-full overflow-auto px-4 py-5">
        <p className="mb-3 text-xs text-muted-foreground">
          No se pudo dibujar la diapositiva. Mostrando el texto extraído.
        </p>
        {fallbackText?.trim() ? (
          <p className="whitespace-pre-wrap leading-relaxed text-foreground">{fallbackText}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta diapositiva no tiene texto extraíble.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[280px] w-full overflow-auto bg-[#f4f4f5] dark:bg-[#0f1720]"
    >
      {loading ? (
        <p className="absolute left-3 top-3 z-10 rounded bg-card/90 px-2 py-1 text-[10px] text-accent shadow-sm backdrop-blur-sm">
          Cargando presentación…
        </p>
      ) : null}
      {rendering ? (
        <p className="absolute left-3 top-3 z-10 rounded bg-card/90 px-2 py-1 text-[10px] text-accent shadow-sm backdrop-blur-sm">
          Renderizando diapositiva…
        </p>
      ) : null}
      <div className="flex min-h-full w-full items-center justify-center p-4">
        <canvas ref={canvasRef} className="block rounded-lg shadow-lg" />
      </div>
    </div>
  );
}
