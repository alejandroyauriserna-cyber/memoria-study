import {
  normalizeMaterialFileName,
  normalizeMaterialText,
} from "@/lib/materials/normalize-material-text";
import type { Material } from "@/types/material";

export type MaterialDuplicateReason = "file_hash" | "file_name" | "title";

export type MaterialWithHash = Material & { fileHash?: string | null };

function engagementScore(material: Material): number {
  return (material.views ?? 0) + (material.downloads ?? 0) * 2 + (material.likes ?? 0) * 3;
}

function pickPreferredMaterial(current: Material, candidate: Material): Material {
  const currentScore = engagementScore(current);
  const candidateScore = engagementScore(candidate);
  if (candidateScore !== currentScore) {
    return candidateScore > currentScore ? candidate : current;
  }

  const currentCreated = current.createdAt ? Date.parse(current.createdAt) : 0;
  const candidateCreated = candidate.createdAt ? Date.parse(candidate.createdAt) : 0;
  return candidateCreated >= currentCreated ? candidate : current;
}

export function materialDuplicateKey(
  material: Pick<Material, "title" | "fileName" | "courseId"> & { fileHash?: string | null },
): { key: string; reason: MaterialDuplicateReason } {
  if (material.fileHash?.trim()) {
    return { key: `hash:${material.fileHash.trim()}`, reason: "file_hash" };
  }

  const fileStem = normalizeMaterialFileName(material.fileName);
  if (fileStem.length >= 3) {
    return { key: `file:${material.courseId}:${fileStem}`, reason: "file_name" };
  }

  const title = normalizeMaterialText(material.title);
  return { key: `title:${material.courseId}:${title}`, reason: "title" };
}

export function deduplicateMaterials<T extends MaterialWithHash>(materials: T[]): T[] {
  const winners = new Map<string, T>();

  for (const material of materials) {
    const { key } = materialDuplicateKey(material);
    const existing = winners.get(key);
    winners.set(key, existing ? (pickPreferredMaterial(existing, material) as T) : material);
  }

  const seenIds = new Set<string>();
  const ordered: T[] = [];

  for (const material of materials) {
    const { key } = materialDuplicateKey(material);
    const winner = winners.get(key);
    if (!winner?.id || winner.id !== material.id) continue;
    if (seenIds.has(winner.id)) continue;
    seenIds.add(winner.id);
    ordered.push(winner);
  }

  return ordered;
}

export function countHiddenMaterialDuplicates(materials: MaterialWithHash[]): number {
  return materials.length - deduplicateMaterials(materials).length;
}

export function buildMaterialDuplicateRedirects<T extends MaterialWithHash>(
  materials: T[],
): Map<string, string> {
  const winnersByKey = new Map<string, T>();

  for (const material of materials) {
    const { key } = materialDuplicateKey(material);
    const existing = winnersByKey.get(key);
    winnersByKey.set(
      key,
      existing ? (pickPreferredMaterial(existing, material) as T) : material,
    );
  }

  const redirects = new Map<string, string>();
  for (const material of materials) {
    if (!material.id) continue;
    const winner = winnersByKey.get(materialDuplicateKey(material).key);
    if (winner?.id && winner.id !== material.id) {
      redirects.set(material.id, winner.id);
    }
  }

  return redirects;
}

export function resolveMaterialCatalogId(
  materialId: string,
  redirects: Map<string, string>,
): string {
  return redirects.get(materialId) ?? materialId;
}

export function remapMaterialCatalogIds(
  materialIds: string[],
  redirects: Map<string, string>,
): string[] {
  const seen = new Set<string>();
  const resolved: string[] = [];

  for (const materialId of materialIds) {
    const canonicalId = resolveMaterialCatalogId(materialId, redirects);
    if (seen.has(canonicalId)) continue;
    seen.add(canonicalId);
    resolved.push(canonicalId);
  }

  return resolved;
}
