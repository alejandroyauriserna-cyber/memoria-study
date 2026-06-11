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
