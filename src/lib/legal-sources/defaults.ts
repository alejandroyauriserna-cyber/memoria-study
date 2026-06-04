import { coalesceLegalSources } from "@/lib/legal-sources/lp-presets";
import type { LegalSourceRecord } from "@/types/legal-sources";

/** Fuentes integradas — el estudiante activa/desactiva y define prioridad. */
export const DEFAULT_LEGAL_SOURCES: LegalSourceRecord[] = [
  {
    id: "src-cpp",
    title: "Constitución Política del Perú",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 3,
    description: "Muestra interna limitada — no usar. Sincroniza desde LP Derecho.",
    updatedAt: "2026-03-01",
  },
  {
    id: "src-cc",
    title: "Código Civil",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 4,
    description: "Muestra interna limitada — no usar. Sincroniza desde LP Derecho.",
    updatedAt: "2026-03-01",
  },
  {
    id: "src-cpc",
    title: "Código Procesal Civil",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 5,
    description: "Muestra interna limitada — no usar. Sincroniza desde LP Derecho.",
    updatedAt: "2026-03-01",
  },
  {
    id: "src-cp",
    title: "Código Penal",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 6,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-cppenal",
    title: "Código Procesal Penal",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 7,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-ct",
    title: "Código Tributario",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 8,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-lopj",
    title: "Ley Orgánica del Poder Judicial",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 9,
    updatedAt: "2026-03-01",
  },
];

const SOURCE_NORM_MAP: Record<string, string[]> = {
  "src-cpp": ["Constitución Política del Perú", "CPP"],
  "src-cc": ["Código Civil", "CC"],
  "src-cpc": ["Código Procesal Civil", "CPC"],
  "src-cp": ["Código Penal", "CP"],
  "src-lopj": ["Ley Orgánica del Poder Judicial", "LOPJ"],
};

export function getBuiltinSourceExcerpt(sourceId: string): string {
  const norms = SOURCE_NORM_MAP[sourceId];
  if (!norms?.length) return "";

  // Normativa integrada deshabilitada: no enviar muestras estáticas al tutor.
  return "";
}

export function mergeWithDefaultSources(custom: LegalSourceRecord[]): LegalSourceRecord[] {
  const byId = new Map<string, LegalSourceRecord>();

  for (const builtin of DEFAULT_LEGAL_SOURCES) {
    byId.set(builtin.id, { ...builtin });
  }

  for (const source of custom) {
    if (source.kind === "builtin" && byId.has(source.id)) {
      byId.set(source.id, { ...byId.get(source.id)!, ...source, kind: "builtin" });
    } else {
      byId.set(source.id, source);
    }
  }

  return coalesceLegalSources([...byId.values()].sort((a, b) => a.priority - b.priority));
}

export const LEGAL_SOURCE_TYPE_HINTS: Record<string, string[]> = {
  normativa: [
    "Constitución Política del Perú",
    "Código Civil",
    "Código Procesal Civil",
    "Código Penal",
    "Código Tributario",
    "Leyes especiales",
    "Reglamentos",
  ],
  jurisprudencia: [
    "Sube PDF: casaciones, TC, Tribunal Fiscal",
    "Compendios del curso o extractos oficiales",
    "Precedentes vinculantes",
  ],
  doctrina: ["Libros", "Artículos académicos", "Revistas jurídicas", "Tesis"],
  material_universitario: [
    "Separatas",
    "PDFs del profesor",
    "Diapositivas",
    "Manuales del curso",
  ],
};
