"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Crosshair,
  Gavel,
  Landmark,
  Lightbulb,
  Maximize2,
  Minus,
  Plus,
  Scale,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { VisualMindMap, VisualMindMapNode } from "@/lib/organizers/visual-mind-map-types";

const ICON_MAP: Record<string, LucideIcon> = {
  scale: Scale,
  book: BookOpen,
  gavel: Gavel,
  users: Users,
  landmark: Landmark,
  lightbulb: Lightbulb,
  target: Target,
  brain: Brain,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Brain;
}

function computeFitTransform(vw: number, vh: number, map: VisualMindMap, padding = 48) {
  const scale = Math.min(
    (vw - padding * 2) / map.width,
    (vh - padding * 2) / map.height,
    1.2,
  );
  return { x: 0, y: 0, scale: Math.max(0.35, scale) };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function VisualMindMapCanvas({
  map,
  fullscreen = false,
}: {
  map: VisualMindMap;
  fullscreen?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [fitApplied, setFitApplied] = useState(false);
  const [canvasDragging, setCanvasDragging] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasDragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });

  const nodeById = useMemo(() => new Map(map.nodes.map((n) => [n.id, n])), [map.nodes]);
  const selected = selectedId ? (nodeById.get(selectedId) ?? null) : null;

  const relatedIds = useMemo(() => {
    if (!selected) return new Set<string>();
    return new Set([selected.id, ...selected.relatedIds]);
  }, [selected]);

  const edges = useMemo(() => {
    const result: Array<{ from: VisualMindMapNode; to: VisualMindMapNode }> = [];
    for (const node of map.nodes) {
      for (const relId of node.relatedIds) {
        const target = nodeById.get(relId);
        if (!target) continue;
        if (node.id === "center" || relId === "center") {
          const from = node.id === "center" ? node : target;
          const to = node.id === "center" ? target : node;
          const key = `${from.id}-${to.id}`;
          if (!result.some((e) => `${e.from.id}-${e.to.id}` === key)) {
            result.push({ from, to });
          }
        }
      }
    }
    return result;
  }, [map.nodes, nodeById]);

  const applyFitView = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTransform(computeFitTransform(rect.width, rect.height, map));
    setFitApplied(true);
  }, [map]);

  const zoomToNode = useCallback(
    (node: VisualMindMapNode) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const targetScale = Math.min(1.6, Math.max(transform.scale, 0.9));
      const offsetX = rect.width / 2 - node.x * targetScale;
      const offsetY = rect.height / 2 - node.y * targetScale;
      setTransform({ x: offsetX, y: offsetY, scale: targetScale });
    },
    [transform.scale],
  );

  useLayoutEffect(() => {
    if (fitApplied) return;
    applyFitView();
    const t = window.setTimeout(applyFitView, 80);
    return () => window.clearTimeout(t);
  }, [applyFitView, fitApplied, map]);

  const zoom = useCallback((delta: number) => {
    setTransform((current) => ({
      ...current,
      scale: Math.min(2.4, Math.max(0.28, current.scale + delta)),
    }));
  }, []);

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    zoom(event.deltaY > 0 ? -0.06 : 0.06);
  }

  function onCanvasPointerDown(event: React.PointerEvent) {
    if ((event.target as HTMLElement).closest("[data-visual-node]")) return;
    if ((event.target as HTMLElement).closest("[data-visual-panel]")) return;
    setCanvasDragging(true);
    canvasDragStart.current = {
      x: event.clientX,
      y: event.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onCanvasPointerMove(event: React.PointerEvent) {
    if (!canvasDragging) return;
    setTransform((current) => ({
      ...current,
      x: canvasDragStart.current.originX + (event.clientX - canvasDragStart.current.x),
      y: canvasDragStart.current.originY + (event.clientY - canvasDragStart.current.y),
    }));
  }

  function onCanvasPointerUp(event: React.PointerEvent) {
    setCanvasDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function selectNode(node: VisualMindMapNode) {
    setSelectedId(node.id);
    zoomToNode(node);
  }

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;
  const { width: w, height: h } = map;
  const centerNode = map.nodes.find((n) => n.id === "center");

  const viewportHeight = fullscreen
    ? "h-full min-h-0 flex-1"
    : "h-[min(72vh,560px)] min-h-[320px]";

  return (
    <div className={fullscreen ? "relative flex h-full min-h-0 flex-1 flex-col" : "w-full"}>
      <div
        ref={viewportRef}
        onWheel={onWheel}
        className={`study-map-viewport relative overflow-hidden rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[#07131A] ${viewportHeight}`}
      >
        <div className="absolute left-3 top-3 z-20">
          <MapControls
            onZoom={zoom}
            onFit={applyFitView}
            onCenter={() => setTransform((c) => ({ ...c, x: 0, y: 0 }))}
          />
        </div>

        <div
          className={`absolute inset-0 touch-none ${canvasDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerLeave={onCanvasPointerUp}
        >
          <div
            className="absolute left-1/2 top-1/2 origin-center will-change-transform"
            style={{
              width: w,
              height: h,
              transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
              transition: canvasDragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" aria-hidden>
              {edges.map(({ from, to }) => {
                const dimmed = selected && !(relatedIds.has(from.id) && relatedIds.has(to.id));
                const active = selected && relatedIds.has(from.id) && relatedIds.has(to.id);
                return (
                  <motion.path
                    key={`${from.id}-${to.id}`}
                    d={bezierPath(from.x, from.y, to.x, to.y)}
                    fill="none"
                    stroke="#00FFD5"
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeLinecap="round"
                    strokeOpacity={dimmed ? 0.08 : active ? 0.9 : 0.28}
                    className={active ? "tron-edge-flow" : undefined}
                  />
                );
              })}
            </svg>

            {map.nodes.map((node, index) => {
              const Icon = getIcon(node.icon);
              const isCenter = node.ring === "center";
              const dimmed = selected && !relatedIds.has(node.id);
              const isSelected = selectedId === node.id;

              return (
                <motion.div
                  key={node.id}
                  data-visual-node
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isSelected ? 1.06 : dimmed ? 0.85 : 1,
                    opacity: dimmed ? 0.15 : 1,
                    filter: dimmed ? "blur(4px)" : "none",
                  }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: toPercent(node.x, w), top: toPercent(node.y, h) }}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectNode(node);
                  }}
                >
                  <div
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition ${
                      isCenter ? "w-[min(200px,42vw)]" : "w-[min(168px,38vw)]"
                    } ${
                      isSelected
                        ? "border-[#00FFD5] shadow-[0_0_36px_rgba(0,255,213,0.45)]"
                        : "border-[rgba(0,255,213,0.25)] hover:border-[rgba(0,255,213,0.5)] hover:shadow-[0_0_24px_rgba(0,255,213,0.25)]"
                    }`}
                    style={{ background: "rgba(16,39,48,0.92)" }}
                  >
                    {node.imageUrl ? (
                      <div className={`relative overflow-hidden ${isCenter ? "h-28" : "h-24"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={node.imageUrl}
                          alt={node.label}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07131A] via-transparent to-transparent" />
                      </div>
                    ) : (
                      <div
                        className={`flex items-center justify-center bg-gradient-to-br from-[rgba(0,255,213,0.15)] to-[rgba(0,191,255,0.08)] ${isCenter ? "h-28" : "h-24"}`}
                      >
                        <Icon size={isCenter ? 36 : 28} className="text-[#00FFD5]" />
                      </div>
                    )}

                    <div className="p-3">
                      <span className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#00FFD5] to-[#00BFFF] text-[#07131A]">
                        <Icon size={12} />
                      </span>
                      <p className="text-xs font-bold leading-tight text-[#F5F7FA]">{node.label}</p>
                      {!isCenter && node.explanation ? (
                        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                          {node.explanation}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {selected ? (
            <motion.aside
              data-visual-panel
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 right-0 z-40 flex w-[min(100%,380px)] flex-col border-l border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.92)] backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-[rgba(0,255,213,0.12)] px-4 py-3">
                <h4 className="text-sm font-semibold text-[#F5F7FA]">{selected.label}</h4>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-[rgba(0,255,213,0.08)] hover:text-[#00FFD5]"
                  aria-label="Cerrar panel"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {selected.imageUrl ? (
                  <div className="mb-4 overflow-hidden rounded-xl border border-[rgba(0,255,213,0.2)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selected.imageUrl} alt={selected.label} className="w-full object-cover" />
                  </div>
                ) : null}

                <p className="text-sm leading-relaxed text-[#F5F7FA]/90">
                  {selected.explanation || `Concepto: ${selected.label}`}
                </p>

                {selected.relatedIds.length ? (
                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#00FFD5]">
                      Relacionado con
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selected.relatedIds.map((relId) => {
                        const rel = nodeById.get(relId);
                        if (!rel) return null;
                        return (
                          <button
                            key={relId}
                            type="button"
                            onClick={() => selectNode(rel)}
                            className="rounded-full border border-[rgba(0,255,213,0.25)] bg-[rgba(0,255,213,0.08)] px-3 py-1 text-[11px] font-medium text-[#F5F7FA] transition hover:border-[#00FFD5] hover:bg-[rgba(0,255,213,0.15)]"
                          >
                            {rel.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {centerNode && selected.id !== "center" ? (
                  <button
                    type="button"
                    onClick={() => centerNode && selectNode(centerNode)}
                    className="mt-5 w-full rounded-xl border border-[rgba(0,255,213,0.2)] py-2.5 text-xs font-semibold text-[#00FFD5] transition hover:bg-[rgba(0,255,213,0.08)]"
                  >
                    Volver al tema central · {centerNode.label}
                  </button>
                ) : null}
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MapControls({
  onZoom,
  onFit,
  onCenter,
}: {
  onZoom: (delta: number) => void;
  onFit: () => void;
  onCenter: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.9)] p-1.5 shadow-[0_0_24px_rgba(0,255,213,0.12)] backdrop-blur-md">
      <div className="flex gap-1">
        <IconBtn onClick={() => onZoom(-0.08)} label="Alejar">
          <Minus size={15} />
        </IconBtn>
        <IconBtn onClick={() => onZoom(0.08)} label="Acercar">
          <Plus size={15} />
        </IconBtn>
        <IconBtn onClick={onFit} label="Ajustar vista">
          <Maximize2 size={13} />
        </IconBtn>
      </div>
      <button
        type="button"
        onClick={onCenter}
        className="rounded-lg px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-[rgba(0,255,213,0.08)] hover:text-[#F5F7FA]"
      >
        <Crosshair size={11} className="mr-1 inline" />
        Centrar
      </button>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
    >
      {children}
    </button>
  );
}
