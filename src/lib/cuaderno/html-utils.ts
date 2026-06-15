/**
 * Utilidades para manejo de HTML en el cuaderno
 */

import { parseCuadernoDocument } from "@/lib/cuaderno/cuaderno-pages";
import { parseNoteContent } from "@/lib/cuaderno/note-meta";

/**
 * Elimina etiquetas HTML de un string
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";

  return html
    .replace(/<[^>]*>/g, "") // Eliminar etiquetas HTML
    .replace(/&nbsp;/g, " ") // nbsp a espacio
    .replace(/&quot;/g, '"') // comillas
    .replace(/&amp;/g, "&") // ampersand
    .replace(/&lt;/g, "<") // menor que
    .replace(/&gt;/g, ">") // mayor que
    .replace(/&#39;/g, "'") // apóstrofe
    .trim();
}

/**
 * Texto legible para listados/búsqueda, sin metadatos JSON del cuaderno.
 */
export function getNotePreviewText(raw: string, maxLength: number = 100): string {
  if (!raw?.trim()) return "";

  try {
    const doc = parseCuadernoDocument(raw);
    const combined = doc.pages
      .map((page) => stripHtmlTags(page.body))
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (combined) {
      return combined.length > maxLength ? `${combined.slice(0, maxLength)}...` : combined;
    }
  } catch {
    /* fallback abajo */
  }

  const { body } = parseNoteContent(raw);
  const fallback = stripHtmlTags(body).replace(/\s+/g, " ").trim();
  if (fallback) {
    return fallback.length > maxLength ? `${fallback.slice(0, maxLength)}...` : fallback;
  }

  return "";
}

/**
 * Obtiene un preview de texto desde HTML o documento del cuaderno
 */
export function getTextPreview(html: string, maxLength: number = 100): string {
  if (html.includes("<!--cuaderno:")) {
    const preview = getNotePreviewText(html, maxLength);
    if (preview) return preview;
  }

  const text = stripHtmlTags(html)
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

/**
 * Obtiene el texto limpio de HTML
 */
export function getCleanText(html: string): string {
  return stripHtmlTags(html);
}
