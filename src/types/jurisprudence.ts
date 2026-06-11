export const JURISPRUDENCE_MATERIAS = [
  "civil",
  "penal",
  "constitucional",
  "tributario",
  "laboral",
  "administrativo",
  "procesal",
] as const;

export type JurisprudenceMateria = (typeof JURISPRUDENCE_MATERIAS)[number];

export const JURISPRUDENCE_TIPOS = [
  "casacion",
  "sentencia",
  "expediente",
  "resolucion",
  "precedente_vinculante",
] as const;

export type JurisprudenceTipo = (typeof JURISPRUDENCE_TIPOS)[number];

/** Resolución jurídica indexada — contrato estable para fases 2 (DB) y 3 (APIs oficiales). */
export type JurisprudenceRecord = {
  id: string;
  title: string;
  tipo: JurisprudenceTipo;
  materia: JurisprudenceMateria;
  submateria: string;
  year: number;
  organo: string;
  summary: string;
  keywords: string[];
  pdfUrl: string;
  expediente?: string;
  /** Aporte de un estudiante (no catálogo curado). */
  isCommunityContribution?: boolean;
  submittedBy?: string;
  status?: "published" | "pending" | "rejected";
  /** Preparado para búsqueda semántica futura — no usado en fase 1. */
  embeddingReady?: boolean;
};

export type JurisprudenceSearchFilters = {
  query?: string;
  materias?: JurisprudenceMateria[];
  tipos?: JurisprudenceTipo[];
  years?: number[];
  organos?: string[];
  favoritesOnly?: boolean;
  favoriteIds?: string[];
  limit?: number;
  offset?: number;
};

export type JurisprudenceSearchResult = {
  items: JurisprudenceRecord[];
  total: number;
  facets: {
    materias: Record<JurisprudenceMateria, number>;
    tipos: Record<JurisprudenceTipo, number>;
    years: Record<number, number>;
    organos: Record<string, number>;
  };
  suggestions?: string[];
};
