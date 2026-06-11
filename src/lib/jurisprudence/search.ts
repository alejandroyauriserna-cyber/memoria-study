import type {
  JurisprudenceMateria,
  JurisprudenceRecord,
  JurisprudenceSearchFilters,
  JurisprudenceSearchResult,
  JurisprudenceTipo,
} from "@/types/jurisprudence";
import { JURISPRUDENCE_MATERIAS, JURISPRUDENCE_TIPOS } from "@/types/jurisprudence";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function scoreField(
  value: string | undefined | null,
  query: string,
  weights: { exact: number; prefix: number; partial: number },
): number {
  if (!value) return 0;
  const hay = normalize(value);
  const q = normalize(query);
  if (!q) return 0;
  if (hay === q) return weights.exact;
  if (hay.startsWith(q)) return weights.prefix;
  if (hay.includes(q)) return weights.partial;
  return 0;
}

export function scoreJurisprudenceRecord(record: JurisprudenceRecord, query: string): number {
  const keywordScore = record.keywords.reduce(
    (max, keyword) =>
      Math.max(
        max,
        scoreField(keyword, query, { exact: 95, prefix: 85, partial: 70 }),
      ),
    0,
  );

  return Math.max(
    scoreField(record.title, query, { exact: 100, prefix: 88, partial: 72 }),
    scoreField(record.submateria, query, { exact: 82, prefix: 72, partial: 58 }),
    scoreField(record.summary, query, { exact: 45, prefix: 38, partial: 28 }),
    scoreField(record.expediente, query, { exact: 90, prefix: 78, partial: 62 }),
    scoreField(record.organo, query, { exact: 30, prefix: 24, partial: 18 }),
    keywordScore,
  );
}

function matchesFilters(
  record: JurisprudenceRecord,
  filters: JurisprudenceSearchFilters,
  score: number,
): boolean {
  if (filters.query?.trim() && score <= 0) return false;

  if (filters.materias?.length && !filters.materias.includes(record.materia)) {
    return false;
  }

  if (filters.tipos?.length && !filters.tipos.includes(record.tipo)) {
    return false;
  }

  if (filters.years?.length && !filters.years.includes(record.year)) {
    return false;
  }

  if (filters.organos?.length && !filters.organos.includes(record.organo)) {
    return false;
  }

  if (filters.favoritesOnly && filters.favoriteIds) {
    if (!filters.favoriteIds.includes(record.id)) return false;
  }

  return true;
}

function buildFacets(records: JurisprudenceRecord[]) {
  const materias = Object.fromEntries(
    JURISPRUDENCE_MATERIAS.map((m) => [m, 0]),
  ) as Record<JurisprudenceMateria, number>;
  const tipos = Object.fromEntries(JURISPRUDENCE_TIPOS.map((t) => [t, 0])) as Record<
    JurisprudenceTipo,
    number
  >;
  const years: Record<number, number> = {};
  const organos: Record<string, number> = {};

  for (const record of records) {
    materias[record.materia] += 1;
    tipos[record.tipo] += 1;
    years[record.year] = (years[record.year] ?? 0) + 1;
    organos[record.organo] = (organos[record.organo] ?? 0) + 1;
  }

  return { materias, tipos, years, organos };
}

export function searchJurisprudenceRecords(
  catalog: JurisprudenceRecord[],
  filters: JurisprudenceSearchFilters,
): JurisprudenceSearchResult {
  const query = filters.query?.trim() ?? "";
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const scored = catalog
    .map((record) => ({
      record,
      score: query ? scoreJurisprudenceRecord(record, query) : 1,
    }))
    .filter(({ record, score }) => matchesFilters(record, filters, score))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.record.year - a.record.year;
    });

  const total = scored.length;
  const items = scored.slice(offset, offset + limit).map(({ record }) => record);

  const suggestions =
    query.length >= 2
      ? catalog
          .flatMap((r) => r.keywords)
          .filter((kw, idx, arr) => {
            const n = normalize(kw);
            const q = normalize(query);
            return n.includes(q) && arr.indexOf(kw) === idx;
          })
          .slice(0, 6)
      : [];

  return {
    items,
    total,
    facets: buildFacets(scored.map(({ record }) => record)),
    suggestions,
  };
}

export function getDistinctOrganos(catalog: JurisprudenceRecord[]): string[] {
  return [...new Set(catalog.map((r) => r.organo))].sort((a, b) => a.localeCompare(b, "es"));
}

export function getDistinctYears(catalog: JurisprudenceRecord[]): number[] {
  return [...new Set(catalog.map((r) => r.year))].sort((a, b) => b - a);
}
