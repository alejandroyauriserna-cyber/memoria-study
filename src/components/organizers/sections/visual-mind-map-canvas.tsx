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
  type LucideIcon,
} from "lucide-react";
import { VisualMindMapStudyPanel } from "@/components/organizers/sections/visual-mind-map-study-panel";
import {
  getMindMapEdges,
  layoutVisualMindMap,
  organicEdgePath,
} from "@/lib/organizers/visual-mind-map-layout";
import {
  CATEGORY_THEMES,
  styleForTier,
  themeForCategory,
} from "@/lib/organizers/visual-mind-map-theme";
import {
  normalizeVisualMindMap,
  normalizeVisualMindMapNode,
  type VisualMindMap,
  type VisualMindMapNode,
} from "@/lib/organizers/visual-mind-map-types";

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

function computeFitTransform(vw: number, vh: number, map: VisualMindMap, padding = 56) {
  const scale = Math.min(
    (vw - padding * 2) / map.width,
    (vh - padding * 2) / map.height,
    1.15,
  );
  return { x: 0, y: 0, scale: Math.max(0.32, scale) };
}

export function VisualMindMapCanvas({
  map: rawMap,
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

  const map = useMemo(() => {
    const normalized = normalizeVisualMindMap(rawMap);
    const needsLayout = normalized.nodes.some((n) => !n.x && !n.y && n.tier !== "center");
    if (needsLayout && normalized.nodes.every((n) => n.x === 0 && n.y === 0)) {
      const layout = layoutVisualMindMap(normalized.nodes.map(normalizeVisualMindMapNode));
      return { ...normalized, ...layout };
    }
    return normalized;
  }, [rawMap]);

  const nodes = useMemo(
    () => map.nodes.map(normalizeVisualMindMapNode),
    [map.nodes],
  );

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const selected = selectedId ? (nodeById.get(selectedId) ?? null) : null;
  const centerNode = nodes.find((n) => n.tier === "center");

  const relatedIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const ids = new Set<string>([selected.id]);
    if (selected.parentId) ids.add(selected.parentId);
    for (const rel of selected.relatedIds) ids.add(rel);
    for (const n of nodes) {
      if (n.parentId === selected.id) ids.add(n.id);
    }
    return ids;
  }, [selected, nodes]);

  const edges = useMemo(() => getMindMapEdges(nodes), [nodes]);

  const relatedNodes = useMemo(() => {
    if (!selected) return [];
    return selected.relatedIds
      .map((id) => nodeById.get(id))
      .filter((n): n is VisualMindMapNode => Boolean(n) && n!.id !== selected.id);
  }, [selected, nodeById]);

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
      const targetScale = Math.min(1.55, Math.max(transform.scale, 0.85));
      setTransform({
        x: rect.width / 2 - node.x * targetScale,
        y: rect.height / 2 - node.y * targetScale,
        scale: targetScale,
      });
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
      scale: Math.min(2.5, Math.max(0.25, current.scale + delta)),
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

  const viewportHeight = fullscreen
    ? "h-full min-h-0 flex-1"
    : "h-[min(72vh,560px)] min-h-[320px]";

  return (
    <div className={fullscreen ? "relative flex h-full min-h-0 flex-1 flex-col" : "w-full"}>
      <div
        ref={viewportRef}
        onWheel={onWheel}
        className={`visual-mind-map-viewport relative overflow-hidden rounded-[28px] ${viewportHeight}`}
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, rgba(0,255,213,0.06), transparent 70%), #040d12",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(0,255,213,0.08) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="absolute left-3 top-3 z-20">
          <MapControls
            onZoom={zoom}
            onFit={applyFitView}
            onCenter={() => setTransform((c) => ({ ...c, x: 0, y: 0 }))}
          />
        </div>

        <div className="absolute right-3 top-3 z-20 hidden flex-wrap gap-1.5 sm:flex">
          {Object.values(CATEGORY_THEMES).map((cat) => (
            <span
              key={cat.id}
              className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{ background: cat.soft, color: cat.color }}
            >
              {cat.label}
            </span>
          ))}
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
              transition: canvasDragging ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full overflow-visible">
              <defs>
                {edges.map(({ key, to }) => {
                  const theme = themeForCategory(to.category);
                  return (
                    <filter key={`glow-${key}`} id={`edge-glow-${key}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  );
                })}
              </defs>

              {edges.map(({ from, to, key }) => {
                const dimmed = selected && !(relatedIds.has(from.id) && relatedIds.has(to.id));
                const active = selected && relatedIds.has(from.id) && relatedIds.has(to.id);
                const theme = themeForCategory(to.category);
                const path = organicEdgePath(from.x, from.y, to.x, to.y, active ? 0.28 : 0.2);

                return (
                  <g key={key}>
                    {active ? (
                      <path
                        d={path}
                        fill="none"
                        stroke={theme.color}
                        strokeWidth={8}
                        strokeLinecap="round"
                        strokeOpacity={0.12}
                      />
                    ) : null}
                    <motion.path
                      d={path}
                      fill="none"
                      stroke={theme.color}
                      strokeWidth={active ? 2.8 : 1.6}
                      strokeLinecap="round"
                      strokeOpacity={dimmed ? 0.06 : active ? 0.95 : 0.32}
                      filter={active ? `url(#edge-glow-${key})` : undefined}
                      className={active ? "visual-mind-edge-flow" : undefined}
                      initial={false}
                      animate={{ strokeOpacity: dimmed ? 0.06 : active ? 0.95 : 0.32 }}
                    />
                  </g>
                );
              })}
            </svg>

            {nodes.map((node, index) => (
              <MindMapNodeBubble
                key={node.id}
                node={node}
                index={index}
                mapWidth={w}
                mapHeight={h}
                selected={selectedId === node.id}
                dimmed={Boolean(selected && !relatedIds.has(node.id))}
                onSelect={() => selectNode(node)}
                toPercent={toPercent}
              />
            ))}
          </div>
        </div>

        <AnimatePresence>
          {selected ? (
            <VisualMindMapStudyPanel
              node={selected}
              relatedNodes={relatedNodes}
              centerNode={centerNode}
              onSelectNode={selectNode}
              onClose={() => setSelectedId(null)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MindMapNodeBubble({
  node,
  index,
  mapWidth,
  mapHeight,
  selected,
  dimmed,
  onSelect,
  toPercent,
}: {
  node: VisualMindMapNode;
  index: number;
  mapWidth: number;
  mapHeight: number;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
  toPercent: (v: number, t: number) => string;
}) {
  const theme = themeForCategory(node.category);
  const tierStyle = styleForTier(node.tier);
  const Icon = getIcon(node.icon);
  const isCenter = node.tier === "center";

  return (
    <motion.button
      type="button"
      data-visual-node
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: selected ? 1.08 : dimmed ? 0.78 : 1,
        opacity: dimmed ? 0.12 : 1,
        filter: dimmed ? "blur(6px) saturate(0.4)" : "none",
      }}
      transition={{ duration: 0.35, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
      style={{ left: toPercent(node.x, mapWidth), top: toPercent(node.y, mapHeight) }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="relative flex flex-col items-center"
        style={{
          minWidth: tierStyle.minWidth,
          maxWidth: tierStyle.maxWidth,
        }}
      >
        {isCenter ? (
          <div
            className="pointer-events-none absolute -inset-10 rounded-full blur-3xl"
            style={{ background: theme.glow, opacity: 0.45 }}
          />
        ) : null}

        <div
          className={`relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
            isCenter ? "rounded-full" : "rounded-[28px]"
          }`}
          style={{
            padding: tierStyle.padding,
            background: isCenter
              ? `linear-gradient(145deg, rgba(0,255,213,0.28), rgba(0,120,180,0.15))`
              : `linear-gradient(145deg, ${theme.soft}, rgba(5,14,20,0.75))`,
            border: selected
              ? `2px solid ${theme.color}`
              : `1.5px solid ${theme.color}44`,
            boxShadow: selected
              ? `0 0 48px ${theme.glow}, 0 16px 40px rgba(0,0,0,0.35)`
              : `0 8px 32px rgba(0,0,0,0.28), 0 0 20px ${theme.glow.replace("0.55", "0.15")}`,
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="relative mb-2 overflow-hidden rounded-full ring-2 ring-white/10"
              style={{
                width: tierStyle.thumbSize,
                height: tierStyle.thumbSize,
              }}
            >
              {node.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={node.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: theme.gradient }}
                >
                  <Icon size={tierStyle.iconSize} style={{ color: theme.color }} />
                </div>
              )}
            </div>

            {!isCenter ? (
              <span
                className="mb-1 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                style={{ background: theme.soft, color: theme.color }}
              >
                {theme.label}
              </span>
            ) : null}

            <p
              className="font-bold leading-tight text-[#F5F7FA]"
              style={{ fontSize: tierStyle.fontSize }}
            >
              {node.label}
            </p>
          </div>
        </div>
      </div>
    </motion.button>
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
    <div className="flex flex-col gap-1 rounded-2xl border border-[rgba(0,255,213,0.2)] bg-[rgba(5,14,20,0.88)] p-1.5 shadow-[0_0_24px_rgba(0,255,213,0.1)] backdrop-blur-xl">
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
      className="flex h-8 w-8 items-center justify-center rounded-xl text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
    >
      {children}
    </button>
  );
}
