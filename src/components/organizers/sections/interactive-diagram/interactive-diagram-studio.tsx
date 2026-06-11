"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileDown,
  FileImage,
  FileText,
  LayoutGrid,
  Maximize2,
  Minus,
  Plus,
  Presentation,
  RotateCcw,
  Share2,
} from "lucide-react";
import { InteractiveDiagramPanel } from "@/components/organizers/sections/interactive-diagram/interactive-diagram-panel";
import {
  diagramConnectorPath,
  diagramRadialPath,
} from "@/components/organizers/sections/interactive-diagram/diagram-connector-path";
import { buildDiagramNodeDetail } from "@/lib/organizers/visual-ai-diagram/build-diagram-node-detail";
import {
  computeDiagramLayout,
  getDescendantIds,
  type DiagramLayout,
  type LayoutNode,
} from "@/lib/organizers/visual-ai-diagram/compute-diagram-layout";
import {
  downloadSvgFile,
  printDiagramAsPdf,
  rasterizeSvgToPng,
} from "@/lib/organizers/visual-ai-diagram/export-diagram";
import {
  applyInteractiveLayout,
  buildLayoutStateFromNodes,
} from "@/lib/organizers/visual-ai-diagram/interactive-layout-state";
import { layoutToExportSvg } from "@/lib/organizers/visual-ai-diagram/layout-to-svg";
import { NODE_TIER_SIZE } from "@/lib/organizers/visual-ai-diagram/diagram-theme";
import type { InteractiveDiagramLayoutState, VisualAiFormatId } from "@/lib/organizers/visual-ai-types";
import type { OrganizerContent } from "@/lib/organizers/parse-content";

type Transform = { x: number; y: number; scale: number };

function fitTransform(viewW: number, viewH: number, layout: DiagramLayout, padding = 48): Transform {
  const bounds = layout.nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.x),
      minY: Math.min(acc.minY, node.y),
      maxX: Math.max(acc.maxX, node.x + node.w),
      maxY: Math.max(acc.maxY, node.y + node.h),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
  const contentW = bounds.maxX - bounds.minX + padding * 2;
  const contentH = bounds.maxY - bounds.minY + padding * 2;
  const scale = Math.min(1.2, Math.max(0.35, Math.min((viewW - 24) / contentW, (viewH - 24) / contentH)));
  return {
    x: (viewW - contentW * scale) / 2 - bounds.minX * scale + padding * scale,
    y: (viewH - contentH * scale) / 2 - bounds.minY * scale + padding * scale,
    scale,
  };
}

