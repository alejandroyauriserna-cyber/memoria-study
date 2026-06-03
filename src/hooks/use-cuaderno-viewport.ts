"use client";

import { useCallback, useEffect, useState } from "react";

export type ViewportBounds = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

/** Bounds normalizados 0–1 respecto al contenedor del papel */
export function useCuadernoViewport(
  scrollRef: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
  bufferRatio = 0.12,
) {
  const [bounds, setBounds] = useState<ViewportBounds>({
    top: 0,
    bottom: 1,
    left: 0,
    right: 1,
  });

  const update = useCallback(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;

    const sr = scrollEl.getBoundingClientRect();
    const cr = contentEl.getBoundingClientRect();
    const h = cr.height || 1;
    const w = cr.width || 1;
    const bufY = sr.height * bufferRatio;
    const bufX = sr.width * bufferRatio;

    const top = Math.max(0, (sr.top - bufY - cr.top) / h);
    const bottom = Math.min(1, (sr.bottom + bufY - cr.top) / h);
    const left = Math.max(0, (sr.left - bufX - cr.left) / w);
    const right = Math.min(1, (sr.right + bufX - cr.left) / w);

    setBounds({ top, bottom, left, right });
  }, [scrollRef, contentRef, bufferRatio]);

  useEffect(() => {
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
    };
  }, [scrollRef, contentRef, update]);

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
