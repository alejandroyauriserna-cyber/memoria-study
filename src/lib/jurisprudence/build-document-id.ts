import type {
  JurisprudenceMateria,
  JurisprudenceTipo,
} from "@/types/jurisprudence";
import {
  JURISPRUDENCE_MATERIAS,
  JURISPRUDENCE_TIPOS,
} from "@/types/jurisprudence";

export type JurisprudenceDocumentStatus = "published" | "pending" | "rejected";

export function buildJurisprudenceDocumentId(
  expediente: string | null | undefined,
  title: string,
): string {
  const base = (expediente?.trim() || title.trim()).toLowerCase();
  const slug = base
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  return slug || `contrib-${crypto.randomUUID().slice(0, 8)}`;
}

export function ensureUniqueJurisprudenceId(baseId: string, suffix: string): string {
  return `${baseId}-${suffix}`.slice(0, 120).replace(/-+$/g, "");
}

export function parseKeywordsInput(raw: string): string[] {
  return raw
    .split(/[,;]+/)
    .map((kw) => kw.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function isJurisprudenceMateria(value: string): value is JurisprudenceMateria {
  return (JURISPRUDENCE_MATERIAS as readonly string[]).includes(value);
}

export function isJurisprudenceTipo(value: string): value is JurisprudenceTipo {
  return (JURISPRUDENCE_TIPOS as readonly string[]).includes(value);
}

export function sanitizePdfFileName(fileName: string): string {
  const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lastDot = normalized.lastIndexOf(".");
  const name = lastDot > 0 ? normalized.slice(0, lastDot) : normalized;
  const ext = lastDot > 0 ? normalized.slice(lastDot + 1) : "pdf";
  const safeName = name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "") || "sentencia";
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
  return `${safeName}.${safeExt}`;
}
