"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import * as pdfjs from "pdfjs-dist";
import { findPhraseInPageText } from "@/lib/guided-study/highlight-text";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

export function PdfJsViewer({
  fileUrl,
  pageNumber,
  zoom,
  searchQuery,
  highlightPhrase,
}: {
  fileUrl: string;
  pageNumber: number;
  zoom: number;
  searchQuery?: string;
  highlightPhrase?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError("");

    void (async () => {
      try {
        const task = pdfjs.getDocument({ url: fileUrl, withCredentials: false });
        const loaded = await task.promise;
        if (!cancelled) setDoc(loaded);
      } catch {
        if (!cancelled) setError("No se pudo cargar el PDF. Abre el archivo en una pestaña nueva.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  const renderPage = useCallback(async () => {
    if (!doc || !canvasRef.current) return;
    setRendering(true);

    try {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: zoom / 100 });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      const textContent = await page.getTextContent();
      const strings = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      if (textLayerRef.current) {
        const needle = highlightPhrase?.trim() || searchQuery?.trim() || "";
        const match = needle.length >= 3 ? findPhraseInPageText(strings, needle) : null;
        const found = match !== null;

        textLayerRef.current.innerHTML = "";
        const marker = document.createElement("div");
        marker.className = found ? "gs-pdf-text-hit" : "gs-pdf-text-miss";
        marker.textContent = found
          ? `Coincidencia encontrada en la página ${pageNumber}`
          : highlightPhrase?.trim() && needle.length >= 3
            ? "Este fragmento no aparece en el texto extraíble del PDF (puede ser escaneado o reformulado por la IA)."
            : needle.length >= 3
              ? `Busca «${needle.slice(0, 60)}» en el texto de la página`
              : "";
        if (marker.textContent) textLayerRef.current.appendChild(marker);
      }
    } catch {
      setError("Error al renderizar la página.");
    } finally {
      setRendering(false);
    }
  }, [doc, pageNumber, zoom, highlightPhrase, searchQuery]);

  useEffect(() => {
    void renderPage();
  }, [renderPage]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-accent hover:underline"
        >
          Abrir PDF original
        </a>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-auto p-2">
      {rendering ? (
        <p className="absolute left-3 top-3 z-10 rounded bg-card/90 px-2 py-1 text-[10px] text-accent shadow-sm backdrop-blur-sm">
          Renderizando…
        </p>
      ) : null}
      <div className="relative">
        <canvas ref={canvasRef} className="max-w-full rounded shadow-lg" />
        <div ref={textLayerRef} className="mt-2 w-full max-w-full" />
      </div>
    </div>
  );
}
