"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crosshair,
  Home,
  Map as MapIcon,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { ConceptMapBranchStudyModal } from "@/components/organizers/sections/concept-map-branch-study";
import {
  StudyAssistantPanel,
  getBranchForNode,
} from "@/components/organizers/sections/study-assistant-panel";
import {
  applyCustomPositions,
  branchForId,
  buildNodeStudyDetail,
  CENTER_NODE_SIZE,
  computeCenterTransform,
  computeFitTransform,
  flashcardsForBranch,
  getMapEdges,
  getRelatedNodeIds,
  INNER_RADIUS,
  layoutStudyMapNodes,
  nodesInBranch,
  OUTER_RADIUS,
  recomputeLayoutBounds,
  studyBezierPath,
  type NodeStudyDetail,
  type OrganizerStudyContext,
  type StudyMapNode,
} from "@/lib/organizers/concept-map-study";
import {
  clearMapPositions,
  loadMapPositions,
  saveMapPositions,
} from "@/lib/organizers/map-positions-storage";

export function ConceptMapCanvas({
  title,
  nodes,
  hero = false,
  fullscreen = false,
  mapKey = "default-map",
  studyContext = {},
  onNodeSelect,
  onConceptStudied,
  panLocked = false,
}: {
  title?: string;
  nodes: string[];
  hero?: boolean;
  fullscreen?: boolean;
  mapKey?: string;
  studyContext?: OrganizerStudyContext;
  onNodeSelect?: (node: StudyMapNode | null, detail: NodeStudyDetail | null) => void;
  onConceptStudied?: (label: string) => void;
  /** Bloquea arrastre del mapa (p. ej. panel lateral o sheet abierto en móvil). */
  panLocked?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [fitApplied, setFitApplied] = useState(false);
  const [touchPanDisabled, setTouchPanDisabled] = useState(false);
  const [canvasDragging, setCanvasDragging] = useState(false);
  const [nodeDraggingId, setNodeDraggingId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [focusBranchId, setFocusBranchId] = useState<number | null>(null);
  const [branchStudyOpen, setBranchStudyOpen] = useState(false);
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});
  const canvasDragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const nodeDragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0, id: "", moved: false });

  const baseLayout = useMemo(() => layoutStudyMapNodes(title, nodes), [title, nodes]);

  useEffect(() => {
    setCustomPositions(loadMapPositions(mapKey));
  }, [mapKey, baseLayout]);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 1024px)");
    const sync = () => setTouchPanDisabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const layout = useMemo(() => {
    const merged = applyCustomPositions(baseLayout, customPositions);
    return recomputeLayoutBounds(merged);
  }, [baseLayout, customPositions]);

  const { cx, cy, w, h } = layout;
  const edges = useMemo(() => getMapEdges(layout), [layout]);

  const selectedNode = layout.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedBranch = selectedNode ? getBranchForNode(selectedNode) : null;

  const nodeDetail = useMemo(() => {
    if (!selectedNode) return null;
    return buildNodeStudyDetail(selectedNode, layout.nodes, title, studyContext);
  }, [layout.nodes, selectedNode, studyContext, title]);

  useEffect(() => {
    onNodeSelect?.(selectedNode, nodeDetail);
  }, [selectedNode, nodeDetail, onNodeSelect]);

  const branchFlashcards = useMemo(() => {
    if (!selectedNode) return [];
    return flashcardsForBranch(
      nodesInBranch(layout.nodes, selectedNode.branchId),
      studyContext,
      title,
    );
  }, [layout.nodes, selectedNode, studyContext, title]);

  const relatedIds = useMemo(
    () => getRelatedNodeIds(selectedNodeId, layout.nodes),
    [selectedNodeId, layout.nodes],
  );

  const applyFitView = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTransform(computeFitTransform(rect.width, rect.height, layout, fullscreen ? 12 : 16));
    setFitApplied(true);
  }, [fullscreen, layout]);

  const centerMap = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTransform(computeCenterTransform(rect.width, rect.height, layout, transform.scale));
  }, [layout, transform.scale]);

  const resetLayout = useCallback(() => {
    clearMapPositions(mapKey);
    setCustomPositions({});
    setSelectedNodeId(null);
    setFocusBranchId(null);
    setFitApplied(false);
  }, [mapKey]);

  useLayoutEffect(() => {
    if (fitApplied) return;
    applyFitView();
    const t = window.setTimeout(applyFitView, 80);
    return () => window.clearTimeout(t);
  }, [applyFitView, fitApplied, layout]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!canvasDragging && !nodeDraggingId && !selectedNodeId) applyFitView();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyFitView, canvasDragging, nodeDraggingId, selectedNodeId]);

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
    if (panLocked || selectedNodeId || touchPanDisabled) return;
    if ((event.target as HTMLElement).closest("[data-study-node]")) return;
    if ((event.target as HTMLElement).closest("[data-study-panel]")) return;
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
    if (nodeDraggingId) {
      const dx = (event.clientX - nodeDragStart.current.x) / transform.scale;
      const dy = (event.clientY - nodeDragStart.current.y) / transform.scale;
      if (Math.hypot(event.clientX - nodeDragStart.current.x, event.clientY - nodeDragStart.current.y) > 4) {
        nodeDragStart.current.moved = true;
      }
      const next = {
        ...customPositions,
        [nodeDraggingId]: {
          x: nodeDragStart.current.originX + dx,
          y: nodeDragStart.current.originY + dy,
        },
      };
      setCustomPositions(next);
      saveMapPositions(mapKey, next);
      return;
    }
    if (!canvasDragging) return;
    setTransform((current) => ({
      ...current,
      x: canvasDragStart.current.originX + (event.clientX - canvasDragStart.current.x),
      y: canvasDragStart.current.originY + (event.clientY - canvasDragStart.current.y),
    }));
  }

  function onCanvasPointerUp(event: React.PointerEvent) {
    setCanvasDragging(false);
    setNodeDraggingId(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function startNodeDrag(event: React.PointerEvent, node: StudyMapNode) {
    event.stopPropagation();
    event.preventDefault();
    setNodeDraggingId(node.id);
    nodeDragStart.current = {
      id: node.id,
      x: event.clientX,
      y: event.clientY,
      originX: node.x,
      originY: node.y,
      moved: false,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function isDimmed(nodeBranchId: number, nodeId: string) {
    if (selectedNodeId) return !relatedIds.has(nodeId);
    return focusBranchId !== null && focusBranchId !== nodeBranchId;
  }

  function selectNode(node: StudyMapNode, dragged = false) {
    if (dragged) return;
    setSelectedNodeId(node.id);
    setFocusBranchId(null);
    onConceptStudied?.(node.label);
  }

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;
  const nodeById = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout.nodes]);

  const viewportHeight = fullscreen
    ? "h-full min-h-0 flex-1"
    : hero
      ? "h-[min(78vh,620px)] min-h-[360px]"
      : "h-[min(62vh,480px)] min-h-[320px]";

  return (
    <div className={fullscreen ? "relative flex h-full min-h-0 flex-1 flex-col" : hero ? "w-full" : "rounded-2xl p-1"}>
      {!hero && !fullscreen ? (
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MapIcon size={16} className="text-[#00FFD5]" />
            <span className="text-sm font-semibold text-[#F5F7FA]">Red de conocimiento</span>
          </div>
          <MapControls onZoom={zoom} onResetLayout={resetLayout} onCenter={centerMap} onFit={applyFitView} compact />
        </div>
      ) : null}

      <div
        ref={viewportRef}
        onWheel={onWheel}
        className={`study-map-viewport relative overflow-hidden ${viewportHeight}${
          fullscreen ? " organizer-canvas-viewport" : " rounded-2xl"
        }`}
      >
        {(hero || fullscreen) && (
          <div className="map-controls-figma absolute left-4 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
            <MapControls
              onZoom={zoom}
              onResetLayout={resetLayout}
              onCenter={centerMap}
              onFit={applyFitView}
              figma
            />
          </div>
        )}

        {focusBranchId !== null ? (
          <div className="org-panel-focus-badge absolute right-3 top-3 z-20 px-3 py-1 text-[11px] font-medium backdrop-blur-md">
            Enfoque · {branchForId(focusBranchId).name}
          </div>
        ) : null}

        {panLocked || touchPanDisabled ? (
          <div
            className={`organizer-canvas-touch-blocker absolute inset-0 z-[45]${touchPanDisabled && !panLocked ? " organizer-canvas-touch-blocker--scroll" : " touch-none"}`}
            aria-hidden
          />
        ) : null}

        <div
          className={`absolute inset-0 ${panLocked || selectedNodeId || touchPanDisabled ? "pointer-events-none touch-none" : "touch-none"} ${canvasDragging ? "cursor-grabbing" : nodeDraggingId ? "cursor-move" : panLocked || selectedNodeId || touchPanDisabled ? "cursor-default" : "cursor-grab"}`}
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
              transition: canvasDragging || nodeDraggingId ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" aria-hidden>
              {[INNER_RADIUS, OUTER_RADIUS].map((radius, i) => (
                <circle
                  key={`ring-${i}`}
                  cx={cx}
                  cy={cy}
                  r={radius * (1 + layout.nodes.length * 0.015)}
                  fill="none"
                  stroke="rgba(0,255,213,0.05)"
                  strokeWidth={1}
                  strokeDasharray="4 8"
                />
              ))}

              {edges.map((edge) => {
                const fromNode = edge.from === "center" ? null : nodeById.get(edge.from);
                const toNode = nodeById.get(edge.to);
                if (!toNode) return null;

                const x1 = fromNode ? fromNode.x : cx;
                const y1 = fromNode ? fromNode.y : cy;
                const edgeKey = `${edge.from}-${edge.to}`;
                const branch = branchForId(toNode.branchId);
                const dimmed =
                  selectedNodeId &&
                  !(relatedIds.has(edge.to) && (edge.from === "center" || relatedIds.has(edge.from)));
                const active =
                  !dimmed &&
                  (hoveredEdge === edgeKey ||
                    (selectedNodeId &&
                      relatedIds.has(edge.to) &&
                      (edge.from === "center" || relatedIds.has(edge.from))));

                return (
                  <motion.path
                    key={edgeKey}
                    d={studyBezierPath(x1, y1, toNode.x, toNode.y)}
                    fill="none"
                    stroke={branch.color}
                    strokeWidth={active ? 2.6 : 1.6}
                    strokeLinecap="round"
                    strokeOpacity={dimmed ? 0.06 : active ? 0.95 : 0.32}
                    className={active ? "tron-edge-flow" : undefined}
                    onMouseEnter={() => setHoveredEdge(edgeKey)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    style={{ pointerEvents: "stroke" }}
                  />
                );
              })}
            </svg>

            {title ? (
              <div
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ left: toPercent(cx, w), top: toPercent(cy, h) }}
              >
                <div className="relative flex items-center justify-center">
                  <div
                    className={`organizer-map-center-halo absolute -inset-14 rounded-full${
                      fullscreen ? " organizer-map-center-halo--hero" : ""
                    }`}
                    aria-hidden
                  />
                  <div
                    className={`organizer-map-center-ring absolute -inset-5 rounded-full${
                      fullscreen ? " organizer-map-center-ring--hero" : ""
                    }`}
                    aria-hidden
                  />
                  <div
                    className={`study-map-node tron-node-core organizer-map-center-node relative flex items-center justify-center rounded-full text-center font-bold leading-tight text-[#07131A]${
                      fullscreen ? " organizer-map-center-node--hero" : ""
                    }`}
                    style={{
                      minWidth: fullscreen ? 118 : CENTER_NODE_SIZE,
                      minHeight: fullscreen ? 118 : CENTER_NODE_SIZE,
                      maxWidth: fullscreen ? 260 : 220,
                      padding: fullscreen ? "14px 18px" : "12px 16px",
                      fontSize: title.length > 28 ? "11px" : fullscreen ? "14px" : "13px",
                    }}
                  >
                    <span className="organizer-map-center-node__shine absolute inset-0 rounded-full" aria-hidden />
                    <span className="relative z-[1]">{title}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {layout.nodes.map((node, index) => {
              const branch = branchForId(node.branchId);
              const BranchIcon = branch.icon;
              const dimmed = isDimmed(node.branchId, node.id);
              const selected = selectedNodeId === node.id;
              const related = !selectedNodeId || relatedIds.has(node.id);
              const dragging = nodeDraggingId === node.id;

              return (
                <motion.div
                  key={node.id}
                  data-study-node
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: dragging ? 1.08 : selected ? 1.08 : dimmed ? 0.82 : 1,
                    opacity: dimmed ? 0.12 : related ? 1 : 0.3,
                    filter: dimmed ? "blur(5px)" : "none",
                  }}
                  transition={{ duration: 0.25, delay: index * 0.02 }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: toPercent(node.x, w), top: toPercent(node.y, h) }}
                  onPointerDown={(event) => startNodeDrag(event, node)}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectNode(node, nodeDragStart.current.moved);
                  }}
                >
                  <div
                    className={`study-map-node concept-node tron-node-glass relative w-[min(148px,38vw)] cursor-grab rounded-xl px-3 py-2.5 active:cursor-grabbing ${
                      selected || dragging
                        ? "ring-2 ring-[#00FFD5] shadow-[0_0_32px_rgba(0,255,213,0.5)]"
                        : "hover:shadow-[0_0_24px_rgba(0,255,213,0.3)]"
                    }`}
                    style={{
                      borderColor: branch.color,
                      boxShadow: selected ? `0 12px 36px ${branch.glow}` : undefined,
                    }}
                  >
                    <span
                      className="mb-1.5 flex h-5 w-5 items-center justify-center rounded-md text-[#07131A]"
                      style={{ background: `linear-gradient(135deg, ${branch.color}, rgba(0,191,255,0.8))` }}
                    >
                      <BranchIcon size={10} />
                    </span>
                    <p className="text-[11px] font-semibold leading-4 text-[#F5F7FA]">{node.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && selectedBranch && nodeDetail ? (
            <motion.div
              data-study-panel
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="org-panel-drawer organizer-studio-panel org-panel-scroll-host absolute inset-y-0 right-0 z-50 flex min-h-0 w-[min(100%,400px)] flex-col p-3"
              style={{ touchAction: "pan-y" }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <StudyAssistantPanel
                embedded
                drawer
                node={selectedNode}
                branch={selectedBranch}
                detail={nodeDetail}
                focusMode={focusBranchId === selectedNode.branchId}
                onClose={() => {
                  setSelectedNodeId(null);
                  onNodeSelect?.(null, null);
                }}
                onFocusBranch={() =>
                  setFocusBranchId((c) => (c === selectedNode.branchId ? null : selectedNode.branchId))
                }
                onStudyBranch={() => setBranchStudyOpen(true)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <ConceptMapBranchStudyModal
          open={branchStudyOpen}
          branch={selectedBranch}
          flashcards={branchFlashcards}
          onClose={() => setBranchStudyOpen(false)}
        />
      </div>
    </div>
  );
}

function MapControls({
  onZoom,
  onResetLayout,
  onCenter,
  onFit,
  compact = false,
  floating = false,
  figma = false,
}: {
  onZoom: (delta: number) => void;
  onResetLayout: () => void;
  onCenter: () => void;
  onFit: () => void;
  compact?: boolean;
  floating?: boolean;
  figma?: boolean;
}) {
  if (figma) {
    return (
      <>
        <button type="button" aria-label="Ajustar vista" title="Ajustar vista" onClick={onFit} className="map-controls-figma__btn">
          <Home size={16} />
        </button>
        <button type="button" aria-label="Centrar mapa" title="Centrar mapa" onClick={onCenter} className="map-controls-figma__btn">
          <Crosshair size={16} />
        </button>
        <button type="button" aria-label="Restablecer layout" title="Restablecer layout" onClick={onResetLayout} className="map-controls-figma__btn">
          <RotateCcw size={15} />
        </button>
        <button type="button" aria-label="Acercar" title="Acercar" onClick={() => onZoom(0.12)} className="map-controls-figma__btn">
          <Search size={16} />
        </button>
      </>
    );
  }

  if (floating) {
    return (
      <div className="map-controls-floating__rail flex flex-col gap-1 rounded-2xl p-1.5">
        <IconBtn onClick={onFit} label="Ajustar vista" floating>
          <Home size={15} />
        </IconBtn>
        <IconBtn onClick={onCenter} label="Centrar mapa" floating>
          <Crosshair size={15} />
        </IconBtn>
        <IconBtn onClick={onResetLayout} label="Restablecer layout" floating>
          <RotateCcw size={14} />
        </IconBtn>
        <IconBtn onClick={() => onZoom(0.12)} label="Acercar" floating>
          <Search size={15} />
        </IconBtn>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.9)] p-1 backdrop-blur-md">
        <IconBtn onClick={() => onZoom(-0.08)} label="Alejar"><Minus size={15} /></IconBtn>
        <IconBtn onClick={() => onZoom(0.08)} label="Acercar"><Plus size={15} /></IconBtn>
        <IconBtn onClick={onFit} label="Fit View"><Maximize2 size={13} /></IconBtn>
        <IconBtn onClick={onResetLayout} label="Restablecer"><RotateCcw size={13} /></IconBtn>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.9)] p-2 shadow-[0_0_24px_rgba(0,255,213,0.12)] backdrop-blur-md">
      <div className="flex gap-1">
        <IconBtn onClick={() => onZoom(-0.08)} label="Alejar"><Minus size={15} /></IconBtn>
        <IconBtn onClick={() => onZoom(0.08)} label="Acercar"><Plus size={15} /></IconBtn>
      </div>
      <button type="button" onClick={onFit} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-[#00FFD5] hover:bg-[rgba(0,255,213,0.1)]">
        <Maximize2 size={12} className="mr-1 inline" />
        Fit View
      </button>
      <button type="button" onClick={onCenter} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-[rgba(0,255,213,0.08)] hover:text-[#F5F7FA]">
        <Crosshair size={12} className="mr-1 inline" />
        Centrar mapa
      </button>
      <button type="button" onClick={onResetLayout} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:bg-[rgba(0,255,213,0.08)] hover:text-[#F5F7FA]">
        <RotateCcw size={12} className="mr-1 inline" />
        Restablecer layout
      </button>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  floating = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  floating?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={
        floating
          ? "map-controls-floating__btn flex h-9 w-9 items-center justify-center rounded-xl transition"
          : "flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
      }
    >
      {children}
    </button>
  );
}
