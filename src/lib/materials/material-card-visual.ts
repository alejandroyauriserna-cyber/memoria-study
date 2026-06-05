import type { Material, MaterialType } from "@/types/material";

const COURSE_GRADIENTS = [
  "linear-gradient(155deg, #134e4a 0%, #0f766e 38%, #0f172a 100%)",
  "linear-gradient(155deg, #312e81 0%, #4338ca 40%, #0f172a 100%)",
  "linear-gradient(155deg, #78350f 0%, #92400e 35%, #1c1917 100%)",
  "linear-gradient(155deg, #881337 0%, #be123c 38%, #0f172a 100%)",
  "linear-gradient(155deg, #4c1d95 0%, #7c3aed 40%, #0f172a 100%)",
  "linear-gradient(155deg, #0c4a6e 0%, #0369a1 38%, #0f172a 100%)",
];

const TYPE_LABEL: Record<MaterialType, string> = {
  apunte: "Apunte",
  resumen: "Resumen",
  pdf: "PDF",
  caso: "Caso",
  guia: "Guía",
  otro: "Material",
};

export function getMaterialCoverGradient(courseId: string): string {
  const seed = courseId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return COURSE_GRADIENTS[seed % COURSE_GRADIENTS.length];
}

export function getMaterialTypeLabel(type: MaterialType): string {
  return TYPE_LABEL[type] ?? "Material";
}

export function getMaterialPageCount(material: Material): number {
  if (material.materialType === "resumen") return 1;

  const fromName = material.fileName.match(/(\d{1,3})\s*(p|pag|pág|pags?)/i);
  if (fromName) return Number.parseInt(fromName[1], 10);

  const seedSource = material.id ?? material.title;
  const seed = seedSource.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 8 + (seed % 24);
}

export function getMaterialPagesDisplay(material: Material): string {
  const count = getMaterialPageCount(material);
  return count === 1 ? "1 página" : `${count} páginas`;
}

export function getMaterialConceptCount(material: Material): number {
  const text = `${material.title} ${material.description}`.toLowerCase();
  const tokens = text.match(/[a-záéíóúñ]{5,}/gi) ?? [];
  const unique = new Set(tokens);
  const base = Math.min(14, Math.max(4, Math.ceil(unique.size * 0.55)));
  if (material.materialType === "caso") return base + 2;
  if (material.materialType === "resumen") return Math.max(3, base - 2);
  return base;
}

export function getMaterialReadingMinutes(material: Material): number {
  const pages = getMaterialPageCount(material);
  if (material.materialType === "resumen") return 4;
  return Math.max(5, Math.round(pages * 2.4));
}

export function getMaterialCoverFormat(material: Material): string {
  if (material.materialType === "resumen") return "RES";
  return "PDF";
}
