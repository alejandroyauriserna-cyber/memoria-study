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
  const name = material.fileName?.toLowerCase() ?? "";
  if (name.endsWith(".pptx") || name.endsWith(".pptm")) return "PPT";
  return "PDF";
}

const LEGAL_AREA: Record<MaterialType, { label: string; accent: string; soft: string }> = {
  apunte: { label: "Apuntes", accent: "#0ea5e9", soft: "linear-gradient(160deg, #e0f2fe 0%, #bae6fd 55%, #7dd3fc 100%)" },
  resumen: { label: "Resumen", accent: "#8b5cf6", soft: "linear-gradient(160deg, #ede9fe 0%, #ddd6fe 55%, #c4b5fd 100%)" },
  pdf: { label: "PDF", accent: "#14b8a6", soft: "linear-gradient(160deg, #ccfbf1 0%, #99f6e4 55%, #5eead4 100%)" },
  caso: { label: "Caso", accent: "#f43f5e", soft: "linear-gradient(160deg, #ffe4e6 0%, #fecdd3 55%, #fda4af 100%)" },
  guia: { label: "Guía", accent: "#f59e0b", soft: "linear-gradient(160deg, #fef3c7 0%, #fde68a 55%, #fcd34d 100%)" },
  otro: { label: "Material", accent: "#64748b", soft: "linear-gradient(160deg, #f1f5f9 0%, #e2e8f0 55%, #cbd5e1 100%)" },
};

export function getMaterialLegalArea(material: Material) {
  return LEGAL_AREA[material.materialType] ?? LEGAL_AREA.otro;
}

export function getMaterialThumbnailUrl(material: Material): string | null {
  const url = material.fileUrl?.toLowerCase() ?? "";
  const name = material.fileName?.toLowerCase() ?? "";
  if (/\.(png|jpe?g|webp|gif)(\?|$)/.test(url) || /\.(png|jpe?g|webp|gif)$/.test(name)) {
    return material.fileUrl;
  }
  return null;
}

export function getMaterialStudyProgress(material: Material): number | null {
  const views = material.views ?? 0;
  if (views < 2) return null;
  const engagement = views + (material.downloads ?? 0) * 2 + (material.likes ?? 0) * 3;
  return Math.min(96, Math.max(12, Math.round(engagement * 2.8)));
}

export function formatMaterialRelativeTime(iso?: string | null): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${Math.max(1, mins)} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function getMaterialLastStudiedLabel(material: Material): string | null {
  return formatMaterialRelativeTime(material.lastOpenedAt ?? material.favoriteCreatedAt ?? material.createdAt);
}
