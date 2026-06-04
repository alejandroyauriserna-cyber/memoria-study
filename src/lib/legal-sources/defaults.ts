import { PERU_LEGAL_ARTICLES } from "@/lib/guided-study/legal-base";
import type { LegalSourceRecord } from "@/types/legal-sources";

export const DEFAULT_LEGAL_SOURCES: LegalSourceRecord[] = [
  {
    id: "src-cpp",
    title: "Constitución Política del Perú",
    category: "normativa",
    kind: "builtin",
    enabled: true,
    priority: 3,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-cc",
    title: "Código Civil",
    category: "normativa",
    kind: "builtin",
    enabled: true,
    priority: 2,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-cpc",
    title: "Código Procesal Civil",
    category: "normativa",
    kind: "builtin",
    enabled: true,
    priority: 4,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-cp",
    title: "Código Penal",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 5,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-cppenal",
    title: "Código Procesal Penal",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 6,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-lopj",
    title: "Ley Orgánica del Poder Judicial",
    category: "normativa",
    kind: "builtin",
    enabled: false,
    priority: 7,
    updatedAt: "2026-03-01",
  },
  {
    id: "src-juris",
    title: "Jurisprudencia (TC / Casación)",
    category: "jurisprudencia",
    kind: "builtin",
    enabled: false,
    priority: 8,
    description: "Lineamientos jurisprudenciales curados",
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

  const articles = PERU_LEGAL_ARTICLES.filter((a) =>
    norms.some((n) => a.norm.includes(n) || a.normShort === n),
  );

  return articles
    .map((a) => `[${a.norm} — ${a.article}] ${a.title}: "${a.text}"`)
    .join("\n");
}

export function mergeWithDefaultSources(custom: LegalSourceRecord[]): LegalSourceRecord[] {
  const customIds = new Set(custom.map((s) => s.id));
  const builtins = DEFAULT_LEGAL_SOURCES.filter((s) => !customIds.has(s.id));
  return [...custom, ...builtins].sort((a, b) => a.priority - b.priority);
}
