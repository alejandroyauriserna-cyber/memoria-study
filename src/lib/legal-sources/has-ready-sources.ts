import type { LegalSourcesSettings } from "@/types/legal-sources";

export function hasReadyLegalSources(settings: LegalSourcesSettings): boolean {
  return settings.sources.some(
    (source) =>
      source.enabled &&
      Boolean(source.lastSyncedAt || source.extractedText?.trim() || source.materialId),
  );
}
