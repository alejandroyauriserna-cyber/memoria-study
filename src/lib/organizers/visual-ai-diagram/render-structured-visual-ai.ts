import dagre from "@dagrejs/dagre";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import {
  NODE_TIER_SIZE,
  type NodeTier,
} from "@/lib/organizers/visual-ai-diagram/diagram-theme";
import {
  extractComparisonData,
  extractConceptMapData,
  extractMindMapData,
  extractTimelineData,
  type DiagramEdge,
} from "@/lib/organizers/visual-ai-diagram/extract-diagram-data";
import {
  escapeXml,
  footerNote,
  headerBar,
  MS2026,
  panelCard,
  premiumNode,
  svgDoc,
  whimsicalConnector,
  wrapText,
} from "@/lib/organizers/visual-ai-diagram/svg-primitives";

function conceptMapTier(nodeId: string, edges: DiagramEdge[]): NodeTier {
  if (nodeId === "root") return "root";
  if (edges.some((e) => e.from === "root" && e.to === nodeId)) return "primary";
  const childCount = edges.filter((e) => e.from === nodeId).length;
  return childCount > 0 ? "secondary" : "tertiary";
}

function renderConceptMapSvg(data: ReturnType<typeof extractConceptMapData>) {
  const width = 1200;
  const height = 1200;
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 88, ranksep: 112, marginx: 72, marginy: 56 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of data.nodes) {
    const tier = conceptMapTier(node.id, data.edges);
    const spec = NODE_TIER_SIZE[tier];
    g.setNode(node.id, { width: spec.w + 16, height: spec.h + 20, label: node.label });
  }
  for (const edge of data.edges) {
    if (g.hasNode(edge.from) && g.hasNode(edge.to)) {
      g.setEdge(edge.from, edge.to, { label: edge.label ?? "" });
    }
  }

  dagre.layout(g);

  let minX = Infinity;
  let minY = Infinity;
  g.nodes().forEach((id) => {
    const n = g.node(id);
    minX = Math.min(minX, n.x - n.width / 2);
    minY = Math.min(minY, n.y - n.height / 2);
  });

  const offsetX = 56 - minX;
  const offsetY = 176 - minY;

  const boxes = data.nodes
    .map((node) => {
      const pos = g.node(node.id);
      if (!pos) return "";
      const tier = conceptMapTier(node.id, data.edges);
      const spec = NODE_TIER_SIZE[tier];
      const x = pos.x - spec.w / 2 + offsetX;
      const y = pos.y - spec.h / 2 + offsetY;
      return premiumNode(x, y, node.label, tier, {
        stroke: tier === "root" ? MS2026.accent : tier === "primary" ? MS2026.violet : MS2026.border,
      });
    })
    .join("");

  const connectors = data.edges
    .map((edge) => {
      const from = g.node(edge.from);
      const to = g.node(edge.to);
      if (!from || !to) return "";
      const fromTier = conceptMapTier(edge.from, data.edges);
      const toTier = conceptMapTier(edge.to, data.edges);
      const fromSpec = NODE_TIER_SIZE[fromTier];
      const toSpec = NODE_TIER_SIZE[toTier];
      const x1 = from.x + offsetX;
      const y1 = from.y + fromSpec.h / 2 + offsetY - fromSpec.h / 2;
      const x2 = to.x + offsetX;
      const y2 = to.y - toSpec.h / 2 + offsetY + toSpec.h / 2;
      return whimsicalConnector(x1, y1, x2, y2, edge.label, {
        weight: fromTier === "root" ? 3 : 2.5,
      });
    })
    .join("");

  const body = `
    ${headerBar(data.title, "Mapa conceptual · suite MemoriaStudy", width)}
    ${connectors}
    ${boxes}
    ${footerNote("Nodos y conectores desde datos del organizador · jerarquía exacta · texto legible", height)}
  `;

  return svgDoc(width, height, body);
}

