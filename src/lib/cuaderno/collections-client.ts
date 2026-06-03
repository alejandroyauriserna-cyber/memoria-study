"use client";

import type { CuadernoCollectionsSnapshot } from "@/lib/cuaderno/collections-server";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import {
  listExamItems as listLocalExams,
  listFavoriteClassIds as listLocalFavorites,
  listSummaryItems as listLocalSummaries,
  type SavedAiItem,
  type SmartCollectionSlug,
} from "@/lib/cuaderno/smart-collections";

const CACHE_KEY = "memoria-cuaderno-collections-cache";
const MIGRATED_KEY = "memoria-cuaderno-collections-migrated";
const COVERS_CACHE_KEY = "memoria-cuaderno-covers-cache";

let memorySnapshot: CuadernoCollectionsSnapshot | null = null;
let memoryCovers: Record<string, CourseCoverArt> = {};

function readCache(): CuadernoCollectionsSnapshot | null {
  if (memorySnapshot) return memorySnapshot;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    memorySnapshot = JSON.parse(raw) as CuadernoCollectionsSnapshot;
    return memorySnapshot;
  } catch {
    return null;
  }
}

function writeCache(snapshot: CuadernoCollectionsSnapshot) {
  memorySnapshot = snapshot;
  if (typeof window === "undefined") return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
}

function readCoversCache(): Record<string, CourseCoverArt> {
  if (Object.keys(memoryCovers).length) return memoryCovers;
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COVERS_CACHE_KEY);
    memoryCovers = raw ? (JSON.parse(raw) as Record<string, CourseCoverArt>) : {};
    return memoryCovers;
  } catch {
    return {};
  }
}

function writeCoversCache(covers: Record<string, CourseCoverArt>) {
  memoryCovers = covers;
  if (typeof window === "undefined") return;
  localStorage.setItem(COVERS_CACHE_KEY, JSON.stringify(covers));
}

export function getCachedCollections(): CuadernoCollectionsSnapshot {
  return (
    readCache() ?? {
      favoriteClassIds: listLocalFavorites(),
      examItems: listLocalExams(),
      summaryItems: listLocalSummaries(),
    }
  );
}

export function getCachedCourseCover(courseId: string): CourseCoverArt | null {
  return readCoversCache()[courseId] ?? null;
}

export function countCachedCollection(slug: SmartCollectionSlug): number {
  const s = getCachedCollections();
  if (slug === "favoritos") return s.favoriteClassIds.length;
  if (slug === "examenes") return s.examItems.length;
  return s.summaryItems.length;
}

export function isCachedFavorite(classId: string): boolean {
  return getCachedCollections().favoriteClassIds.includes(classId);
}

async function migrateLocalOnce(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY) === "1") return;

  const favorites = listLocalFavorites();
  const exams = listLocalExams();
  const summaries = listLocalSummaries();
  if (!favorites.length && !exams.length && !summaries.length) {
    localStorage.setItem(MIGRATED_KEY, "1");
    return;
  }

  await fetch("/api/cuaderno/collections/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favoriteClassIds: favorites, examItems: exams, summaryItems: summaries }),
  });
  localStorage.setItem(MIGRATED_KEY, "1");
}

export async function syncCollectionsFromServer(): Promise<CuadernoCollectionsSnapshot> {
  await migrateLocalOnce();
  const response = await fetch("/api/cuaderno/collections", { cache: "no-store" });
  if (!response.ok) return getCachedCollections();
  const payload = (await response.json()) as CuadernoCollectionsSnapshot;
  writeCache(payload);
  return payload;
}

export async function syncCourseCoversFromServer(): Promise<Record<string, CourseCoverArt>> {
  const response = await fetch("/api/cuaderno/covers", { cache: "no-store" });
  if (!response.ok) return readCoversCache();
  const payload = (await response.json()) as { covers: Record<string, CourseCoverArt> };
  writeCoversCache(payload.covers ?? {});
  return payload.covers ?? {};
}

export async function toggleFavoriteRemote(classId: string): Promise<boolean> {
  const response = await fetch("/api/cuaderno/collections/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classId }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Error al marcar favorito");

  const snapshot = getCachedCollections();
  const next = payload.isFavorite as boolean;
  snapshot.favoriteClassIds = next
    ? [...new Set([...snapshot.favoriteClassIds, classId])]
    : snapshot.favoriteClassIds.filter((id) => id !== classId);
  writeCache(snapshot);
  return next;
}

export async function saveAiItemRemote(
  kind: "exam" | "summary",
  item: Omit<SavedAiItem, "id" | "createdAt">,
): Promise<SavedAiItem> {
  const response = await fetch("/api/cuaderno/collections/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, ...item }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Error al guardar");

  const saved = payload.item as SavedAiItem;
  const snapshot = getCachedCollections();
  if (kind === "exam") snapshot.examItems = [saved, ...snapshot.examItems].slice(0, 80);
  else snapshot.summaryItems = [saved, ...snapshot.summaryItems].slice(0, 80);
  writeCache(snapshot);
  return saved;
}

export async function generateCourseCoverRemote(
  courseId: string,
  courseName: string,
  cycleLabel?: string,
): Promise<CourseCoverArt> {
  const response = await fetch(`/api/cuaderno/courses/${encodeURIComponent(courseId)}/cover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseName, cycleLabel }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "No se pudo generar la portada");

  const coverArt = payload.coverArt as CourseCoverArt;
  const covers = readCoversCache();
  covers[courseId] = coverArt;
  writeCoversCache(covers);
  return coverArt;
}

export async function generateSheetCoverRemote(classId: string): Promise<{
  sheetCover: { icon: string; keyword: string; tint: string };
  notes: string;
}> {
  const response = await fetch(`/api/cuaderno/classes/${classId}/sheet-cover`, {
    method: "POST",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Error al generar mini portada");
  return payload;
}
