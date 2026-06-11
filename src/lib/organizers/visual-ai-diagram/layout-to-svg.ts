import type { DiagramLayout } from "@/lib/organizers/visual-ai-diagram/compute-diagram-layout";
import {
  footerNote,
  headerBar,
  premiumNode,
  svgDoc,
  whimsicalConnector,
} from "@/lib/organizers/visual-ai-diagram/svg-primitives";

export function layoutToExportSvg(layout: DiagramLayout): string {
  const nodeById = new Map(layout.nodes.map((n) => [n.id, n]));

  const connectors = layout.edges
    .map((edge) => {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) return "";
      const x1 = from.x + from.w / 2;
      const y1 = from.y + from.h;
      const x2 = to.x + to.w / 2;
      const y2 = to.y;
      return whimsicalConnector(x1, y1, x2, y2, edge.label, {
        weight: from.tier === "root" ? 3 : 2.5,
        dashed: edge.label === "subtema",
      });
    })
    .join("");

  const boxes = layout.nodes
    .filter((n) => n.id !== "axis")
    .map((node) => premiumNode(node.x, node.y, node.label, node.tier))
    .join("");

  const body = `
    ${headerBar(layout.title, layout.subtitle, layout.width)}
    ${connectors}
    ${boxes}
    ${footerNote("Diagrama interactivo MemoriaStudy · exportación premium", layout.height)}
  `;

  return svgDoc(layout.width, layout.height, body);
}
