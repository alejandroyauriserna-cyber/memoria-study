"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Map, Minus, Plus, RotateCcw } from "lucide-react";
import {
  bezierConnector,
  conceptMapCenter,
  layoutConceptNodes,
} from "@/lib/organizers/concept-map-layout";

export function ConceptMapCanvas({
  title,
  nodes,
  hero = false,
}: {
  title?: string;
  nodes: string[];
  hero?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });

  const { x: cx, y: cy, w, h } = conceptMapCenter();
  const layout = useMemo(() => layoutConceptNodes(title, nodes), [title, nodes]);

  const zoom = useCallback((delta: number) => {
    setTransform((current) => ({
      ...current,
      scale: Math.min(2.2, Math.max(0.45, current.scale + delta)),
    }));
  }, []);

  const reset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    zoom(delta);
  }

  function onPointerDown(event: React.PointerEvent) {
    if ((event.target as HTMLElement).closest("[data-node]")) return;
    setDragging(true);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!dragging) return;
    setTransform((current) => ({
      ...current,
      x: dragStart.current.originX + (event.clientX - dragStart.current.x),
      y: dragStart.current.originY + (event.clientY - dragStart.current.y),
    }));
  }

  function onPointerUp(event: React.PointerEvent) {
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div className={hero ? "w-full" : "organizer-float-card organizer-glass rounded-[24px] p-4 sm:p-5"}>
      {!hero ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-indigo-500/10 text-accent">
              <Map size={17} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Mapa conceptual</h3>
              <p className="text-xs text-muted-foreground">Arrastra · zoom con rueda</p>
            </div>
          </div>
          <CanvasControls onZoom={zoom} onReset={reset} />
        </div>
      ) : null}

      <div
        ref={viewportRef}
        onWheel={onWheel}
        className={`organizer-dot-grid relative overflow-hidden rounded-[20px] border border-white/60 bg-gradient-to-br from-white/50 via-transparent to-accent/5 shadow-inner dark:border-white/10 dark:from-white/5 ${
          hero ? "h-[min(72vh,560px)] min-h-[380px]" : "h-[min(56vh,480px)] min-h-[320px]"
        }`}
      >
        {hero ? (
          <div className="absolute right-4 top-4 z-20">
            <CanvasControls onZoom={zoom} onReset={reset} />
          </div>
        ) : null}

        <div
          className={`absolute inset-0 touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="absolute left-1/2 top-1/2 origin-center will-change-transform"
            style={{
              width: w,
              height: h,
              transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
              transition: dragging ? "none" : "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden
            >
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(31,107,67,0.15)" />
                  <stop offset="50%" stopColor="rgba(99,102,241,0.35)" />
                  <stop offset="100%" stopColor="rgba(31,107,67,0.5)" />
                </linearGradient>
              </defs>
              {layout.map((node, index) => (
                <motion.path
                  key={`edge-${node.id}`}
                  d={bezierConnector(cx, cy, node.x, node.y)}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.04, ease: "easeOut" }}
                />
              ))}
            </svg>

            {title ? (
              <motion.div
                data-node
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: toPercent(cx, w), top: toPercent(cy, h) }}
              >
                <div className="relative">
                  <div className="absolute inset-0 scale-150 rounded-full bg-accent/20 blur-2xl" />
                  <div className="relative max-w-[200px] rounded-2xl border border-accent/25 bg-gradient-to-br from-accent to-emerald-700 px-5 py-3.5 text-center text-sm font-semibold leading-snug text-white shadow-[0_16px_40px_rgba(31,107,67,0.35)]">
                    {title}
                  </div>
                </div>
              </motion.div>
            ) : null}

            {layout.map((node, index) => (
              <motion.div
                key={node.id}
                data-node
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.06, y: -2 }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: toPercent(node.x, w), top: toPercent(node.y, h) }}
              >
                <div className="organizer-glass max-w-[148px] rounded-2xl px-3.5 py-2.5 text-center text-[11px] font-medium leading-4 text-foreground shadow-lg">
                  {node.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CanvasControls({
  onZoom,
  onReset,
}: {
  onZoom: (delta: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="organizer-glass flex items-center gap-1 rounded-2xl p-1">
      <button
        type="button"
        onClick={() => onZoom(-0.12)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-foreground transition hover:bg-foreground/5"
        aria-label="Alejar"
      >
        <Minus size={15} />
      </button>
      <button
        type="button"
        onClick={() => onZoom(0.12)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-foreground transition hover:bg-foreground/5"
        aria-label="Acercar"
      >
        <Plus size={15} />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
      >
        <RotateCcw size={13} />
      </button>
    </div>
  );
}
