"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, RotateCcw, Workflow, X } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";
import {
  flowEdgePath,
  layoutFlowProcess,
  type FlowProcessEdge,
  type FlowProcessNode,
} from "@/lib/organizers/flow-map-layout";

function FlowNodePanel({
  node,
  onClose,
}: {
  node: FlowProcessNode;
  onClose: () => void;
}) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute bottom-3 left-3 right-3 z-20 rounded-2xl border border-[rgba(0,255,213,0.25)] bg-[rgba(16,39,48,0.9)] p-4 shadow-[0_0_32px_rgba(0,255,213,0.12)] backdrop-blur-xl sm:left-auto sm:right-4 sm:w-[min(100%,360px)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-[#F5F7FA]">{node.label}</h4>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-[#00FFD5]">
          <X size={16} />
        </button>
      </div>
      {node.explanation ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{node.explanation}</p>
      ) : null}
      {node.legalBasis ? (
        <div className="mt-3 rounded-lg bg-[rgba(0,255,213,0.06)] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">Fundamento jurídico</p>
          <p className="mt-1 text-xs leading-5 text-[#F5F7FA]">{node.legalBasis}</p>
        </div>
      ) : null}
      {node.example ? (
        <div className="mt-3 rounded-lg border border-[rgba(0,255,213,0.1)] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">Ejemplo</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{node.example}</p>
        </div>
      ) : null}
      {node.relatedConcepts?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {node.relatedConcepts.map((concept) => (
            <span key={concept} className="rounded-md bg-[rgba(0,255,213,0.08)] px-2 py-0.5 text-[10px] text-[#F5F7FA]">
              {concept}
            </span>
          ))}
        </div>
      ) : null}
    </motion.aside>
  );
}

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
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const [dragging, setDragging] = useState(false);

  const layout = useMemo(() => layoutFlowProcess(nodes, edges), [nodes, edges]);
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;
  const nodeById = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout.nodes]);

  const applyFit = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = Math.min(1.2, Math.max(0.45, (rect.width - 48) / layout.width));
    setTransform({
      x: Math.max(16, (rect.width - layout.width * scale) / 2),
      y: 24,
      scale,
    });
  }, [layout.width]);

  useLayoutEffect(() => {
    applyFit();
  }, [applyFit]);

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    setTransform((current) => ({
      ...current,
      scale: Math.min(1.8, Math.max(0.35, current.scale + (event.deltaY > 0 ? -0.06 : 0.06))),
    }));
  }

  return (
    <OrganizerFloatPanel title={title} hint="Mapa de proceso · zoom y clic en nodos" icon={<Workflow size={17} />} span={12}>
      <div className="relative">
        <div className="absolute right-2 top-2 z-10 flex gap-1">
          <button type="button" onClick={() => setTransform((c) => ({ ...c, scale: Math.min(1.8, c.scale + 0.12) }))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] text-[#F5F7FA] hover:text-[#00FFD5]">
            <Plus size={14} />
          </button>
          <button type="button" onClick={() => setTransform((c) => ({ ...c, scale: Math.max(0.35, c.scale - 0.12) }))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] text-[#F5F7FA] hover:text-[#00FFD5]">
            <Minus size={14} />
          </button>
          <button type="button" onClick={applyFit} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(0,255,213,0.15)] text-[#F5F7FA] hover:text-[#00FFD5]">
            <RotateCcw size={14} />
          </button>
        </div>

        <div
          ref={viewportRef}
          className="relative h-[min(52vh,420px)] overflow-hidden rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.55)]"
          onWheel={onWheel}
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).closest("[data-flow-node]")) return;
            setDragging(true);
            dragStart.current = { x: event.clientX, y: event.clientY, originX: transform.x, originY: transform.y };
          }}
          onPointerMove={(event) => {
            if (!dragging) return;
            setTransform((current) => ({
              ...current,
              x: dragStart.current.originX + (event.clientX - dragStart.current.x),
              y: dragStart.current.originY + (event.clientY - dragStart.current.y),
            }));
          }}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
        >
          <svg
            width="100%"
            height="100%"
            className="select-none"
            style={{ cursor: dragging ? "grabbing" : "grab" }}
          >
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {edges.map((edge, index) => {
                const from = nodeById.get(edge.from);
                const to = nodeById.get(edge.to);
                if (!from || !to) return null;
                return (
                  <g key={`${edge.from}-${edge.to}-${index}`}>
                    <motion.path
                      d={flowEdgePath(from, to)}
                      fill="none"
                      stroke="rgba(0,255,213,0.35)"
                      strokeWidth={2}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                    />
                    {edge.label ? (
                      <text
                        x={(from.x + to.x + from.w / 2 + to.w / 2) / 2}
                        y={(from.y + to.y + from.h) / 2}
                        fill="rgba(0,255,213,0.7)"
                        fontSize={10}
                        textAnchor="middle"
                      >
                        {edge.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}

              {layout.nodes.map((node, index) => (
                <g key={node.id} data-flow-node transform={`translate(${node.x}, ${node.y})`}>
                  <motion.rect
                    width={node.w}
                    height={node.h}
                    rx={14}
                    fill={selectedId === node.id ? "rgba(0,255,213,0.18)" : "rgba(16,39,48,0.92)"}
                    stroke={selectedId === node.id ? "#00FFD5" : "rgba(0,255,213,0.25)"}
                    strokeWidth={selectedId === node.id ? 2 : 1}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.04 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(node.id)}
                  />
                  <text
                    x={node.w / 2}
                    y={node.h / 2}
                    fill="#F5F7FA"
                    fontSize={11}
                    fontWeight={600}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="pointer-events-none"
                  >
                    {node.label.length > 28 ? `${node.label.slice(0, 26)}…` : node.label}
                  </text>
                </g>
              ))}
            </g>
          </svg>

          <AnimatePresence>
            {selectedNode ? <FlowNodePanel node={selectedNode} onClose={() => setSelectedId(null)} /> : null}
          </AnimatePresence>
        </div>
      </div>
    </OrganizerFloatPanel>
  );
}
