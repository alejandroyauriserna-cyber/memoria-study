"use client";

import { useEffect, useRef, useState } from "react";

export type CuadernoPerfStats = {
  fps: number;
  renderMs: number;
  memoryMb: number | null;
};

function readMemoryMb(): number | null {
  const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };
  if (!perf.memory) return null;
  return Math.round(perf.memory.usedJSHeapSize / 1048576);
}

/** Métricas de scroll/render — activar con ?cnPerf=1 o localStorage cn-perf=1 */
export function useCuadernoPerf(enabled: boolean, scrollRef: React.RefObject<HTMLElement | null>) {
  const [stats, setStats] = useState<CuadernoPerfStats>({ fps: 60, renderMs: 0, memoryMb: null });
  const framesRef = useRef(0);
  const lastRef = useRef(performance.now());
  const renderStartRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const tick = (now: number) => {
      framesRef.current += 1;
      if (now - lastRef.current >= 1000) {
        const fps = Math.round((framesRef.current * 1000) / (now - lastRef.current));
        framesRef.current = 0;
        lastRef.current = now;
        setStats({
          fps,
          renderMs: Math.round(performance.now() - renderStartRef.current),
          memoryMb: readMemoryMb(),
        });
        renderStartRef.current = performance.now();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      renderStartRef.current = performance.now();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [enabled, scrollRef]);

  return stats;
}

export function isCuadernoPerfEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("cn-perf") === "1") return true;
    return new URLSearchParams(window.location.search).has("cnPerf");
  } catch {
    return false;
  }
}
