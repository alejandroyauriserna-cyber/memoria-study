import { htmlToPlainText } from "@/lib/legal-sources/parse-lp-html";

const MAX_DOCUMENT_CHARS = 120_000;

/** Extrae texto legible de una página web jurídica (sentencias, resoluciones, doctrina). */
export function extractWebDocumentText(html: string): string {
  const plain = html.includes("<") ? htmlToPlainText(html) : html;
  const cleaned = plain
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (cleaned.length <= MAX_DOCUMENT_CHARS) return cleaned;
  return `${cleaned.slice(0, MAX_DOCUMENT_CHARS)}\n\n[... texto recortado ...]`;
}

export function buildDocumentExtractPreview(text: string, maxChars = 14_000): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[... texto recortado ...]`;
}
