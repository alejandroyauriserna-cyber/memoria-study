"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Maximize2, Minus, Plus } from "lucide-react";
import {
  ImportanceBadge,
  NodeThumbnail,
} from "@/components/organizers/sections/visual-mind-map-node-media";
import { VisualMindMapStudyPanel } from "@/components/organizers/sections/visual-mind-map-study-panel";
import {
  edgeAnchors,
  getMindMapEdges,
  layoutVisualMindMap,
  organicEdgePath,
} from "@/lib/organizers/visual-mind-map-layout";
import {
  LEGEND_CATEGORIES,
  nodeDimensions,
  styleForTier,
  themeForCategory,
} from "@/lib/organizers/visual-mind-map-theme";
import {
  normalizeVisualMindMap,
  normalizeVisualMindMapNode,
  type VisualMindMap,
  type VisualMindMapNode,
} from "@/lib/organizers/visual-mind-map-types";

function computeFitTransform(vw: number, vh: number, map: VisualMindMap, padding = 36) {
  const scale = Math.min(
    (vw - padding * 2) / map.width,
    (vh - padding * 2) / map.height,
    1.05,
  );
  return { x: 0, y: 0, scale: Math.max(0.34, scale) };
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
    const layout = layoutVisualMindMap(normalized.nodes.map(normalizeVisualMindMapNode));
    return { ...normalized, ...layout };
  }, [rawMap]);

  const nodes = useMemo(() => map.nodes.map(normalizeVisualMindMapNode), [map.nodes]);
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
      const targetScale = Math.min(1.5, Math.max(transform.scale, 0.88));
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
      scale: Math.min(2.4, Math.max(0.22, current.scale + delta)),
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
            "radial-gradient(ellipse 75% 60% at 50% 40%, rgba(59,130,246,0.08), transparent 70%), #02060a",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="absolute left-3 top-3 z-20">
          <MapControls onZoom={zoom} onFit={applyFitView} onCenter={() => setTransform((c) => ({ ...c, x: 0, y: 0 }))} />
        </div>

        <div className="absolute right-3 top-3 z-20 hidden flex-wrap justify-end gap-1.5 sm:flex">
          {LEGEND_CATEGORIES.map((catId) => {
            const cat = themeForCategory(catId);
            return (
              <span
                key={cat.id}
                className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide backdrop-blur-md"
                style={{ background: cat.chip, color: cat.color, border: `1px solid ${cat.color}44` }}
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
                      <stop offset="0%" stopColor={themeForCategory(from.category).color} stopOpacity={0.2} />
                      <stop offset="55%" stopColor={theme.color} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={theme.color} stopOpacity={0.25} />
                    </linearGradient>
                  );
                })}
              </defs>

              {edges.map(({ from, to, key, kind }) => {
                const dimmed = focusId && !(relatedIds.has(from.id) && relatedIds.has(to.id));
                const active = focusId && relatedIds.has(from.id) && relatedIds.has(to.id);
                const theme = themeForCategory(kind === "relation" ? from.category : to.category);
                const { x1, y1, x2, y2 } = edgeAnchors(from, to);
                const path = organicEdgePath(x1, y1, x2, y2, active ? 0.34 : kind === "relation" ? 0.42 : 0.24);

                return (
                  <g key={key}>
                    {active ? (
                      <path
                        d={path}
                        fill="none"
                        stroke={theme.color}
                        strokeWidth={12}
                        strokeLinecap="round"
                        strokeOpacity={0.12}
                      />
                    ) : null}
                    <motion.path
                      d={path}
                      fill="none"
                      stroke={`url(#edge-grad-${key})`}
                      strokeWidth={active ? 3.2 : kind === "relation" ? 1.5 : 2.4}
                      strokeLinecap="round"
                      strokeDasharray={kind === "relation" ? "7 7" : undefined}
                      strokeOpacity={dimmed ? 0.04 : active ? 1 : 0.42}
                      className={active ? "visual-mind-edge-flow" : undefined}
                      initial={false}
                      animate={{ strokeOpacity: dimmed ? 0.04 : active ? 1 : 0.42 }}
                    />
                    {active ? (
                      <circle r={3.5} fill={theme.color} className="visual-mind-edge-particle">
                        <animateMotion dur="2.4s" repeatCount="indefinite" path={path} />
                      </circle>
                    ) : null}
                  </g>
                );
              })}
            </svg>

            {nodes.map((node, index) => (
              <MindMapLearningCard
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

function MindMapLearningCard({
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
  const dims = nodeDimensions(node);
  const isCenter = node.tier === "center";
  const expanded = selected || hovered;
  const highlighted = theme.highlighted;

  return (
    <motion.button
      type="button"
      data-visual-node
      initial={{ scale: 0.88, opacity: 0, y: 12 }}
      animate={{
        scale: selected ? 1.05 : hovered ? 1.03 : dimmed ? 0.78 : isCenter ? 1 : tierStyle.scale,
        opacity: dimmed ? 0.12 : 1,
        filter: dimmed ? "blur(5px) saturate(0.3)" : "none",
        y: 0,
      }}
      transition={{ duration: 0.34, delay: index * 0.022, ease: [0.22, 1, 0.36, 1] }}
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
      style={{ left: toPercent(node.x, mapWidth), top: toPercent(node.y, mapHeight), width: dims.width }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {isCenter ? (
        <div
          className="pointer-events-none absolute -inset-10 rounded-[40px] blur-3xl"
          style={{ background: theme.glow, opacity: 0.42 }}
        />
      ) : null}

      <div
        className={`relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
          isCenter ? "rounded-[28px]" : "rounded-[20px]"
        }`}
        style={{
          width: dims.width,
          minHeight: dims.height,
          background: isCenter
            ? `linear-gradient(165deg, rgba(59,130,246,0.24), rgba(2,6,10,0.96))`
            : highlighted
              ? `linear-gradient(165deg, ${theme.soft}, rgba(2,6,10,0.94))`
              : `linear-gradient(165deg, ${theme.soft.replace("0.16", "0.12")}, rgba(2,6,10,0.94))`,
          border: selected
            ? `2px solid ${theme.color}`
            : hovered
              ? `1.5px solid ${theme.color}cc`
              : highlighted
                ? `1.5px solid ${theme.color}88`
                : `1px solid ${theme.color}40`,
          boxShadow: selected
            ? `0 0 64px ${theme.glow}, 0 24px 56px rgba(0,0,0,0.45)`
            : hovered
              ? `0 0 36px ${theme.glow.replace(/[\d.]+\)$/, "0.28)")}, 0 16px 36px rgba(0,0,0,0.35)`
              : isCenter
                ? `0 0 48px ${theme.glow.replace(/[\d.]+\)$/, "0.32)")}, 0 16px 40px rgba(0,0,0,0.38)`
                : `0 10px 28px rgba(0,0,0,0.3)`,
        }}
      >
        <NodeThumbnail
          node={node}
          height={tierStyle.thumbHeight}
          iconSize={tierStyle.iconSize}
          className="w-full rounded-none rounded-t-[inherit]"
        />

        <div className={`px-3 ${isCenter ? "pb-4 pt-3" : "pb-3 pt-2.5"}`}>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em]"
              style={{ background: theme.chip, color: theme.color }}
            >
              {theme.label}
            </span>
            <ImportanceBadge importance={node.importance} />
          </div>

          <p
            className="font-bold leading-snug text-[#F5F7FA]"
            style={{ fontSize: isCenter ? tierStyle.titleSize : tierStyle.titleSize }}
          >
            {node.label}
          </p>

          <p
            className="mt-1.5 leading-snug text-[#F5F7FA]/72"
            style={{
              fontSize: isCenter ? tierStyle.summarySize : tierStyle.summarySize,
              display: "-webkit-box",
              WebkitLineClamp: isCenter ? 2 : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {node.summary || node.explanation}
          </p>

          {expanded && node.example ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 line-clamp-1 text-[10px] italic text-[#F5F7FA]/50"
            >
              Ej.: {node.example}
            </motion.p>
          ) : null}
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
    <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-[rgba(2,6,10,0.92)] p-1.5 shadow-lg backdrop-blur-xl">
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
