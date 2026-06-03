import type { CuadernoTemplateId } from "@/lib/cuaderno/templates";

/** Clases CSS aplicadas a la hoja según plantilla (patrones reales, sin imágenes). */
export function getPaperClasses(templateId: CuadernoTemplateId): string {
  return `cn-paper tpl-${templateId}`;
}

/** Clase para mini-preview en selector de plantillas. */
export function getTemplatePreviewClass(templateId: CuadernoTemplateId): string {
  return `cn-paper-preview tpl-${templateId}`;
}

export const TEMPLATE_PREVIEW_LABELS: Record<string, string> = {
  blank: "Blanco",
  grid: "Cuadriculado",
  ruled: "Rayado",
  cornell: "Cornell",
  legal: "Jurídico",
  summary: "Resumen",
  research: "Investigación",
  flashcards: "Flashcards",
  "legal-caso": "Caso",
  "legal-sentencia": "Sentencia",
  "legal-interpretacion": "Norma",
  "legal-dictamen": "Dictamen",
  "legal-ficha": "Ficha",
  "legal-comentario": "Jurisprudencia",
};
