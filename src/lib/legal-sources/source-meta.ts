import type { LegalSourceRecord } from "@/types/legal-sources";

/** Etiqueta breve de verificación para mostrar al estudiante. */
export function formatSourceSyncLabel(source: LegalSourceRecord): string | null {
  if (source.lastSyncedAt) {
    return `Sync ${new Date(source.lastSyncedAt).toLocaleDateString("es-PE")}`;
  }
  if (source.extractedText?.trim()) {
    return "PDF indexado";
  }
  if (source.kind === "material") {
    return "Biblioteca";
  }
  if (source.kind === "url" && source.articleCount) {
    return `${source.articleCount} arts. LP`;
  }
  if (source.kind === "url") {
    return "URL indexada";
  }
  return null;
}
