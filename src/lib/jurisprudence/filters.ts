import type {
  JurisprudenceMateria,
  JurisprudenceSearchFilters,
  JurisprudenceTipo,
} from "@/types/jurisprudence";
import { JURISPRUDENCE_MATERIAS, JURISPRUDENCE_TIPOS } from "@/types/jurisprudence";

export type JurisprudenceFilterState = {
  materias: JurisprudenceMateria[];
  tipos: JurisprudenceTipo[];
  years: number[];
  organos: string[];
  favoritesOnly: boolean;
};

export const EMPTY_JURISPRUDENCE_FILTERS: JurisprudenceFilterState = {
  materias: [],
  tipos: [],
  years: [],
  organos: [],
  favoritesOnly: false,
};

export function toggleFilterValue<T extends string | number>(
  current: T[],
  value: T,
): T[] {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}

export function countActiveFilters(filters: JurisprudenceFilterState): number {
  return (
    filters.materias.length +
    filters.tipos.length +
    filters.years.length +
    filters.organos.length +
    (filters.favoritesOnly ? 1 : 0)
  );
}

export function filterStateToSearchParams(
  filters: JurisprudenceFilterState,
  query: string,
): JurisprudenceSearchFilters {
  return {
    query: query.trim() || undefined,
    materias: filters.materias.length ? filters.materias : undefined,
    tipos: filters.tipos.length ? filters.tipos : undefined,
    years: filters.years.length ? filters.years : undefined,
    organos: filters.organos.length ? filters.organos : undefined,
    favoritesOnly: filters.favoritesOnly || undefined,
  };
}

export function parseMateriaParam(value: string | null): JurisprudenceMateria[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is JurisprudenceMateria =>
      (JURISPRUDENCE_MATERIAS as readonly string[]).includes(v),
    );
}

export function parseTipoParam(value: string | null): JurisprudenceTipo[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is JurisprudenceTipo =>
      (JURISPRUDENCE_TIPOS as readonly string[]).includes(v),
    );
}

export function parseYearsParam(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isFinite(n));
}

export function parseOrganosParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function filterStateFromSearchParams(params: URLSearchParams): {
  filters: JurisprudenceFilterState;
  query: string;
  docId: string | null;
} {
  return {
    query: params.get("q")?.trim() ?? "",
    docId: params.get("doc")?.trim() || null,
    filters: {
      materias: parseMateriaParam(params.get("materia")),
      tipos: parseTipoParam(params.get("tipo")),
      years: parseYearsParam(params.get("year")),
      organos: parseOrganosParam(params.get("organo")),
      favoritesOnly: params.get("favorites") === "1",
    },
  };
}

export function buildBibliotecaShareUrl(
  filters: JurisprudenceFilterState,
  query: string,
  docId?: string | null,
): string {
  const params = new URLSearchParams();
  const searchFilters = filterStateToSearchParams(filters, query);

  if (searchFilters.query) params.set("q", searchFilters.query);
  if (searchFilters.materias?.length) params.set("materia", searchFilters.materias.join(","));
  if (searchFilters.tipos?.length) params.set("tipo", searchFilters.tipos.join(","));
  if (searchFilters.years?.length) params.set("year", searchFilters.years.join(","));
  if (searchFilters.organos?.length) params.set("organo", searchFilters.organos.join("|"));
  if (searchFilters.favoritesOnly) params.set("favorites", "1");
  if (docId) params.set("doc", docId);

  const qs = params.toString();
  return qs ? `/biblioteca-juridica?${qs}` : "/biblioteca-juridica";
}
