/**
 * Utilidades para manejo de HTML en el cuaderno
 */

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
 * Obtiene un preview de texto desde HTML
 */
export function getTextPreview(html: string, maxLength: number = 100): string {
  const text = stripHtmlTags(html)
    .replace(/\s+/g, " ") // normalizar espacios
    .trim();

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

/**
 * Obtiene el texto limpio de HTML
 */
export function getCleanText(html: string): string {
  return stripHtmlTags(html);
}
