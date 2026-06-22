"use client";

import { useEffect, useRef, useState } from "react";

type PptxSlideViewerProps = {
  fileUrl: string;
  pageNumber: number;
  zoom: number;
  fallbackText?: string;
};

export function PptxSlideViewer({
  fileUrl,
  pageNumber,
  zoom,
  fallbackText,
}: PptxSlideViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<InstanceType<typeof import("pptxviewjs").PPTXViewer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [useTextFallback, setUseTextFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    async function init() {
      setLoading(true);
      setUseTextFallback(false);

      try {
        const { PPTXViewer } = await import("pptxviewjs");
        if (cancelled) return;

        const viewer = new PPTXViewer({
          canvas,
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

        const slideIndex = Math.max(0, pageNumber - 1);
        await viewer.renderSlide(slideIndex, canvas, { scale: zoom / 100 });
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
    // pageNumber/zoom handled in separate effect after load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !canvas || loading || useTextFallback) return;

    let cancelled = false;
    setRendering(true);

    const slideIndex = Math.max(0, pageNumber - 1);
    void viewer
      .renderSlide(slideIndex, canvas, { scale: zoom / 100 })
      .catch(() => {
        if (!cancelled) setUseTextFallback(true);
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pageNumber, zoom, loading, useTextFallback]);

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
    <div className="relative flex h-full w-full items-center justify-center overflow-auto bg-[#f4f4f5] p-3 dark:bg-[#0f1720]">
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
      <canvas ref={canvasRef} className="max-h-full max-w-full rounded-lg shadow-lg" />
    </div>
  );
}
