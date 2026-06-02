"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Map, Minus, Plus, RotateCcw } from "lucide-react";
import { OrganizerSectionShell } from "@/components/organizers/sections/organizer-section-shell";

type NodePosition = { x: number; y: number; label: string };

function radialLayout(width: number, height: number, labels: string[]): NodePosition[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.32;

  return labels.map((label, index) => {
    const angle = (2 * Math.PI * index) / labels.length - Math.PI / 2;
    return {
      label,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

export function ConceptMapCanvas({
  title,
  nodes,
}: {
  title?: string;
  nodes: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });

  const width = 720;
  const height = 420;
  const layout = useMemo(() => radialLayout(width, height, nodes), [nodes]);
  const center = { x: width / 2, y: height / 2 };

  const zoom = useCallback((delta: number) => {
    setTransform((current) => ({
      ...current,
      scale: Math.min(2, Math.max(0.6, current.scale + delta)),
    }));
  }, []);

  const reset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  function onPointerDown(event: React.PointerEvent) {
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

  return (
    <OrganizerSectionShell
      title="Mapa conceptual"
      subtitle="Explora con zoom y arrastre"
      icon={<Map size={18} />}
    >
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => zoom(-0.1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted"
          aria-label="Alejar"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => zoom(0.1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted"
          aria-label="Acercar"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          <RotateCcw size={14} /> Restablecer
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative h-[320px] overflow-hidden rounded-[24px] border border-border/70 bg-[radial-gradient(circle_at_center,rgba(31,107,67,0.08),transparent_55%)] sm:h-[420px]"
      >
        <div
          className={`absolute inset-0 touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: "center center",
              transition: dragging ? "none" : "transform 180ms ease",
            }}
          >
            {layout.map((node, index) => (
              <g key={`${node.label}-${index}`}>
                <motion.line
                  x1={center.x}
                  y1={center.y}
                  x2={node.x}
                  y2={node.y}
                  stroke="rgba(31,107,67,0.35)"
                  strokeWidth={2}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                />
              </g>
            ))}

            {title ? (
              <g>
                <circle cx={center.x} cy={center.y} r={58} fill="rgba(31,107,67,0.12)" />
                <circle cx={center.x} cy={center.y} r={46} fill="white" stroke="rgba(31,107,67,0.35)" strokeWidth={2} />
                <foreignObject x={center.x - 70} y={center.y - 24} width={140} height={48}>
                  <div className="flex h-full items-center justify-center px-2 text-center text-xs font-semibold leading-5 text-foreground">
                    {title}
                  </div>
                </foreignObject>
              </g>
            ) : null}

            {layout.map((node, index) => (
              <g key={`node-${node.label}-${index}`}>
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={34}
                  fill="white"
                  stroke="rgba(31,107,67,0.28)"
                  strokeWidth={2}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.35, delay: 0.08 + index * 0.05 }}
                />
                <foreignObject x={node.x - 56} y={node.y - 22} width={112} height={44}>
                  <div className="flex h-full items-center justify-center px-1 text-center text-[11px] font-medium leading-4 text-foreground">
                    {node.label}
                  </div>
                </foreignObject>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </OrganizerSectionShell>
  );
}
