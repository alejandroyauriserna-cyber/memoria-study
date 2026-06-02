"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Map, Minus, Plus, RotateCcw } from "lucide-react";
import { ConceptMapBranchStudyModal } from "@/components/organizers/sections/concept-map-branch-study";
import {
  ConceptMapNodePanel,
  getBranchForNode,
} from "@/components/organizers/sections/concept-map-node-panel";
import {
  branchForId,
  branchSectorPath,
  buildNodeStudyDetail,
  flashcardsForBranch,
  layoutStudyMapNodes,
  nodesInBranch,
  studyBezierPath,
  studyMapViewport,
  type OrganizerStudyContext,
} from "@/lib/organizers/concept-map-study";

export function ConceptMapCanvas({
  title,
  nodes,
  hero = false,
  studyContext = {},
}: {
  title?: string;
  nodes: string[];
  hero?: boolean;
  studyContext?: OrganizerStudyContext;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusBranchId, setFocusBranchId] = useState<number | null>(null);
  const [branchStudyOpen, setBranchStudyOpen] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });

  const { cx, cy, w, h } = studyMapViewport();
  const layout = useMemo(() => layoutStudyMapNodes(title, nodes), [title, nodes]);
  const branchCount = useMemo(
    () => Math.min(6, Math.max(2, Math.ceil(nodes.length / 2))),
    [nodes.length],
  );

  const selectedNode = layout.find((n) => n.id === selectedNodeId) ?? null;
  const selectedBranch = selectedNode ? getBranchForNode(selectedNode) : null;

  const nodeDetail = useMemo(() => {
    if (!selectedNode) return null;
    const siblings = nodesInBranch(layout, selectedNode.branchId);
    return buildNodeStudyDetail(selectedNode, siblings, title, studyContext);
  }, [layout, selectedNode, studyContext, title]);

  const branchFlashcards = useMemo(() => {
    if (!selectedNode) return [];
    return flashcardsForBranch(
      nodesInBranch(layout, selectedNode.branchId),
      studyContext,
      title,
    );
  }, [layout, selectedNode, studyContext, title]);

  const zoom = useCallback((delta: number) => {
    setTransform((current) => ({
      ...current,
      scale: Math.min(2.4, Math.max(0.5, current.scale + delta)),
    }));
  }, []);

  const reset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setFocusBranchId(null);
    setSelectedNodeId(null);
  }, []);

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    zoom(event.deltaY > 0 ? -0.07 : 0.07);
  }

  function onPointerDown(event: React.PointerEvent) {
    if ((event.target as HTMLElement).closest("[data-study-node]")) return;
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

  function isDimmed(nodeBranchId: number) {
    return focusBranchId !== null && focusBranchId !== nodeBranchId;
  }

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div className={hero ? "w-full" : "rounded-[24px] p-1"}>
      {!hero ? (
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Map size={16} className="text-accent" />
            <span className="text-sm font-semibold text-foreground">Mapa de estudio</span>
          </div>
          <CanvasControls onZoom={zoom} onReset={reset} />
        </div>
      ) : null}

      <div
        ref={viewportRef}
        onWheel={onWheel}
        className={`study-map-viewport relative overflow-hidden rounded-2xl ${
          hero ? "h-[min(78vh,620px)] min-h-[420px]" : "h-[min(62vh,520px)] min-h-[360px]"
        }`}
      >
        {hero ? (
          <div className="absolute right-3 top-3 z-20">
            <CanvasControls onZoom={zoom} onReset={reset} />
          </div>
        ) : null}

        {focusBranchId !== null ? (
          <div className="absolute left-3 top-3 z-20 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
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
              transition: dragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" aria-hidden>
              {Array.from({ length: branchCount }).map((_, branchId) => {
                const branch = branchForId(branchId);
                const dimmed = focusBranchId !== null && focusBranchId !== branchId;
                return (
                  <motion.path
                    key={`sector-${branchId}`}
                    d={branchSectorPath(cx, cy, branchId, branchCount, Math.min(w, h) * 0.42)}
                    fill={branch.soft}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: dimmed ? 0.03 : 0.55 }}
                    transition={{ duration: 0.4, delay: branchId * 0.05 }}
                  />
                );
              })}

              {layout.map((node) => {
                const branch = branchForId(node.branchId);
                const dimmed = isDimmed(node.branchId);
                const active =
                  selectedNodeId === node.id ||
                  (focusBranchId !== null && focusBranchId === node.branchId);

                return (
                  <motion.path
                    key={`edge-${node.id}`}
                    d={studyBezierPath(cx, cy, node.x, node.y)}
                    fill="none"
                    stroke={branch.color}
                    strokeWidth={active ? 3.2 : 2.2}
                    strokeLinecap="round"
                    strokeOpacity={dimmed ? 0.08 : active ? 0.9 : 0.5}
                    className={!dimmed ? "tron-edge-flow" : undefined}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: dimmed ? 0.15 : 1,
                      filter: dimmed ? "blur(1px)" : "none",
                    }}
                    transition={{ duration: 0.55, delay: node.branchId * 0.06 }}
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
                  opacity: focusBranchId !== null ? 0.35 : 1,
                  filter: focusBranchId !== null ? "blur(2px)" : "none",
                }}
                transition={{ duration: 0.45, type: "spring", stiffness: 180 }}
                whileHover={{ scale: 1.04 }}
                onClick={() => {
                  setSelectedNodeId(null);
                  setFocusBranchId(null);
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
                style={{ left: toPercent(cx, w), top: toPercent(cy, h) }}
              >
                <div className="relative">
                  <div className="absolute -inset-10 rounded-full bg-[rgba(0,255,213,0.25)] blur-3xl" />
                  <div className="tron-node-core relative flex min-h-[120px] min-w-[120px] max-w-[240px] items-center justify-center rounded-full px-8 py-8 text-center text-base font-bold leading-snug text-[#07131A] sm:min-h-[140px] sm:min-w-[140px] sm:text-lg">
                    {title}
                  </div>
                </div>
              </motion.button>
            ) : null}

            {layout.map((node, index) => {
              const branch = branchForId(node.branchId);
              const BranchIcon = branch.icon;
              const dimmed = isDimmed(node.branchId);
              const selected = selectedNodeId === node.id;

              return (
                <motion.button
                  key={node.id}
                  type="button"
                  data-study-node
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: selected ? 1.12 : dimmed ? 0.88 : 1,
                    opacity: dimmed ? 0.2 : 1,
                    filter: dimmed ? "blur(3px)" : "none",
                  }}
                  transition={{
                    duration: 0.35,
                    delay: 0.08 + index * 0.04,
                    type: "spring",
                    stiffness: 260,
                    damping: 22,
                  }}
                  whileHover={dimmed ? undefined : { scale: selected ? 1.14 : 1.08, y: -3 }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left"
                  style={{ left: toPercent(node.x, w), top: toPercent(node.y, h) }}
                >
                  <div
                    className={`tron-node-glass relative max-w-[160px] rounded-xl px-3.5 py-2.5 transition-shadow ${
                      selected ? "ring-2 ring-[#00FFD5] shadow-[0_0_32px_rgba(0,255,213,0.4)]" : ""
                    }`}
                    style={{
                      borderColor: branch.color,
                      boxShadow: selected
                        ? `0 16px 40px ${branch.glow}`
                        : `0 8px 24px ${branch.glow.replace("0.5", "0.2")}`,
                    }}
                  >
                    <span
                      className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-[#07131A]"
                      style={{ background: `linear-gradient(135deg, ${branch.color}, rgba(0,191,255,0.8))` }}
                    >
                      <BranchIcon size={14} />
                    </span>
                    <p className="text-[11px] font-semibold leading-4 text-[#F5F7FA] sm:text-xs">
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
}: {
  onZoom: (delta: number) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.85)] p-1 shadow-[0_0_24px_rgba(0,255,213,0.12)] backdrop-blur-md">
      <button
        type="button"
        onClick={() => onZoom(-0.1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
        aria-label="Alejar"
      >
        <Minus size={15} />
      </button>
      <button
        type="button"
        onClick={() => onZoom(0.1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#F5F7FA] transition hover:bg-[rgba(0,255,213,0.1)] hover:text-[#00FFD5]"
        aria-label="Acercar"
      >
        <Plus size={15} />
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
