import type { LegalSourceCategory } from "@/types/legal-sources";
import { isAllowedLpUrl } from "@/lib/legal-sources/lp-presets";

/** Dominios oficiales o jurídicos permitidos para sync de documentos (Fase B). */
export const TRUSTED_DOCUMENT_WEB_HOSTS = [
  "lpderecho.pe",
  "www.lpderecho.pe",
  "tc.gob.pe",
  "www.tc.gob.pe",
  "pj.gob.pe",
  "www.pj.gob.pe",
  "sunat.gob.pe",
  "www.sunat.gob.pe",
  "spij.minjus.gob.pe",
  "www.spij.minjus.gob.pe",
] as const;

export function normalizeWebUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getUrlHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedDocumentWebUrl(url: string): boolean {
  const hostname = getUrlHostname(normalizeWebUrlInput(url));
  if (!hostname) return false;
  return TRUSTED_DOCUMENT_WEB_HOSTS.some((h) => h === hostname);
}

export function isAllowedWebUrlForCategory(
  url: string,
  category: LegalSourceCategory,
): boolean {
  const normalized = normalizeWebUrlInput(url);
  if (category === "normativa") return isAllowedLpUrl(normalized);
  if (category === "jurisprudencia" || category === "doctrina") {
    return isAllowedDocumentWebUrl(normalized);
  }
  return isAllowedDocumentWebUrl(normalized) || isAllowedLpUrl(normalized);
}

export function validateWebUrlList(
  urls: string[],
  category: LegalSourceCategory,
): string | null {
  const cleaned = urls.map(normalizeWebUrlInput).filter(Boolean);
  if (!cleaned.length) return "Agrega al menos una URL.";
  for (const url of cleaned) {
    if (!isAllowedWebUrlForCategory(url, category)) {
      return `URL no permitida para ${category}: ${url}. Usa LP, TC, PJ, SUNAT o SPIJ.`;
    }
  }
  return null;
}

export function sanitizeWebUrlList(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of urls) {
    const url = normalizeWebUrlInput(raw);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}
