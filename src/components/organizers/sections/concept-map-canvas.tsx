"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Map, Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { ConceptMapBranchStudyModal } from "@/components/organizers/sections/concept-map-branch-study";
import {
  ConceptMapNodePanel,
  getBranchForNode,
} from "@/components/organizers/sections/concept-map-node-panel";
import {
  branchForId,
  buildNodeStudyDetail,
  CENTER_NODE_SIZE,
  computeFitTransform,
  flashcardsForBranch,
  isNodeRelated,
  layoutStudyMapNodes,
  nodesInBranch,
  studyBezierPath,
  type OrganizerStudyContext,
} from "@/lib/organizers/concept-map-study";

export function ConceptMapCanvas({
  title,
  nodes,
  hero = false,
  fullscreen = false,
  studyContext = {},
}: {
  title?: string;
  nodes: string[];
  hero?: boolean;
  fullscreen?: boolean;
  studyContext?: OrganizerStudyContext;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [fitApplied, setFitApplied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusBranchId, setFocusBranchId] = useState<number | null>(null);
  const [branchStudyOpen, setBranchStudyOpen] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });

  const layout = useMemo(() => layoutStudyMapNodes(title, nodes), [title, nodes]);
  const { cx, cy, w, h } = layout;
  const branchCount = useMemo(
    () => Math.min(6, Math.max(2, Math.ceil(nodes.length / 2))),
    [nodes.length],
  );

  const selectedNode = layout.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedBranch = selectedNode ? getBranchForNode(selectedNode) : null;

  const nodeDetail = useMemo(() => {
    if (!selectedNode) return null;
    const siblings = nodesInBranch(layout.nodes, selectedNode.branchId);
    return buildNodeStudyDetail(selectedNode, siblings, title, studyContext);
  }, [layout.nodes, selectedNode, studyContext, title]);

  const branchFlashcards = useMemo(() => {
    if (!selectedNode) return [];
    return flashcardsForBranch(
      nodesInBranch(layout.nodes, selectedNode.branchId),
      studyContext,
      title,
    );
  }, [layout.nodes, selectedNode, studyContext, title]);

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
      return !isNodeRelated(selectedNodeId, nodeId, layout.nodes);
    }
    return focusBranchId !== null && focusBranchId !== nodeBranchId;
  }

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

  const viewportHeight = fullscreen
    ? "h-full min-h-0 flex-1"
    : hero
      ? "h-[min(78vh,620px)] min-h-[360px]"
      : "h-[min(62vh,480px)] min-h-[320px]";

  return (
    <div className={fullscreen ? "flex h-full min-h-0 flex-1 flex-col" : hero ? "w-full" : "rounded-2xl p-1"}>
      {!hero && !fullscreen ? (
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Map size={16} className="text-[#00FFD5]" />
            <span className="text-sm font-semibold text-[#F5F7FA]">Mapa de estudio</span>
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
            Modo enfoque · {branchForId(focusBranchId).name}
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
              {Array.from({ length: branchCount }).map((_, branchId) => {
                const branch = branchForId(branchId);
                const dimmed = focusBranchId !== null && focusBranchId !== branchId;
                return (
                  <motion.path
                    key={`sector-${branchId}`}
                    d={`M ${cx} ${cy} m -${Math.min(w, h) * 0.38} 0 a ${Math.min(w, h) * 0.38} ${Math.min(w, h) * 0.38} 0 1 0 ${Math.min(w, h) * 0.76} 0 a ${Math.min(w, h) * 0.38} ${Math.min(w, h) * 0.38} 0 1 0 -${Math.min(w, h) * 0.76} 0`}
                    fill="none"
                    stroke={branch.color}
                    strokeOpacity={0.04}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: dimmed ? 0.02 : 0.35 }}
                  />
                );
              })}

              {layout.nodes.map((node) => {
                const branch = branchForId(node.branchId);
                const dimmed = isDimmed(node.branchId, node.id);
                const active =
                  selectedNodeId === node.id ||
                  (selectedNodeId && isNodeRelated(selectedNodeId, node.id, layout.nodes)) ||
                  (focusBranchId !== null && focusBranchId === node.branchId);

                return (
                  <motion.path
                    key={`edge-${node.id}`}
                    d={studyBezierPath(cx, cy, node.x, node.y)}
                    fill="none"
                    stroke={branch.color}
                    strokeWidth={active && selectedNodeId ? 2.8 : 1.8}
                    strokeLinecap="round"
                    strokeOpacity={dimmed ? 0.06 : active ? 0.95 : 0.35}
                    className={!dimmed && active ? "tron-edge-flow" : undefined}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: dimmed ? 0.12 : 1,
                      filter: dimmed ? "blur(2px)" : "none",
                    }}
                    transition={{ duration: 0.45, delay: node.branchId * 0.04 }}
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
                  scale: 1,
                  opacity: selectedNodeId && selectedNodeId !== "__center__" ? 0.45 : 1,
                  filter: selectedNodeId && selectedNodeId !== "__center__" ? "blur(1px)" : "none",
                }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => {
                  setSelectedNodeId(null);
                  setFocusBranchId(null);
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ left: toPercent(cx, w), top: toPercent(cy, h) }}
              >
                <div className="relative">
                  <div className="absolute -inset-8 rounded-full bg-[rgba(0,255,213,0.2)] blur-2xl" />
                  <div
                    className="tron-node-core relative flex items-center justify-center rounded-full text-center font-bold leading-tight text-[#07131A]"
                    style={{
                      minWidth: CENTER_NODE_SIZE,
                      minHeight: CENTER_NODE_SIZE,
                      maxWidth: 180,
                      padding: "10px 14px",
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
              const related = selectedNodeId ? isNodeRelated(selectedNodeId, node.id, layout.nodes) : true;

              return (
                <motion.button
                  key={node.id}
                  type="button"
                  data-study-node
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: selected ? 1.08 : dimmed ? 0.85 : 1,
                    opacity: dimmed ? 0.18 : related ? 1 : 0.35,
                    filter: dimmed ? "blur(4px)" : "none",
                  }}
                  transition={{
                    duration: 0.3,
                    delay: 0.04 + index * 0.025,
                    type: "spring",
                    stiffness: 280,
                    damping: 24,
                  }}
                  whileHover={dimmed ? undefined : { scale: selected ? 1.1 : 1.05, y: -2 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedNodeId(node.id);
                    setFocusBranchId(null);
                  }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
                  style={{ left: toPercent(node.x, w), top: toPercent(node.y, h) }}
                >
                  <div
                    className={`tron-node-glass relative max-w-[120px] rounded-lg px-2 py-1.5 transition-all duration-200 ${
                      selected
                        ? "ring-2 ring-[#00FFD5] shadow-[0_0_28px_rgba(0,255,213,0.45)]"
                        : "hover:shadow-[0_0_20px_rgba(0,255,213,0.25)]"
                    }`}
                    style={{
                      borderColor: branch.color,
                      boxShadow: selected ? `0 12px 32px ${branch.glow}` : undefined,
                    }}
                  >
                    <span
                      className="mb-0.5 flex h-5 w-5 items-center justify-center rounded-md text-[#07131A]"
                      style={{ background: `linear-gradient(135deg, ${branch.color}, rgba(0,191,255,0.8))` }}
                    >
                      <BranchIcon size={10} />
                    </span>
                    <p className="text-[10px] font-semibold leading-3.5 text-[#F5F7FA] line-clamp-2">
                      {node.label}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {selectedNode && selectedBranch && nodeDetail ? (
            <ConceptMapNodePanel
              node={selectedNode}
              branch={selectedBranch}
              detail={nodeDetail}
              focusMode={focusBranchId === selectedNode.branchId}
              onClose={() => setSelectedNodeId(null)}
              onFocusBranch={() =>
                setFocusBranchId((current) =>
                  current === selectedNode.branchId ? null : selectedNode.branchId,
                )
              }
              onStudyBranch={() => setBranchStudyOpen(true)}
            />
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
      <button
        type="button"
        onClick={() => onZoom(-0.08)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
        aria-label="Alejar"
      >
        <Minus size={15} />
      </button>
      <button
        type="button"
        onClick={() => onZoom(0.08)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
        aria-label="Acercar"
      >
        <Plus size={15} />
      </button>
      <button
        type="button"
        onClick={onFit}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
        aria-label="Ajustar vista"
      >
        <Maximize2 size={13} />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
        aria-label="Restablecer"
      >
        <RotateCcw size={13} />
      </button>
    </div>
  );
}
