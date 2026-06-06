"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Gavel,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Scale,
  Sparkles,
} from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";
import {
  computeFlowFitTransform,
  flowEdgePath,
  layoutFlowProcess,
  type FlowProcessEdge,
  type FlowProcessNode,
} from "@/lib/organizers/flow-map-layout";
import {
  buildFlowStepDetail,
  type EnrichedStudyContext,
} from "@/lib/organizers/study-content";

export function FlowProcessMap({
  title,
  nodes,
  edges,
  studyContext,
  bare = false,
}: {
  title: string;
  nodes: FlowProcessNode[];
  edges: FlowProcessEdge[];
  studyContext?: EnrichedStudyContext;
  bare?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 24, y: 24, scale: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(() => nodes[0]?.id ?? null);
  const [showAnswer, setShowAnswer] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const [dragging, setDragging] = useState(false);

  const layout = useMemo(() => layoutFlowProcess(nodes, edges), [nodes, edges]);
  const nodeById = useMemo(() => new Map(layout.nodes.map((n) => [n.id, n])), [layout.nodes]);
  const selected = layout.nodes.find((n) => n.id === selectedId) ?? null;

  const stepDetail = useMemo(() => {
    if (!selected || !studyContext) return null;
    return buildFlowStepDetail(
      selected,
      selected.stepIndex,
      layout.nodes.length,
      studyContext,
    );
  }, [selected, studyContext, layout.nodes.length]);

  const applyFit = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTransform(
      computeFlowFitTransform(rect.width, rect.height, layout.width, layout.height, 20),
    );
  }, [layout.width, layout.height]);

  useLayoutEffect(() => {
    applyFit();
  }, [applyFit]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => applyFit());
    observer.observe(el);
    return () => observer.disconnect();
  }, [applyFit]);

  useEffect(() => {
    setShowAnswer(false);
  }, [selectedId]);

  function selectStep(id: string) {
    setSelectedId(id);
  }

  function goPrev() {
    if (selected?.prevId) selectStep(selected.prevId);
  }

  function goNext() {
    if (selected?.nextId) selectStep(selected.nextId);
  }

  function onWheel(event: React.WheelEvent) {
    event.preventDefault();
    setTransform((c) => ({
      ...c,
      scale: Math.min(1.8, Math.max(0.4, c.scale + (event.deltaY > 0 ? -0.05 : 0.05))),
    }));
  }

  const body = (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="org-panel-kicker flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
          <Sparkles size={12} />
          Simulación de razonamiento jurídico
        </p>
        <div className="flex gap-1">
          <FlowControl onClick={() => setTransform((c) => ({ ...c, scale: Math.min(1.8, c.scale + 0.1) }))} label="Acercar">
            <Plus size={14} />
          </FlowControl>
          <FlowControl onClick={() => setTransform((c) => ({ ...c, scale: Math.max(0.4, c.scale - 0.1) }))} label="Alejar">
            <Minus size={14} />
          </FlowControl>
          <FlowControl onClick={applyFit} label="Fit view">
            <Maximize2 size={13} />
          </FlowControl>
          <FlowControl onClick={applyFit} label="Restablecer">
            <RotateCcw size={13} />
          </FlowControl>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="org-panel-viewport relative h-[min(36vh,280px)] min-h-[200px]"
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
              const active = selectedId === from.id || selectedId === to.id;
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
            const isPast = selected && node.stepIndex < selected.stepIndex;

            return (
              <motion.div
                key={node.id}
                data-flow-card
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="absolute"
                style={{ left: node.x, top: node.y, width: node.w }}
              >
                <button
                  type="button"
                  onClick={() => selectStep(node.id)}
                  className={`org-panel-card w-full rounded-2xl p-3 text-left transition ${
                    isSelected
                      ? "org-panel-card--selected"
                      : isPast
                        ? "org-panel-card--past"
                        : "hover:border-[var(--org-accent-border-strong)]"
                  }`}
                >
                  <p className="org-panel-kicker text-[10px] font-semibold uppercase tracking-[0.14em]">
                    Paso {node.stepIndex + 1}
                  </p>
                  <p className="org-panel-title mt-1 text-sm font-semibold leading-snug">{node.label}</p>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selected && stepDetail ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="org-panel-detail space-y-3 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="org-panel-kicker text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Paso {selected.stepIndex + 1} de {layout.nodes.length}
                </p>
                <h4 className="org-panel-title mt-1 text-base font-bold">{selected.label}</h4>
              </div>
              <p className="max-w-xs rounded-lg border border-[rgba(255,138,0,0.25)] bg-[rgba(255,138,0,0.08)] px-2.5 py-1.5 text-[11px] leading-5 text-amber-100">
                {stepDetail.reasoningPrompt}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FlowDetailBlock icon={<Lightbulb size={12} />} label="Explicación sencilla" color="#00BFFF">
                {stepDetail.simpleExplanation}
              </FlowDetailBlock>
              <FlowDetailBlock icon={<Scale size={12} />} label="Fundamento jurídico" color="#00FFD5">
                {stepDetail.legalBasis}
              </FlowDetailBlock>
              <FlowDetailBlock icon={<GraduationCap size={12} />} label="Ejemplo práctico" color="#00FFD5">
                {stepDetail.practicalExample}
              </FlowDetailBlock>
              <FlowDetailBlock icon={<HelpCircle size={12} />} label="Pregunta de examen" color="#FF8A00">
                {stepDetail.examQuestion}
                {showAnswer ? (
                  <p className="org-panel-text-muted mt-2 rounded-lg bg-[var(--org-accent-soft)] p-2 text-xs">
                    {stepDetail.examAnswer}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="org-panel-kicker mt-2 text-xs font-semibold hover:underline"
                  >
                    Revelar respuesta
                  </button>
                )}
              </FlowDetailBlock>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[rgba(0,255,213,0.1)] pt-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={!selected.prevId}
                className="flex items-center gap-1 rounded-xl border border-[rgba(0,255,213,0.15)] px-3 py-2 text-xs font-semibold text-[#F5F7FA] transition hover:text-[#00FFD5] disabled:opacity-40"
              >
                <ArrowLeft size={14} />
                Paso anterior
              </button>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {selected.prevId ? nodeById.get(selected.prevId)?.label.slice(0, 28) : "Inicio"}
                {" → "}
                {selected.nextId ? nodeById.get(selected.nextId)?.label.slice(0, 28) : "Fin"}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={!selected.nextId}
                className="flex items-center gap-1 rounded-xl bg-[rgba(0,255,213,0.12)] px-3 py-2 text-xs font-semibold text-[#00FFD5] transition hover:bg-[rgba(0,255,213,0.2)] disabled:opacity-40"
              >
                Paso siguiente
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        ) : selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-[rgba(0,255,213,0.12)] p-4 text-sm text-muted-foreground"
          >
            {selected.explanation ?? `Selecciona y recorre el paso «${selected.label}» del proceso jurídico.`}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );

  if (bare) return body;

  return (
    <OrganizerFloatPanel title={title} hint="Simulación de razonamiento jurídico" icon={<Gavel size={17} />} span={12}>
      {body}
    </OrganizerFloatPanel>
  );
}

function FlowDetailBlock({
  icon,
  label,
  color,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="org-panel-block p-3">
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
        {icon}
        {label}
      </p>
      <div className="org-panel-text-soft text-sm leading-6">{children}</div>
    </div>
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
      className="org-panel-control"
    >
      {children}
    </button>
  );
}
