"use client";

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { CuadernoPageSizeMode } from "@/lib/cuaderno/page-size";
import { targetShellWidthFraction } from "@/lib/cuaderno/page-size";

const MIN_ZOOM = 0.85;
const MAX_ZOOM = 1.35;

/**
 * Ajusta el zoom para que la hoja ocupe ~90% del ancho del viewport (auto-fit al abrir/cambiar página).
 * Desactivar en editor inmersivo: la hoja debe iniciar al 100% centrada.
 */
export function useCuadernoPaperFit(
  viewportRef: RefObject<HTMLElement | null>,
  shellRef: RefObject<HTMLElement | null>,
  pageSizeMode: CuadernoPageSizeMode,
  resetKey: string,
  enabled = true,
) {
  const [zoom, setZoom] = useState(1);
  const rafRef = useRef<number | null>(null);

  const fitToWidth = useCallback(() => {
    if (!enabled) {
      setZoom(1);
      return;
    }

    const viewport = viewportRef.current;
    const shell = shellRef.current;
    if (!viewport || !shell) return;

    const pad = 16;
    const fraction = targetShellWidthFraction(pageSizeMode);
    const targetWidth = Math.max(320, (viewport.clientWidth - pad) * fraction);

    setZoom(1);
    requestAnimationFrame(() => {
      const natural = shell.getBoundingClientRect().width;
      if (natural < 8) return;
      if (natural >= targetWidth * 0.92) {
        setZoom(1);
        return;
      }
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetWidth / natural));
      setZoom(Number(next.toFixed(3)));
    });
  }, [enabled, viewportRef, shellRef, pageSizeMode]);

  useLayoutEffect(() => {
    if (!enabled) {
      setZoom(1);
      return;
    }

    fitToWidth();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const ro = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(fitToWidth);
    });
    ro.observe(viewport);
    window.addEventListener("resize", fitToWidth);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fitToWidth);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, fitToWidth, resetKey, viewportRef]);

  return { zoom, setZoom, fitToWidth };
}
