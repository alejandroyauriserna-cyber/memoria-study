import type { Material, MaterialType } from "@/types/material";
import {
  buildLibraryTree,
  filterLibraryTree,
  type LibraryTreeCycle,
} from "@/lib/library/library-tree";

export type LibraryFilters = {
  query: string;
  favoritesOnly: boolean;
  materialType: MaterialType | null;
  cycleNumber: number | null;
};

export const MATERIAL_TYPE_OPTIONS: Array<{ value: MaterialType; label: string }> = [
  { value: "apunte", label: "Apuntes" },
  { value: "resumen", label: "Resúmenes" },
  { value: "pdf", label: "PDF" },
  { value: "caso", label: "Casos" },
  { value: "guia", label: "Guías" },
  { value: "otro", label: "Otros" },
];

export function filterMaterialsByOptions(
  materials: Material[],
  favoriteIds: Set<string>,
  filters: Pick<LibraryFilters, "favoritesOnly" | "materialType" | "cycleNumber">,
): Material[] {
  return materials.filter((material) => {
    if (filters.favoritesOnly && material.id && !favoriteIds.has(material.id)) {
      return false;
    }
    if (filters.materialType && material.materialType !== filters.materialType) {
      return false;
    }
    if (filters.cycleNumber !== null && material.cycleNumber !== filters.cycleNumber) {
      return false;
    }
    return true;
  });
}

export function buildFilteredLibraryTree(
  materials: Material[],
  favoriteIds: Set<string>,
  filters: LibraryFilters,
): { tree: LibraryTreeCycle[]; expandedIds: Set<string>; matchCount: number } {
  const scoped = filterMaterialsByOptions(materials, favoriteIds, filters);
  const fullTree = buildLibraryTree(scoped);
  const { tree, expandedIds } = filterLibraryTree(fullTree, filters.query);
  const matchCount = tree.reduce(
    (sum, cycle) => sum + cycle.materialCount,
    0,
  );

  return { tree, expandedIds, matchCount };
}

export function flattenTreeMaterials(tree: LibraryTreeCycle[]): Material[] {
  const items: Material[] = [];
  for (const cycle of tree) {
    for (const course of cycle.courses) {
      for (const material of course.materials) {
        items.push(material as Material);
      }
    }
  }
  return items;
}