export function InteractiveDiagramStudio({
  organizerId,
  organizerTitle,
  formatId,
  content,
  savedLayout,
  onLayoutSaved,
}: {
  organizerId: string;
  organizerTitle: string;
  formatId: VisualAiFormatId;
  content: OrganizerContent;
  savedLayout?: InteractiveDiagramLayoutState | null;
  onLayoutSaved?: (content: unknown) => void;
}) {
  const baseLayout = useMemo(() => computeDiagramLayout(formatId, content), [formatId, content]);
  const [nodes, setNodes] = useState<LayoutNode[]>(() =>
    applyInteractiveLayout(baseLayout, savedLayout).nodes,
  );
  const [edges, setEdges] = useState(() => applyInteractiveLayout(baseLayout, savedLayout).edges);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(savedLayout?.collapsedGroups ?? []);
  const [transform, setTransform] = useState<Transform>({ x: 40, y: 40, scale: 0.85 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [exporting, setExporting] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const dragNode = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layout: DiagramLayout = useMemo(
    () => ({ ...baseLayout, nodes, edges }),
    [baseLayout, nodes, edges],
  );

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const selectedNode = selectedId ? nodeById.get(selectedId) ?? null : null;
  const nodeDetail = useMemo(() => {
    if (!selectedNode) return null;
    return buildDiagramNodeDetail(selectedNode, nodes, content, organizerTitle);
  }, [selectedNode, nodes, content, organizerTitle]);

  const applyFit = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTransform(fitTransform(rect.width, rect.height, layout));
  }, [layout]);

  useEffect(() => {
    applyFit();
  }, [applyFit, baseLayout.formatId]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => applyFit());
    observer.observe(el);
    return () => observer.disconnect();
  }, [applyFit]);

  const persistLayout = useCallback(
    (nextNodes: LayoutNode[], nextCollapsed: string[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const state = buildLayoutStateFromNodes(nextNodes, nextCollapsed);
        try {
          const response = await fetch(`/api/organizers/${organizerId}/visual-ai/layout`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ format: formatId, interactiveLayout: state }),
          });
          const payload = await response.json();
          if (response.ok) onLayoutSaved?.(payload.organizer?.content);
        } catch {
          /* silent — local state still works */
        }
      }, 900);
    },
    [formatId, onLayoutSaved, organizerId],
  );

  const updateNodes = useCallback(
    (updater: (current: LayoutNode[]) => LayoutNode[]) => {
      setNodes((current) => {
        const next = updater(current);
        persistLayout(next, collapsedGroups);
        return next;
      });
    },
    [collapsedGroups, persistLayout],
  );

  const reorganize = useCallback(() => {
    const fresh = applyInteractiveLayout(baseLayout, null);
    setNodes(fresh.nodes);
    setEdges(fresh.edges);
    setCollapsedGroups([]);
    setSelectedId(null);
    setPanelOpen(false);
    persistLayout(fresh.nodes, []);
    requestAnimationFrame(applyFit);
  }, [applyFit, baseLayout, persistLayout]);

  const toggleCollapse = useCallback(
    (groupId: string) => {
      setCollapsedGroups((current) => {
        const next = current.includes(groupId)
          ? current.filter((id) => id !== groupId)
          : [...current, groupId];
        const applied = applyInteractiveLayout(baseLayout, {
          positions: buildLayoutStateFromNodes(nodes, current).positions,
          collapsedGroups: next,
          updatedAt: new Date().toISOString(),
        });
        setNodes(applied.nodes);
        setEdges(applied.edges);
        persistLayout(applied.nodes, next);
        return next;
      });
    },
    [baseLayout, nodes, persistLayout],
  );

  const onWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.06 : 0.06;
    setTransform((t) => ({ ...t, scale: Math.min(2, Math.max(0.3, t.scale + delta)) }));
  }, []);

  const onPointerDownCanvas = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest(".interactive-diagram-node")) return;
    setPanning(true);
    panStart.current = { x: event.clientX, y: event.clientY, originX: transform.x, originY: transform.y };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (dragNode.current) {
      const { id, offsetX, offsetY } = dragNode.current;
      const scale = transform.scale;
      const x = (event.clientX - viewportRef.current!.getBoundingClientRect().left - transform.x) / scale - offsetX;
      const y = (event.clientY - viewportRef.current!.getBoundingClientRect().top - transform.y) / scale - offsetY;
      updateNodes((current) => current.map((n) => (n.id === id ? { ...n, x, y } : n)));
      return;
    }
    if (!panning) return;
    setTransform((t) => ({
      ...t,
      x: panStart.current.originX + (event.clientX - panStart.current.x),
      y: panStart.current.originY + (event.clientY - panStart.current.y),
    }));
  };

  const onPointerUp = () => {
    setPanning(false);
    dragNode.current = null;
  };

  const onNodePointerDown = (event: React.PointerEvent, node: LayoutNode) => {
    event.stopPropagation();
    const rect = viewportRef.current!.getBoundingClientRect();
    const scale = transform.scale;
    const pointerX = (event.clientX - rect.left - transform.x) / scale;
    const pointerY = (event.clientY - rect.top - transform.y) / scale;
    dragNode.current = { id: node.id, offsetX: pointerX - node.x, offsetY: pointerY - node.y };
    setSelectedId(node.id);
  };

  const onNodeClick = (node: LayoutNode) => {
    setSelectedId(node.id);
    setPanelOpen(true);
  };

  const presentationNodes = nodes.filter((n) => n.id !== "axis");
  const presentationNode = presentationNodes[presentationIndex] ?? null;
  const presentationDetail = useMemo(() => {
    if (!presentationNode) return null;
    return buildDiagramNodeDetail(presentationNode, nodes, content, organizerTitle);
  }, [presentationNode, nodes, content, organizerTitle]);

  useEffect(() => {
    const applied = applyInteractiveLayout(baseLayout, savedLayout);
    setNodes(applied.nodes);
    setEdges(applied.edges);
    setCollapsedGroups(savedLayout?.collapsedGroups ?? []);
  }, [baseLayout, savedLayout]);

  const exportLayout = useMemo(() => layout, [layout]);

  const downloadPng = async () => {
    setExporting("png");
    try {
      const svg = layoutToExportSvg(exportLayout);
      const blob = await rasterizeSvgToPng(svg, layout.width, layout.height, 2);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `diagrama-${formatId}@2x.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const downloadSvg = () => {
    setExporting("svg");
    downloadSvgFile(layoutToExportSvg(exportLayout), `diagrama-${formatId}`);
    setExporting(null);
  };

  const downloadPdf = () => {
    setExporting("pdf");
    printDiagramAsPdf(layoutToExportSvg(exportLayout), `${layout.title} · MemoriaStudy`);
    setExporting(null);
  };

  const shareLink = async () => {
    try {
      const response = await fetch(`/api/organizers/${organizerId}/share`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo compartir.");
      const url = `${payload.shareUrl}&visualAi=${formatId}`;
      await navigator.clipboard.writeText(url);
      setShareNotice("Enlace copiado al portapapeles.");
    } catch (caught) {
      setShareNotice(caught instanceof Error ? caught.message : "Error al compartir.");
    }
  };

  const minimapScale = 0.08;
  const minimapNodes = nodes.map((n) => ({
    id: n.id,
    x: n.x * minimapScale,
    y: n.y * minimapScale,
    w: Math.max(8, n.w * minimapScale),
    h: Math.max(6, n.h * minimapScale),
    tier: n.tier,
  }));

  const radial = formatId === "mindMap";

  return (
    <div className={`interactive-diagram-studio${presentation ? " is-presentation" : ""}`}>
      <div className="interactive-diagram-toolbar-top">
        <div>
          <p className="interactive-diagram-toolbar-top__kicker">Diagram Engine · Interactivo</p>
          <h3 className="interactive-diagram-toolbar-top__title">{layout.title}</h3>
        </div>
        <div className="visual-ai-toolbar visual-ai-toolbar--studio interactive-diagram-toolbar-top__actions">
          <div className="visual-ai-toolbar__group" aria-label="Zoom y vista">
            <button
              type="button"
              className="visual-ai-tool"
              onClick={() => setTransform((t) => ({ ...t, scale: Math.min(2, t.scale + 0.1) }))}
              title="Acercar"
              aria-label="Acercar"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="visual-ai-tool"
              onClick={() => setTransform((t) => ({ ...t, scale: Math.max(0.3, t.scale - 0.1) }))}
              title="Alejar"
              aria-label="Alejar"
            >
              <Minus size={16} />
            </button>
            <button type="button" className="visual-ai-tool" onClick={applyFit} title="Reencuadrar" aria-label="Reencuadrar">
              <Maximize2 size={16} />
            </button>
            <button
              type="button"
              className="visual-ai-tool"
              onClick={reorganize}
              title="Reorganizar automáticamente"
              aria-label="Reorganizar"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="visual-ai-toolbar__group" aria-label="Presentar y compartir">
            <button
              type="button"
              className="visual-ai-tool"
              onClick={() => setPresentation(true)}
              title="Modo presentación"
              aria-label="Modo presentación"
            >
              <Presentation size={16} />
            </button>
            <button type="button" className="visual-ai-tool" onClick={shareLink} title="Compartir enlace" aria-label="Compartir">
              <Share2 size={16} />
            </button>
          </div>
          <div className="visual-ai-toolbar__group" aria-label="Exportar">
            <button
              type="button"
              className="visual-ai-tool"
              onClick={downloadPng}
              disabled={Boolean(exporting)}
              title="PNG retina"
              aria-label="Exportar PNG"
            >
              <FileImage size={16} />
            </button>
            <button
              type="button"
              className="visual-ai-tool"
              onClick={downloadSvg}
              disabled={Boolean(exporting)}
              title="SVG vectorial"
              aria-label="Exportar SVG"
            >
              <FileDown size={16} />
            </button>
            <button
              type="button"
              className="visual-ai-tool"
              onClick={downloadPdf}
              disabled={Boolean(exporting)}
              title="PDF premium"
              aria-label="Exportar PDF"
            >
              <FileText size={16} />
            </button>
          </div>
        </div>
      </div>

      {shareNotice ? <p className="interactive-diagram-notice">{shareNotice}</p> : null}

      <div className="interactive-diagram-workspace">
        <div
          ref={viewportRef}
          className="visual-ai-canvas interactive-diagram-viewport"
          onWheel={onWheel}
          onPointerDown={onPointerDownCanvas}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="interactive-diagram-world"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          >
            <svg
              className="interactive-diagram-edges"
              width={layout.width}
              height={layout.height}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
            >
              {edges.map((edge) => {
                const from = nodeById.get(edge.from);
                const to = nodeById.get(edge.to);
                if (!from || !to) return null;
                const d = radial ? diagramRadialPath(from, to) : diagramConnectorPath(from, to);
                return (
                  <path
                    key={edge.id}
                    d={d}
                    className="interactive-diagram-edge"
                    data-from={edge.from}
                    data-to={edge.to}
                  />
                );
              })}
            </svg>

            {nodes.map((node) => {
              if (node.id === "axis") return null;
              const spec = NODE_TIER_SIZE[node.tier];
              const hasChildren = baseLayout.edges.some((e) => e.from === node.id);
              const collapsed = collapsedGroups.includes(node.id);
              return (
                <div
                  key={node.id}
                  className={`visual-ai-node interactive-diagram-node${node.tier === "root" ? " visual-ai-node--root interactive-diagram-node--root" : ""}${selectedId === node.id ? " is-selected" : ""}`}
                  style={{ left: node.x, top: node.y, width: node.w, minHeight: node.h }}
                  onPointerDown={(e) => onNodePointerDown(e, node)}
                  onClick={() => onNodeClick(node)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onNodeClick(node);
                  }}
                >
                  <span className="interactive-diagram-node__icon">{spec.icon}</span>
                  <span className="interactive-diagram-node__label">{node.label}</span>
                  {hasChildren ? (
                    <button
                      type="button"
                      className="interactive-diagram-node__collapse"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(node.id);
                      }}
                      title={collapsed ? "Expandir rama" : "Colapsar rama"}
                    >
                      {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="interactive-diagram-minimap" aria-hidden>
            <div className="interactive-diagram-minimap__label">
              <LayoutGrid size={10} />
              Overview
            </div>
            <svg width={layout.width * minimapScale} height={layout.height * minimapScale}>
              {minimapNodes.map((n) => (
                <rect
                  key={n.id}
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={3}
                  className={`interactive-diagram-minimap__node interactive-diagram-minimap__node--${n.tier}`}
                />
              ))}
            </svg>
          </div>
        </div>

        <InteractiveDiagramPanel open={panelOpen} detail={nodeDetail} onClose={() => setPanelOpen(false)} />
      </div>

      <AnimatePresence>
        {presentation && presentationNode ? (
          <motion.div
            className="interactive-diagram-presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" className="interactive-diagram-presentation__close" onClick={() => setPresentation(false)}>
              Salir
            </button>
            <p className="interactive-diagram-presentation__step">
              {presentationIndex + 1} / {presentationNodes.length}
            </p>
            <h2>{presentationNode.label}</h2>
            {presentationDetail ? <p>{presentationDetail.simpleExplanation}</p> : null}
            <div className="interactive-diagram-presentation__nav">
              <button
                type="button"
                onClick={() => setPresentationIndex((i) => Math.max(0, i - 1))}
                disabled={presentationIndex === 0}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => {
                  if (presentationNode) {
                    setSelectedId(presentationNode.id);
                    setPanelOpen(true);
                    setPresentation(false);
                  }
                }}
              >
                <Copy size={14} /> Ver detalle
              </button>
              <button
                type="button"
                onClick={() =>
                  setPresentationIndex((i) => Math.min(presentationNodes.length - 1, i + 1))
                }
                disabled={presentationIndex >= presentationNodes.length - 1}
              >
                Siguiente
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
