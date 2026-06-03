export type TableLegalLayout =
  | "default"
  | "comparativo"
  | "timeline"
  | "caso"
  | "jurisprudencia";

export type TableLegalLayoutSpec = {
  id: TableLegalLayout;
  label: string;
  icon: string;
  description: string;
  headers: string[];
};

export const TABLE_LEGAL_LAYOUTS: TableLegalLayoutSpec[] = [
  {
    id: "comparativo",
    label: "Cuadro comparativo",
    icon: "▦",
    description: "Contrastar elementos en columnas",
    headers: ["Criterio", "Opción A", "Opción B"],
  },
  {
    id: "timeline",
    label: "Línea de tiempo",
    icon: "📅",
    description: "Fecha y hecho cronológico",
    headers: ["Fecha", "Hecho / Etapa", "Notas"],
  },
  {
    id: "caso",
    label: "Cuadro de análisis de caso",
    icon: "📁",
    description: "Hechos, problema jurídico y solución",
    headers: ["Hechos", "Problema jurídico", "Norma aplicable", "Solución"],
  },
  {
    id: "jurisprudencia",
    label: "Matriz de jurisprudencia",
    icon: "⚖",
    description: "Tribunal, ratio y relevancia",
    headers: ["Tribunal", "Expediente", "Ratio decidendi", "Relevancia"],
  },
];

export function layoutClassName(layout: TableLegalLayout): string {
  if (layout === "default") return "";
  return `cn-table-layout-${layout}`;
}