function renderMindMapSvg(data: ReturnType<typeof extractMindMapData>) {
  const width = 1200;
  const height = 1200;
  const cx = width / 2;
  const cy = height / 2 + 48;
  const r1 = 280;
  const r2 = 440;
  const rootSpec = NODE_TIER_SIZE.root;

  const center = premiumNode(cx - rootSpec.w / 2, cy - rootSpec.h / 2, data.title, "root", {
    stroke: MS2026.accent,
  });

  const branchNodes: string[] = [];
  const childNodes: string[] = [];
  const lines: string[] = [];

  const count = Math.max(data.branches.length, 1);
  data.branches.forEach((branch, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2;
    const px = cx + r1 * Math.cos(angle);
    const py = cy + r1 * Math.sin(angle);
    const primary = NODE_TIER_SIZE.primary;
    const bx = px - primary.w / 2;
    const by = py - primary.h / 2;

    lines.push(whimsicalConnector(cx, cy, px, py, undefined, { weight: 3 }));

    branchNodes.push(
      premiumNode(bx, by, branch.label, "primary", { stroke: MS2026.violet }),
    );

    branch.children.forEach((child, childIndex) => {
      const spread = 0.32;
      const childAngle = angle + (childIndex - (branch.children.length - 1) / 2) * spread;
      const cpx = cx + r2 * Math.cos(childAngle);
      const cpy = cy + r2 * Math.sin(childAngle);
      const tertiary = NODE_TIER_SIZE.tertiary;
      lines.push(
        whimsicalConnector(px, py, cpx, cpy, undefined, { weight: 2, dashed: true }),
      );
      childNodes.push(
        premiumNode(cpx - tertiary.w / 2, cpy - tertiary.h / 2, child, "tertiary"),
      );
    });
  });

  const body = `
    ${headerBar(data.title, "Mapa mental · suite MemoriaStudy", width)}
    ${lines.join("")}
    ${center}
    ${branchNodes.join("")}
    ${childNodes.join("")}
    ${footerNote("Tema central · ramas radiales · subtemas agrupados desde el organizador", height)}
  `;

  return svgDoc(width, height, body);
}

function renderTimelineSvg(data: ReturnType<typeof extractTimelineData>) {
  const width = 1440;
  const height = 820;
  const yAxis = 400;
  const margin = 96;
  const usable = width - margin * 2;
  const step = usable / Math.max(data.events.length, 1);

  const axis = `
    <line x1="${margin}" y1="${yAxis}" x2="${width - margin}" y2="${yAxis}" stroke="${MS2026.accent}" stroke-width="4" stroke-linecap="round" filter="url(#connectorGlow)"/>
    <polygon points="${width - margin},${yAxis} ${width - margin - 14},${yAxis - 7} ${width - margin - 14},${yAxis + 7}" fill="${MS2026.accent}"/>
  `;

  const events = data.events
    .map((event, index) => {
      const x = margin + step * index + step / 2;
      const above = index % 2 === 0;
      const cardW = 248;
      const cardH = 168;
      const cardY = above ? yAxis - cardH - 44 : yAxis + 44;
      const lineY2 = above ? yAxis - 22 : yAxis + 22;
      const dateLines = event.date ? wrapText(event.date, 18, 1) : [];
      const labelLines = wrapText(event.label, 30, 3);
      const lines: { text: string; size?: number; weight?: number; color?: string }[] = [];
      dateLines.forEach((d) => lines.push({ text: d, size: 13, weight: 700, color: MS2026.accent }));
      labelLines.forEach((l) => lines.push({ text: l, size: 12, weight: 500 }));

      return `
      ${whimsicalConnector(x, yAxis, x, lineY2, undefined, { weight: 2 })}
      <circle cx="${x}" cy="${yAxis}" r="11" fill="${MS2026.surfaceAlt}" stroke="${MS2026.accent}" stroke-width="2.5" filter="url(#nodeShadow)"/>
      ${panelCard(x - cardW / 2, cardY, cardW, cardH, lines)}
      `;
    })
    .join("");

  const body = `
    ${headerBar(data.title, "Línea de tiempo · suite MemoriaStudy", width)}
    ${axis}
    ${events}
    ${footerNote("Cronología desde timeline del organizador · hitos y fechas exactas", height)}
  `;

  return svgDoc(width, height, body);
}

