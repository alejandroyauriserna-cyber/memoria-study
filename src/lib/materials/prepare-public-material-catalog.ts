import { recordToMaterial } from "@/lib/materials/mapper";
import {
  buildMaterialDuplicateRedirects,
  deduplicateMaterials,
  remapMaterialCatalogIds,
  resolveMaterialCatalogId,
} from "@/lib/materials/deduplicate-materials";
import type { Material, MaterialRecord } from "@/types/material";

export function preparePublicMaterialCatalog(records: MaterialRecord[]) {
  const allMaterials = records.map((record) => recordToMaterial(record));
  const redirects = buildMaterialDuplicateRedirects(allMaterials);
  const catalog = deduplicateMaterials(allMaterials);

  return {
    catalog,
    redirects,
    hiddenDuplicateCount: allMaterials.length - catalog.length,
  };
}

export function applyCatalogFavoriteIds(
  catalog: Material[],
  favoriteIds: string[],
  redirects: Map<string, string>,
): string[] {
  const catalogIds = new Set(catalog.map((material) => material.id).filter(Boolean) as string[]);
  return remapMaterialCatalogIds(favoriteIds, redirects).filter((id) => catalogIds.has(id));
}

export function dedupeStudyHistory<T extends Material & { lastOpenedAt?: string }>(
  items: T[],
  redirects: Map<string, string>,
): T[] {
  const byId = new Map<string, T>();

  for (const item of items) {
    if (!item.id) continue;
    const canonicalId = resolveMaterialCatalogId(item.id, redirects);
    const next = { ...item, id: canonicalId };
    const existing = byId.get(canonicalId);

    if (!existing) {
      byId.set(canonicalId, next);
      continue;
    }

    const existingOpened = existing.lastOpenedAt ? Date.parse(existing.lastOpenedAt) : 0;
    const nextOpened = next.lastOpenedAt ? Date.parse(next.lastOpenedAt) : 0;
    if (nextOpened >= existingOpened) {
      byId.set(canonicalId, next);
    }
  }

  return Array.from(byId.values()).sort(
    (left, right) =>
      Date.parse(right.lastOpenedAt ?? "") - Date.parse(left.lastOpenedAt ?? ""),
  );
}
