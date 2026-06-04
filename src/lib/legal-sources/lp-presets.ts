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
    title: "Constitución Política del Perú (LP)",
    url: "https://lpderecho.pe/constitucion-politica-peru-actualizada/",
    norm: "Constitución Política del Perú",
    normShort: "CPP",
    description: "Texto constitucional actualizado en LP Derecho.",
  },
  {
    id: "lp-cc",
    title: "Código Civil (LP)",
    url: "https://lpderecho.pe/codigo-civil-peruano-realmente-actualizado/",
    norm: "Código Civil",
    normShort: "CC",
    description: "Código Civil peruano con modificaciones vigentes.",
  },
  {
    id: "lp-cp",
    title: "Código Penal (LP)",
    url: "https://lpderecho.pe/codigo-penal-peruano-actualizado/",
    norm: "Código Penal",
    normShort: "CP",
    description: "Código Penal peruano actualizado.",
  },
  {
    id: "lp-cpc",
    title: "Código Procesal Civil (LP)",
    url: "https://lpderecho.pe/codigo-procesal-civil-actualizado/",
    norm: "Código Procesal Civil",
    normShort: "CPC",
    description: "Código Procesal Civil peruano actualizado.",
  },
  {
    id: "lp-ncpp",
    title: "Código Procesal Penal (LP)",
    url: "https://lpderecho.pe/nuevo-codigo-procesal-penal-peruano-actualizado/",
    norm: "Código Procesal Penal",
    normShort: "NCPP",
    description: "Nuevo Código Procesal Penal — primera parte en LP.",
  },
];

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
