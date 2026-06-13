import { getEnabledSources } from "@/lib/legal-sources/storage";
import type { PageProfessorAnalysis, TutorResponse } from "@/types/guided-legal-study";
import type { LegalSourcesSettings } from "@/types/legal-sources";

const CACHE_PREFIX = "memoria-tutor-cache:";
const MAX_ENTRIES_PER_MATERIAL = 40;

export type TutorCacheScope =
  | { type: "page"; pageNumber: number }
  | { type: "chapter"; chapterId: string };

type CacheEntry = {
  analysis?: PageProfessorAnalysis;
  customReply?: string;
  activeSources?: TutorResponse["activeSources"];
  fingerprint: string;
  examOnly: boolean;
  cachedAt: string;
};

type MaterialCacheStore = Record<string, CacheEntry>;

/** Bump when tutor input cleaning / prompts change to invalidate stale cache. */
export const TUTOR_PIPELINE_VERSION = "study-text-v4";

export function buildSourceFingerprint(settings: LegalSourcesSettings): string {
  const sources = getEnabledSources(settings)
    .map((s) => `${s.id}:${s.lastSyncedAt ?? s.updatedAt ?? ""}`)
    .sort()
    .join("|");
  return `${TUTOR_PIPELINE_VERSION}|${sources}`;
}

export function buildTutorCacheKey(scope: TutorCacheScope, examOnly: boolean): string {
  const base = scope.type === "page" ? `p:${scope.pageNumber}` : `ch:${scope.chapterId}`;
  return `${base}:${examOnly ? "exam" : "full"}`;
}

function scopeKey(scope: TutorCacheScope, examOnly: boolean): string {
  return buildTutorCacheKey(scope, examOnly);
}

function listCachedPageNumbers(
  materialId: string,
  examOnly: boolean,
  fingerprint: string,
): number[] {
  const store = loadStore(materialId);
  const suffix = examOnly ? "exam" : "full";
  const pages: number[] = [];

  for (const key of Object.keys(store)) {
    if (!key.endsWith(`:${suffix}`)) continue;
    const match = key.match(/^p:(\d+):/);
    if (!match) continue;

    const entry = store[key];
    if (!entry || entry.fingerprint !== fingerprint) continue;
    if (!hasTutorCacheContent({ analysis: entry.analysis, customReply: entry.customReply })) {
      continue;
    }

    pages.push(Number(match[1]));
  }

  return pages;
}

function loadCachedPageAnalysis(
  materialId: string,
  pageNumber: number,
  examOnly: boolean,
  fingerprint: string,
): PageProfessorAnalysis | null {
  const primary = loadTutorCache(
    materialId,
    { type: "page", pageNumber },
    examOnly,
    fingerprint,
  );
  if (primary?.analysis) return primary.analysis;

  if (examOnly) {
    const full = loadTutorCache(
      materialId,
      { type: "page", pageNumber },
      false,
      fingerprint,
    );
    if (full?.analysis) return full.analysis;
  }

  return null;
}

/** Página anterior (o la más reciente con caché) para repasar mientras carga el tutor. */
export function findPracticePageCache(
  materialId: string,
  beforePage: number,
  examOnly: boolean,
  fingerprint: string,
): { pageNumber: number; analysis: PageProfessorAnalysis } | null {
  if (beforePage > 1) {
    const previous = loadCachedPageAnalysis(
      materialId,
      beforePage - 1,
      examOnly,
      fingerprint,
    );
    if (previous) {
      return { pageNumber: beforePage - 1, analysis: previous };
    }
  }

  const candidates = listCachedPageNumbers(materialId, examOnly, fingerprint)
    .filter((page) => page < beforePage)
    .sort((a, b) => b - a);

  for (const pageNumber of candidates) {
    const analysis = loadCachedPageAnalysis(materialId, pageNumber, examOnly, fingerprint);
    if (analysis) {
      return { pageNumber, analysis };
    }
  }

  return null;
}

function loadStore(materialId: string): MaterialCacheStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${materialId}`);
    if (!raw) return {};
    return JSON.parse(raw) as MaterialCacheStore;
  } catch {
    return {};
  }
}

function saveStore(materialId: string, store: MaterialCacheStore) {
  if (typeof window === "undefined") return;
  const keys = Object.keys(store);
  if (keys.length > MAX_ENTRIES_PER_MATERIAL) {
    const sorted = keys.sort(
      (a, b) =>
        new Date(store[a]!.cachedAt).getTime() - new Date(store[b]!.cachedAt).getTime(),
    );
    for (const key of sorted.slice(0, keys.length - MAX_ENTRIES_PER_MATERIAL)) {
      delete store[key];
    }
  }
  localStorage.setItem(`${CACHE_PREFIX}${materialId}`, JSON.stringify(store));
}

export function hasTutorCacheContent(
  result: Pick<TutorResponse, "analysis" | "customReply"> | null | undefined,
): boolean {
  if (!result) return false;
  if (result.customReply?.trim()) return true;
  if (!result.analysis) return false;
  return Boolean(
    result.analysis.pageFocus?.trim() ||
      result.analysis.conceptCards.length ||
      result.analysis.keyLearning.length ||
      result.analysis.highlights.length,
  );
}

export function loadTutorCache(
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
): Pick<TutorResponse, "analysis" | "customReply" | "activeSources"> | null {
  const store = loadStore(materialId);
  const entry = store[scopeKey(scope, examOnly)];
  if (!entry || entry.fingerprint !== fingerprint) return null;

  const result = {
    analysis: entry.analysis,
    customReply: entry.customReply,
    activeSources: entry.activeSources,
  };

  return hasTutorCacheContent(result) ? result : null;
}

export function saveTutorCache(
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
  result: Pick<TutorResponse, "analysis" | "customReply" | "activeSources">,
) {
  const store = loadStore(materialId);
  store[scopeKey(scope, examOnly)] = {
    analysis: result.analysis,
    customReply: result.customReply,
    activeSources: result.activeSources,
    fingerprint,
    examOnly,
    cachedAt: new Date().toISOString(),
  };
  saveStore(materialId, store);
}

export function invalidateTutorCacheForMaterial(materialId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${CACHE_PREFIX}${materialId}`);
}

export function invalidateTutorCacheScope(
  materialId: string,
  scope: TutorCacheScope,
) {
  const store = loadStore(materialId);
  delete store[scopeKey(scope, false)];
  delete store[scopeKey(scope, true)];
  saveStore(materialId, store);
}
