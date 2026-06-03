"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ViewportBounds = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

function boundsEqual(a: ViewportBounds, b: ViewportBounds): boolean {
  return (
    Math.abs(a.top - b.top) < 0.002 &&
    Math.abs(a.bottom - b.bottom) < 0.002 &&
    Math.abs(a.left - b.left) < 0.002 &&
    Math.abs(a.right - b.right) < 0.002
  );
}

/** Bounds normalizados 0–1 respecto al contenedor del papel */
export function useCuadernoViewport(
  scrollRef: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
  bufferRatio = 0.12,
  enabled = true,
) {
  const [bounds, setBounds] = useState<ViewportBounds>({
    top: 0,
    bottom: 1,
    left: 0,
    right: 1,
  });
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<ViewportBounds | null>(null);

  const applyBounds = useCallback((next: ViewportBounds) => {
    setBounds((prev) => (boundsEqual(prev, next) ? prev : next));
  }, []);

  const update = useCallback(() => {
    if (!enabled) return;
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    const sr = scrollEl.getBoundingClientRect();
    const cr = contentEl.getBoundingClientRect();
    const h = cr.height || 1;
    const w = cr.width || 1;
    const bufY = sr.height * bufferRatio;
    const bufX = sr.width * bufferRatio;

    const next: ViewportBounds = {
      top: Math.max(0, (sr.top - bufY - cr.top) / h),
      bottom: Math.min(1, (sr.bottom + bufY - cr.top) / h),
      left: Math.max(0, (sr.left - bufX - cr.left) / w),
      right: Math.min(1, (sr.right + bufX - cr.left) / w),
    };
    pendingRef.current = next;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (pendingRef.current) applyBounds(pendingRef.current);
    });
  }, [scrollRef, contentRef, bufferRatio, enabled, applyBounds]);

  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", update, { passive: true });
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollRef, contentRef, update, enabled]);

  return bounds;
}

export function isInViewportBounds(
  obj: { x: number; y: number; w: number; h: number },
  bounds: ViewportBounds,
): boolean {
  const objRight = obj.x + obj.w;
  const objBottom = obj.y + obj.h;
  return (
    objBottom >= bounds.top &&
    obj.y <= bounds.bottom &&
    objRight >= bounds.left &&
    obj.x <= bounds.right
  );
}
