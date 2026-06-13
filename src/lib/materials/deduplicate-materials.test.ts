import { describe, expect, it } from "vitest";
import {
  countHiddenMaterialDuplicates,
  deduplicateMaterials,
} from "@/lib/materials/deduplicate-materials";
import type { Material } from "@/types/material";

function sample(overrides: Partial<Material> & Pick<Material, "id">): Material {
  return {
    authorName: "Estudiante",
    title: "Apuntes Civil I",
    description: "Descripcion de prueba suficientemente larga.",
    courseId: "civil-i-personas",
    courseName: "Civil I",
    cycleNumber: 2,
    cycleLabel: "Ciclo II",
    materialType: "apunte",
    fileName: "apuntes.pdf",
    fileUrl: "https://example.com/a.pdf",
    views: 0,
    downloads: 0,
    likes: 0,
    ...overrides,
  };
}

describe("deduplicateMaterials", () => {
  it("keeps one copy when file names match in the same course", () => {
    const items = [
      sample({ id: "a", fileName: "Apuntes_Civil.pdf", views: 2 }),
      sample({ id: "b", fileName: "apuntes civil.pdf", views: 10, likes: 1 }),
    ];

    const result = deduplicateMaterials(items);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("b");
  });

  it("keeps distinct courses even with same file name", () => {
    const items = [
      sample({ id: "a", courseId: "civil-i-personas", fileName: "apuntes.pdf" }),
      sample({ id: "b", courseId: "constitucional-i", fileName: "apuntes.pdf" }),
    ];

    expect(deduplicateMaterials(items)).toHaveLength(2);
  });

  it("counts hidden duplicates", () => {
    const items = [
      sample({ id: "a", title: "Resumen final" }),
      sample({ id: "b", title: "Resumen Final" }),
      sample({ id: "c", title: "Otro tema", fileName: "otro.pdf" }),
    ];

    expect(countHiddenMaterialDuplicates(items)).toBe(1);
  });
});
