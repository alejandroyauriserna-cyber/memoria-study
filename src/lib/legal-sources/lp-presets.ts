import type { LegalSourceRecord } from "@/types/legal-sources";

export type LpNormativePreset = {
  id: string;
  title: string;
  url: string;
  norm: string;
  normShort: string;
  description: string;
};

/** Catálogo LP Pasión por el Derecho — normativa peruana actualizada. */
export const LP_NORMATIVE_PRESETS: LpNormativePreset[] = [
  {
    id: "lp-cpp",
    title: "Constitución Política del Perú",
    url: "https://lpderecho.pe/constitucion-politica-peru-actualizada/",
    norm: "Constitución Política del Perú",
    normShort: "CPP",
    description: "Texto constitucional actualizado en LP Derecho.",
  },
  {
    id: "lp-cc",
    title: "Código Civil",
    url: "https://lpderecho.pe/codigo-civil-peruano-realmente-actualizado/",
    norm: "Código Civil",
    normShort: "CC",
    description: "Código Civil peruano con modificaciones vigentes.",
  },
  {
    id: "lp-cp",
    title: "Código Penal",
    url: "https://lpderecho.pe/codigo-penal-peruano-actualizado/",
    norm: "Código Penal",
    normShort: "CP",
    description: "Código Penal peruano actualizado.",
  },
  {
    id: "lp-cpc",
    title: "Código Procesal Civil",
    url: "https://lpderecho.pe/codigo-procesal-civil-actualizado/",
    norm: "Código Procesal Civil",
    normShort: "CPC",
    description: "Código Procesal Civil peruano actualizado.",
  },
  {
    id: "lp-ncpp",
    title: "Código Procesal Penal",
    url: "https://lpderecho.pe/nuevo-codigo-procesal-penal-peruano-actualizado/",
    norm: "Código Procesal Penal",
    normShort: "NCPP",
    description: "Nuevo Código Procesal Penal — primera parte en LP.",
  },
];

/** Fuente integrada que queda oculta cuando existe la versión LP sincronizada. */
export const LP_PRESET_BUILTIN_MAP: Record<string, string> = {
  "lp-cpp": "src-cpp",
  "lp-cc": "src-cc",
  "lp-cp": "src-cp",
  "lp-cpc": "src-cpc",
  "lp-ncpp": "src-cppenal",
};

export function getBuiltinIdForLpPreset(presetId: string): string | undefined {
  return LP_PRESET_BUILTIN_MAP[presetId];
}

export function getLpPresetForBuiltinId(builtinId: string): string | undefined {
  return Object.entries(LP_PRESET_BUILTIN_MAP).find(([, id]) => id === builtinId)?.[0];
}

export function normalizeLpSourceTitle(source: LegalSourceRecord): LegalSourceRecord {
  if (source.kind !== "url" || !source.lpPresetId) return source;
  const preset = getLpPresetById(source.lpPresetId);
  if (!preset) return source;
  return { ...source, title: preset.norm };
}

export function coalesceLegalSources(sources: LegalSourceRecord[]): LegalSourceRecord[] {
  return sources
    .filter((source) => !(source.kind === "builtin" && source.category === "normativa"))
    .map((source) => normalizeLpSourceTitle(source));
}

export function getLpPresetById(presetId: string): LpNormativePreset | undefined {
  return LP_NORMATIVE_PRESETS.find((p) => p.id === presetId);
}

export function isAllowedLpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "lpderecho.pe" || parsed.hostname === "www.lpderecho.pe";
  } catch {
    return false;
  }
}
