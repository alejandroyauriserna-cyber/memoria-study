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
  LEGEND_CATEGORIES,
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

function computeFitTransform(vw: number, vh: number, map: VisualMindMap, padding = 40) {
  const scale = Math.min(
    (vw - padding * 2) / map.width,
    (vh - padding * 2) / map.height,
    1.2,
  );
  return { x: 0, y: 0, scale: Math.max(0.38, scale) };
}

function edgeAnchors(from: VisualMindMapNode, to: VisualMindMapNode) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;
  const fromStyle = styleForTier(from.tier);
  const toStyle = styleForTier(to.tier);
  const fromOffset = Math.max(fromStyle.cardWidth, fromStyle.cardHeight) * 0.42;
  const toOffset = Math.max(toStyle.cardWidth, toStyle.cardHeight) * 0.42;

  return {
    x1: from.x + nx * fromOffset,
    y1: from.y + ny * fromOffset * 0.55,
    x2: to.x - nx * toOffset,
    y2: to.y - ny * toOffset * 0.55,
  };
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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
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

  const focusId = selectedId ?? hoveredId;

  const relatedIds = useMemo(() => {
    if (!focusId) return new Set<string>();
    const focus = nodeById.get(focusId);
    if (!focus) return new Set<string>();
    const ids = new Set<string>([focus.id]);
    if (focus.parentId) ids.add(focus.parentId);
    for (const rel of focus.relatedIds) ids.add(rel);
    for (const n of nodes) {
      if (n.parentId === focus.id) ids.add(n.id);
    }
    return ids;
  }, [focusId, nodeById, nodes]);

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
      const targetScale = Math.min(1.65, Math.max(transform.scale, 0.9));
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
        className={`visual-mind-map-viewport relative overflow-hidden rounded-[24px] ${viewportHeight}`}
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(59,130,246,0.07), transparent 65%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(168,85,247,0.05), transparent 55%), #030a0f",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
              backgroundSize: "24px 24px",
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

        <div className="absolute right-3 top-3 z-20 hidden flex-wrap justify-end gap-1.5 sm:flex">
          {LEGEND_CATEGORIES.map((catId) => {
            const cat = themeForCategory(catId);
            return (
              <span
                key={cat.id}
                className="rounded-full px-2.5 py-0.5 text-[9px] font-semibold shadow-sm backdrop-blur-md"
                style={{ background: cat.chip, color: cat.color, border: `1px solid ${cat.color}33` }}
              >
                {cat.label}
              </span>
            );
          })}
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
                {edges.map(({ key, from, to, kind }) => {
                  const theme = themeForCategory(kind === "relation" ? from.category : to.category);
                  return (
                    <linearGradient
                      key={`grad-${key}`}
                      id={`edge-grad-${key}`}
                      gradientUnits="userSpaceOnUse"
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                    >
                      <stop offset="0%" stopColor={themeForCategory(from.category).color} stopOpacity={0.15} />
                      <stop offset="50%" stopColor={theme.color} stopOpacity={0.85} />
                      <stop offset="100%" stopColor={theme.color} stopOpacity={0.35} />
                    </linearGradient>
                  );
                })}
              </defs>

              {edges.map(({ from, to, key, kind }) => {
                const dimmed = focusId && !(relatedIds.has(from.id) && relatedIds.has(to.id));
                const active = focusId && relatedIds.has(from.id) && relatedIds.has(to.id);
                const theme = themeForCategory(kind === "relation" ? from.category : to.category);
                const { x1, y1, x2, y2 } = edgeAnchors(from, to);
                const path = organicEdgePath(x1, y1, x2, y2, active ? 0.32 : kind === "relation" ? 0.38 : 0.22);

                return (
                  <g key={key}>
                    {active ? (
                      <path
                        d={path}
                        fill="none"
                        stroke={theme.color}
                        strokeWidth={10}
                        strokeLinecap="round"
                        strokeOpacity={0.1}
                      />
                    ) : null}
                    <motion.path
                      d={path}
                      fill="none"
                      stroke={`url(#edge-grad-${key})`}
                      strokeWidth={active ? 3 : kind === "relation" ? 1.4 : 2.2}
                      strokeLinecap="round"
                      strokeDasharray={kind === "relation" ? "6 6" : undefined}
                      strokeOpacity={dimmed ? 0.05 : active ? 1 : 0.45}
                      className={active ? "visual-mind-edge-flow" : undefined}
                      initial={false}
                      animate={{ strokeOpacity: dimmed ? 0.05 : active ? 1 : 0.45 }}
                    />
                  </g>
                );
              })}
            </svg>

            {nodes.map((node, index) => (
              <MindMapNodeCard
                key={node.id}
                node={node}
                index={index}
                mapWidth={w}
                mapHeight={h}
                selected={selectedId === node.id}
                hovered={hoveredId === node.id}
                dimmed={Boolean(focusId && !relatedIds.has(node.id))}
                onSelect={() => selectNode(node)}
                onHover={(v) => setHoveredId(v ? node.id : null)}
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

function MindMapNodeCard({
  node,
  index,
  mapWidth,
  mapHeight,
  selected,
  hovered,
  dimmed,
  onSelect,
  onHover,
  toPercent,
}: {
  node: VisualMindMapNode;
  index: number;
  mapWidth: number;
  mapHeight: number;
  selected: boolean;
  hovered: boolean;
  dimmed: boolean;
  onSelect: () => void;
  onHover: (active: boolean) => void;
  toPercent: (v: number, t: number) => string;
}) {
  const theme = themeForCategory(node.category);
  const tierStyle = styleForTier(node.tier);
  const Icon = getIcon(node.icon);
  const isCenter = node.tier === "center";
  const isDetail = node.tier === "detail";
  const expanded = selected || hovered;

  if (isDetail) {
    return (
      <motion.button
        type="button"
        data-visual-node
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: expanded ? 1.12 : dimmed ? 0.85 : 1,
          opacity: dimmed ? 0.18 : 1,
        }}
        transition={{ duration: 0.28, delay: index * 0.02 }}
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
        style={{ left: toPercent(node.x, mapWidth), top: toPercent(node.y, mapHeight) }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 backdrop-blur-xl transition-shadow duration-300"
          style={{
            width: tierStyle.cardWidth,
            background: `linear-gradient(135deg, ${theme.soft}, rgba(3,10,15,0.88))`,
            border: selected ? `2px solid ${theme.color}` : `1px solid ${theme.color}55`,
            boxShadow: expanded
              ? `0 0 24px ${theme.glow}, 0 8px 20px rgba(0,0,0,0.35)`
              : `0 4px 12px rgba(0,0,0,0.25)`,
          }}
        >
          <span
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{
              width: tierStyle.thumbWidth,
              height: tierStyle.thumbWidth,
              background: theme.gradient,
            }}
          >
            {node.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={node.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <Icon size={tierStyle.iconSize} style={{ color: theme.color }} />
            )}
          </span>
          <span
            className="truncate font-semibold text-[#F5F7FA]"
            style={{ fontSize: tierStyle.fontSize, maxWidth: tierStyle.cardWidth - tierStyle.thumbWidth - 16 }}
          >
            {node.label}
          </span>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      data-visual-node
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: selected ? 1.06 : hovered ? 1.04 : dimmed ? 0.82 : 1,
        opacity: dimmed ? 0.14 : 1,
        filter: dimmed ? "blur(4px) saturate(0.35)" : "none",
      }}
      transition={{ duration: 0.32, delay: index * 0.025, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
      style={{ left: toPercent(node.x, mapWidth), top: toPercent(node.y, mapHeight) }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div className="relative" style={{ width: tierStyle.cardWidth }}>
        {isCenter ? (
          <div
            className="pointer-events-none absolute -inset-8 rounded-[40px] blur-3xl"
            style={{ background: theme.glow, opacity: 0.35 }}
          />
        ) : null}

        <div
          className={`relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
            isCenter ? "rounded-[32px]" : "rounded-[22px]"
          }`}
          style={{
            width: tierStyle.cardWidth,
            minHeight: tierStyle.cardHeight,
            background: isCenter
              ? `linear-gradient(160deg, rgba(59,130,246,0.22), rgba(3,10,15,0.92))`
              : `linear-gradient(160deg, ${theme.soft}, rgba(3,10,15,0.9))`,
            border: selected
              ? `2px solid ${theme.color}`
              : hovered
                ? `1.5px solid ${theme.color}aa`
                : `1px solid ${theme.color}44`,
            boxShadow: selected
              ? `0 0 56px ${theme.glow}, 0 20px 48px rgba(0,0,0,0.4)`
              : hovered
                ? `0 0 32px ${theme.glow.replace("0.55", "0.25")}, 0 12px 32px rgba(0,0,0,0.32)`
                : `0 8px 28px rgba(0,0,0,0.28)`,
          }}
        >
          {isCenter ? (
            <div className="flex flex-col">
              <div
                className="relative w-full overflow-hidden"
                style={{ height: tierStyle.cardHeight - 56 }}
              >
                {node.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={node.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: theme.gradient }}
                  >
                    <Icon size={56} style={{ color: theme.color }} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030a0f] via-transparent to-transparent" />
              </div>
              <div className="px-4 pb-4 pt-3 text-center">
                <span
                  className="mb-2 inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: theme.chip, color: theme.color }}
                >
                  Tema central
                </span>
                <p
                  className="font-bold leading-snug text-[#F5F7FA]"
                  style={{ fontSize: tierStyle.fontSize }}
                >
                  {node.label}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[96px]">
              <div
                className="relative shrink-0 overflow-hidden"
                style={{
                  width: tierStyle.thumbWidth,
                  minHeight: tierStyle.cardHeight,
                }}
              >
                {node.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={node.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: theme.gradient }}
                  >
                    <Icon size={tierStyle.iconSize + 4} style={{ color: theme.color }} />
                  </div>
                )}
                <div
                  className="absolute inset-y-0 right-0 w-px"
                  style={{ background: `${theme.color}33` }}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5">
                <span
                  className="mb-1.5 w-fit rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                  style={{ background: theme.chip, color: theme.color }}
                >
                  {theme.label}
                </span>
                <p
                  className="font-bold leading-tight text-[#F5F7FA]"
                  style={{
                    fontSize: tierStyle.fontSize,
                    display: "-webkit-box",
                    WebkitLineClamp: tierStyle.labelLines,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {node.label}
                </p>
                {expanded && node.explanation ? (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-1.5 line-clamp-2 text-[10px] leading-snug text-[#F5F7FA]/65"
                  >
                    {node.explanation}
                  </motion.p>
                ) : null}
              </div>
            </div>
          )}
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
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-[rgba(3,10,15,0.9)] p-1.5 shadow-lg backdrop-blur-xl">
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
        className="rounded-lg px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-white/5 hover:text-[#F5F7FA]"
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
      className="flex h-8 w-8 items-center justify-center rounded-xl text-[#F5F7FA] transition hover:bg-white/10 hover:text-[#60A5FA]"
    >
      {children}
    </button>
  );
}