function renderComparisonSvg(data: ReturnType<typeof extractComparisonData>) {
  const width = 1440;
  const height = 820;
  const colW = 460;
  const leftX = 80;
  const rightX = width - colW - 80;
  const headerY = 220;
  const rowH = 104;

  const headers = `
    ${premiumNode(leftX, headerY, data.leftTitle, "primary", { stroke: MS2026.accent })}
    ${premiumNode(rightX, headerY, data.rightTitle, "primary", { stroke: MS2026.violet })}
    <line x1="${width / 2}" y1="188" x2="${width / 2}" y2="${height - 72}" stroke="${MS2026.border}" stroke-width="2" stroke-dasharray="10 8" opacity="0.7"/>
    <text x="${width / 2}" y="210" text-anchor="middle" fill="${MS2026.muted}" font-family="${MS2026.font}" font-size="12" font-weight="800">VS</text>
  `;

  const rows = data.rows
    .slice(0, 5)
    .map((row, index) => {
      const y = headerY + 96 + index * rowH;
      const criterionLines = wrapText(row.criterion, 20, 1);
      const leftLines = wrapText(row.left, 36, 2);
      const rightLines = wrapText(row.right, 36, 2);

      return `
      <rect x="56" y="${y - 10}" width="${width - 112}" height="${rowH - 12}" rx="20" fill="${index % 2 === 0 ? "rgba(0,255,213,0.04)" : "rgba(255,255,255,0.02)"}" stroke="${MS2026.border}" stroke-width="1"/>
      ${criterionLines.map((c, i) => `<text x="72" y="${y + 20 + i * 14}" fill="${MS2026.gold}" font-family="${MS2026.font}" font-size="11" font-weight="800">${escapeXml(c)}</text>`).join("")}
      ${leftLines.map((l, i) => `<text x="${leftX + 20}" y="${y + 26 + i * 18}" fill="${MS2026.title}" font-family="${MS2026.font}" font-size="13">${escapeXml(l)}</text>`).join("")}
      ${rightLines.map((l, i) => `<text x="${rightX + 20}" y="${y + 26 + i * 18}" fill="${MS2026.title}" font-family="${MS2026.font}" font-size="13">${escapeXml(l)}</text>`).join("")}
      `;
    })
    .join("");

  const body = `
    ${headerBar(data.title, "Cuadro comparativo · suite MemoriaStudy", width)}
    ${headers}
    ${rows}
    ${footerNote("Comparación desde visualSummary / flashcards del organizador", height)}
  `;

  return svgDoc(width, height, body);
}

export function renderStructuredVisualAi(
  formatId: VisualAiFormatId,
  content: OrganizerContent,
): { svg: string; description: string } {
  switch (formatId) {
    case "conceptMap": {
      const data = extractConceptMapData(content);
      return {
        svg: renderConceptMapSvg(data),
        description: `Structured concept map: ${data.nodes.length} nodes, ${data.edges.length} edges from organizer data.`,
      };
    }
    case "mindMap": {
      const data = extractMindMapData(content);
      return {
        svg: renderMindMapSvg(data),
        description: `Structured mind map: ${data.branches.length} branches from organizer hierarchy/concepts.`,
      };
    }
    case "timeline": {
      const data = extractTimelineData(content);
      return {
        svg: renderTimelineSvg(data),
        description: `Structured timeline: ${data.events.length} milestones from organizer timeline.`,
      };
    }
    case "comparisonTable": {
      const data = extractComparisonData(content);
      return {
        svg: renderComparisonSvg(data),
        description: `Structured comparison: ${data.rows.length} rows (${data.leftTitle} vs ${data.rightTitle}).`,
      };
    }
    default:
      throw new Error(`Formato no estructurado: ${formatId}`);
  }
}

export function renderStructuredVisualAiBuffer(
  formatId: VisualAiFormatId,
  content: OrganizerContent,
): { buffer: Buffer; description: string } {
  const { svg, description } = renderStructuredVisualAi(formatId, content);
  return { buffer: Buffer.from(svg, "utf-8"), description };
}
