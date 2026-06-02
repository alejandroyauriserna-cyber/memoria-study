"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Map as MapIcon, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { ConceptMapBranchStudyModal } from "@/components/organizers/sections/concept-map-branch-study";
import {
  StudyAssistantPanel,
  getBranchForNode,
} from "@/components/organizers/sections/study-assistant-panel";
import {
  branchForId,
  buildNodeStudyDetail,
  CENTER_NODE_SIZE,
  computeFitTransform,
  flashcardsForBranch,
  getMapEdges,
  getRelatedNodeIds,
  INNER_RADIUS,
  layoutStudyMapNodes,
  nodesInBranch,
  OUTER_RADIUS,
  studyBezierPath,
  type NodeStudyDetail,
  type OrganizerStudyContext,
  type StudyMapNode,
} from "@/lib/organizers/concept-map-study";

export function ConceptMapCanvas({
  title,
  nodes,
  hero = false,
  fullscreen = false,
  externalPanel = false,
  studyContext = {},
  onNodeSelect,
  onConceptStudied,
}: {
  title?: string;
  nodes: string[];
  hero?: boolean;
  fullscreen?: boolean;
  externalPanel?: boolean;
  studyContext?: OrganizerStudyContext;
  onNodeSelect?: (node: StudyMapNode | null, detail: NodeStudyDetail | null) => void;
  onConceptStudied?: (label: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [fitApplied, setFitApplied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [focusBranchId, setFocusBranchId] = useState<number | null>(null);
  const [branchStudyOpen, setBranchStudyOpen] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });

  const layout = useMemo(() => layoutStudyMapNodes(title, nodes), [title, nodes]);
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
    const next = computeFitTransform(rect.width, rect.height, layout);
    setTransform(next);
    setFitApplied(true);
  }, [layout]);

  useLayoutEffect(() => {
    setFitApplied(false);
    setSelectedNodeId(null);
    setFocusBranchId(null);
  }, [layout]);

  useLayoutEffect(() => {
    if (fitApplied) return;
    applyFitView();
    const t = window.setTimeout(applyFitView, 80);
    return () => window.clearTimeout(t);
  }, [applyFitView, fitApplied]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!dragging && !selectedNodeId) applyFitView();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyFitView, dragging, selectedNodeId]);

  const zoom = useCallback((delta: number) => {
    setTransform((current) => ({
      ...current,
      scale: Math.min(2.2, Math.max(0.28, current.scale + delta)),
    }));
  }, []);

  const reset = useCallback(() => {
    applyFitView();
    setFocusBranchId(null);
    setSelectedNodeId(null);
  }, [applyFitView]);

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    zoom(event.deltaY > 0 ? -0.06 : 0.06);
  }

  function onPointerDown(event: React.PointerEvent) {
    if ((event.target as HTMLElement).closest("[data-study-node]")) return;
    if ((event.target as HTMLElement).closest("[data-study-panel]")) return;
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

  function isDimmed(nodeBranchId: number, nodeId: string) {
    if (selectedNodeId) {
      return !relatedIds.has(nodeId);
    }
    return focusBranchId !== null && focusBranchId !== nodeBranchId;
  }

  function selectNode(node: StudyMapNode) {
    setSelectedNodeId(node.id);
    setFocusBranchId(null);
    onConceptStudied?.(node.label);
  }

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

  const viewportHeight = fullscreen
    ? "h-full min-h-0 flex-1"
    : hero
      ? "h-[min(78vh,620px)] min-h-[360px]"
      : "h-[min(62vh,480px)] min-h-[320px]";

  const nodeById = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout.nodes]);

  return (
    <div className={fullscreen ? "flex h-full min-h-0 flex-1 flex-col" : hero ? "w-full" : "rounded-2xl p-1"}>
      {!hero && !fullscreen ? (
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <MapIcon size={16} className="text-[#00FFD5]" />
            <span className="text-sm font-semibold text-[#F5F7FA]">Red de conocimiento</span>
          </div>
          <CanvasControls onZoom={zoom} onReset={reset} onFit={applyFitView} />
        </div>
      ) : null}

      <div
        ref={viewportRef}
        onWheel={onWheel}
        className={`study-map-viewport relative overflow-hidden rounded-2xl ${viewportHeight}`}
      >
        {hero || fullscreen ? (
          <div className="absolute right-3 top-3 z-20">
            <CanvasControls onZoom={zoom} onReset={reset} onFit={applyFitView} />
          </div>
        ) : null}

        {focusBranchId !== null ? (
          <div className="absolute left-3 top-3 z-20 rounded-full border border-[rgba(0,255,213,0.25)] bg-[rgba(7,19,26,0.75)] px-3 py-1 text-[11px] font-medium text-[#00FFD5] backdrop-blur-md">
            Enfoque · {branchForId(focusBranchId).name}
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
              transition: dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" aria-hidden>
              {[INNER_RADIUS, OUTER_RADIUS].map((radius, i) => (
                <circle
                  key={`ring-${i}`}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="rgba(0,255,213,0.06)"
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
                const x2 = toNode.x;
                const y2 = toNode.y;
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
                    d={studyBezierPath(x1, y1, x2, y2)}
                    fill="none"
                    stroke={branch.color}
                    strokeWidth={active ? 2.6 : 1.6}
                    strokeLinecap="round"
                    strokeOpacity={dimmed ? 0.06 : active ? 0.95 : 0.32}
                    className={active ? "tron-edge-flow" : undefined}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: dimmed ? 0.1 : 1,
                      filter: dimmed ? "blur(2px)" : "none",
                    }}
                    transition={{ duration: 0.5 }}
                    onMouseEnter={() => setHoveredEdge(edgeKey)}
                    onMouseLeave={() => setHoveredEdge(null)}
                    style={{ pointerEvents: "stroke" }}
                  />
                );
              })}
            </svg>

            {title ? (
              <motion.button
                type="button"
                data-study-node
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{
                  scale: selectedNodeId ? 0.92 : 1,
                  opacity: selectedNodeId ? 0.55 : 1,
                }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.04 }}
                onClick={() => {
                  setSelectedNodeId(null);
                  setFocusBranchId(null);
                  onNodeSelect?.(null, null);
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ left: toPercent(cx, w), top: toPercent(cy, h) }}
              >
                <div className="relative">
                  <div className="absolute -inset-10 rounded-full bg-[rgba(0,255,213,0.18)] blur-3xl" />
                  <div
                    className="tron-node-core relative flex items-center justify-center rounded-full text-center font-bold leading-tight text-[#07131A] shadow-[0_0_40px_rgba(0,255,213,0.35)]"
                    style={{
                      minWidth: CENTER_NODE_SIZE,
                      minHeight: CENTER_NODE_SIZE,
                      maxWidth: 200,
                      padding: "12px 16px",
                      fontSize: title.length > 28 ? "11px" : "13px",
                    }}
                  >
                    {title}
                  </div>
                </div>
              </motion.button>
            ) : null}

            {layout.nodes.map((node, index) => {
              const branch = branchForId(node.branchId);
              const BranchIcon = branch.icon;
              const dimmed = isDimmed(node.branchId, node.id);
              const selected = selectedNodeId === node.id;
              const related = !selectedNodeId || relatedIds.has(node.id);

              return (
                <motion.button
                  key={node.id}
                  type="button"
                  data-study-node
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: selected ? 1.1 : dimmed ? 0.82 : 1,
                    opacity: dimmed ? 0.12 : related ? 1 : 0.3,
                    filter: dimmed ? "blur(5px)" : "none",
                  }}
                  transition={{
                    duration: 0.3,
                    delay: 0.04 + index * 0.02,
                    type: "spring",
                    stiffness: 280,
                    damping: 24,
                  }}
                  whileHover={dimmed ? undefined : { scale: selected ? 1.12 : 1.06, y: -2 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    selectNode(node);
                  }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
                  style={{ left: toPercent(node.x, w), top: toPercent(node.y, h) }}
                >
                  <div
                    className={`tron-node-glass relative max-w-[128px] rounded-xl px-2.5 py-2 transition-all duration-200 ${
                      selected
                        ? "ring-2 ring-[#00FFD5] shadow-[0_0_32px_rgba(0,255,213,0.5)]"
                        : "hover:shadow-[0_0_24px_rgba(0,255,213,0.3)]"
                    }`}
                    style={{
                      borderColor: branch.color,
                      boxShadow: selected ? `0 12px 36px ${branch.glow}` : undefined,
                    }}
                  >
                    <span
                      className="mb-1 flex h-5 w-5 items-center justify-center rounded-md text-[#07131A]"
                      style={{ background: `linear-gradient(135deg, ${branch.color}, rgba(0,191,255,0.8))` }}
                    >
                      <BranchIcon size={10} />
                    </span>
                    <p className="text-[10px] font-semibold leading-3.5 text-[#F5F7FA] line-clamp-2">
                      {node.label}
                    </p>
                    <span className="mt-1 inline-block rounded px-1 text-[8px] uppercase tracking-wider text-[#00FFD5]/80">
                      {node.ring === 1 ? "Núcleo" : "Detalle"}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {!externalPanel ? (
          <AnimatePresence>
            {selectedNode && selectedBranch && nodeDetail ? (
              <StudyAssistantPanel
                node={selectedNode}
                branch={selectedBranch}
                detail={nodeDetail}
                focusMode={focusBranchId === selectedNode.branchId}
                onClose={() => {
                  setSelectedNodeId(null);
                  onNodeSelect?.(null, null);
                }}
                onFocusBranch={() =>
                  setFocusBranchId((current) =>
                    current === selectedNode.branchId ? null : selectedNode.branchId,
                  )
                }
                onStudyBranch={() => setBranchStudyOpen(true)}
              />
            ) : null}
          </AnimatePresence>
        ) : null}

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

function CanvasControls({
  onZoom,
  onReset,
  onFit,
}: {
  onZoom: (delta: number) => void;
  onReset: () => void;
  onFit: () => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.9)] p-1 shadow-[0_0_24px_rgba(0,255,213,0.12)] backdrop-blur-md">
      <button type="button" onClick={() => onZoom(-0.08)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]" aria-label="Alejar">
        <Minus size={15} />
      </button>
      <button type="button" onClick={() => onZoom(0.08)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]" aria-label="Acercar">
        <Plus size={15} />
      </button>
      <button type="button" onClick={onFit} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]" aria-label="Ajustar vista">
        <Maximize2 size={13} />
      </button>
      <button type="button" onClick={onReset} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]" aria-label="Restablecer">
        <RotateCcw size={13} />
      </button>
    </div>
  );
}
