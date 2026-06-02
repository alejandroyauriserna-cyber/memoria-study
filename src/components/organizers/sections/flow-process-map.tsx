"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Maximize2, Minus, Plus, RotateCcw, Workflow } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";
import {
  flowEdgePath,
  layoutFlowProcess,
  type FlowProcessEdge,
  type FlowProcessNode,
} from "@/lib/organizers/flow-map-layout";

export function FlowProcessMap({
  title,
  nodes,
  edges,
}: {
  title: string;
  nodes: FlowProcessNode[];
  edges: FlowProcessEdge[];
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 24, y: 24, scale: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const [dragging, setDragging] = useState(false);

  const layout = useMemo(() => layoutFlowProcess(nodes, edges), [nodes, edges]);
  const nodeById = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout.nodes]);
  const selected = layout.nodes.find((n) => n.id === selectedId) ?? null;
  const activeId = hoveredId ?? selectedId;

  const applyFit = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = Math.min(1.15, Math.max(0.4, (rect.width - 40) / layout.width));
    setTransform({
      x: Math.max(12, (rect.width - layout.width * scale) / 2),
      y: 20,
      scale,
    });
  }, [layout.width]);

  useLayoutEffect(() => {
    applyFit();
  }, [applyFit]);

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    setTransform((c) => ({
      ...c,
      scale: Math.min(1.6, Math.max(0.35, c.scale + (event.deltaY > 0 ? -0.05 : 0.05))),
    }));
  }

  return (
    <OrganizerFloatPanel title={title} hint="Interactive Legal Flow · BPMN" icon={<Workflow size={17} />} span={12}>
      <div className="relative">
        <div className="absolute right-2 top-2 z-10 flex gap-1">
          <FlowControl onClick={() => setTransform((c) => ({ ...c, scale: Math.min(1.6, c.scale + 0.1) }))} label="Acercar">
            <Plus size={14} />
          </FlowControl>
          <FlowControl onClick={() => setTransform((c) => ({ ...c, scale: Math.max(0.35, c.scale - 0.1) }))} label="Alejar">
            <Minus size={14} />
          </FlowControl>
          <FlowControl onClick={applyFit} label="Fit view">
            <Maximize2 size={13} />
          </FlowControl>
          <FlowControl
            onClick={() => {
              applyFit();
              setSelectedId(null);
            }}
            label="Reset"
          >
            <RotateCcw size={13} />
          </FlowControl>
        </div>

        <div
          ref={viewportRef}
          className="relative h-[min(48vh,380px)] overflow-hidden rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.55)]"
          onWheel={onWheel}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("[data-flow-card]")) return;
            setDragging(true);
            dragStart.current = { x: e.clientX, y: e.clientY, originX: transform.x, originY: transform.y };
          }}
          onPointerMove={(e) => {
            if (!dragging) return;
            setTransform((c) => ({
              ...c,
              x: dragStart.current.originX + (e.clientX - dragStart.current.x),
              y: dragStart.current.originY + (e.clientY - dragStart.current.y),
            }));
          }}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
        >
          <div
            className="absolute origin-top-left"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              cursor: dragging ? "grabbing" : "grab",
            }}
          >
            <svg width={layout.width} height={layout.height} className="overflow-visible">
              {layout.nodes.slice(0, -1).map((from, index) => {
                const to = layout.nodes[index + 1];
                if (!to) return null;
                const active = activeId === from.id || activeId === to.id;
                return (
                  <motion.path
                    key={`${from.id}-${to.id}`}
                    d={flowEdgePath(from, to)}
                    fill="none"
                    stroke={active ? "#00FFD5" : "rgba(0,255,213,0.35)"}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? "tron-edge-flow" : undefined}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                  />
                );
              })}
            </svg>

            {layout.nodes.map((node, index) => {
              const isSelected = selectedId === node.id;
              const isHovered = hoveredId === node.id;
              const prev = node.prevId ? nodeById.get(node.prevId) : null;
              const next = node.nextId ? nodeById.get(node.nextId) : null;

              return (
                <motion.div
                  key={node.id}
                  data-flow-card
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="absolute"
                  style={{ left: node.x, top: node.y, width: node.w }}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : node.id)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      isSelected || isHovered
                        ? "border-[rgba(0,255,213,0.45)] bg-[rgba(0,255,213,0.1)] shadow-[0_0_28px_rgba(0,255,213,0.2)]"
                        : "border-[rgba(0,255,213,0.15)] bg-[rgba(16,39,48,0.92)]"
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
                      Paso {node.stepIndex + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-[#F5F7FA]">{node.label}</p>
                    {isHovered && node.explanation ? (
                      <p className="mt-2 text-[11px] leading-5 text-muted-foreground line-clamp-2">{node.explanation}</p>
                    ) : null}
                  </button>

                  {isSelected ? (
                    <div className="mt-2 space-y-2 rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.6)] p-2.5 text-[11px]">
                      {node.legalBasis ? (
                        <p><span className="text-[#00FFD5]">Fundamento:</span> {node.legalBasis}</p>
                      ) : null}
                      {node.example ? (
                        <p className="text-muted-foreground"><span className="text-[#00FFD5]">Ejemplo:</span> {node.example}</p>
                      ) : null}
                      <div className="flex gap-2 pt-1">
                        {prev ? (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <ArrowLeft size={10} /> {prev.label.slice(0, 24)}
                          </span>
                        ) : null}
                        {next ? (
                          <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                            {next.label.slice(0, 24)} <ArrowRight size={10} />
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </OrganizerFloatPanel>
  );
}

function FlowControl({
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
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] text-[#F5F7FA] hover:text-[#00FFD5]"
    >
      {children}
    </button>
  );
}
