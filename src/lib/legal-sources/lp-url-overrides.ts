import {
  coalesceLegalSources,
  getBuiltinIdForLpPreset,
  getLpPresetById,
  isAllowedLpUrl,
  normalizeLpSourceTitle,
} from "@/lib/legal-sources/lp-presets";
import type { LegalSourceRecord, LegalSourcesSettings } from "@/types/legal-sources";

export function normalizeLpUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function sanitizeLpUrlList(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of urls) {
    const normalized = normalizeLpUrlInput(raw);
    if (!normalized || !isAllowedLpUrl(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export function resolvePresetSyncUrls(
  settings: LegalSourcesSettings,
  presetId: string,
  catalogUrl: string,
): string[] {
  const custom = sanitizeLpUrlList(settings.lpPresetUrls?.[presetId] ?? []);
  if (custom.length) return custom;

  const synced = settings.sources.find((s) => s.lpPresetId === presetId);
  if (synced?.syncUrls?.length) return sanitizeLpUrlList(synced.syncUrls);
  if (synced?.sourceUrl) return sanitizeLpUrlList([synced.sourceUrl]);

  return [catalogUrl];
}

export function setPresetSyncUrls(
  settings: LegalSourcesSettings,
  presetId: string,
  urls: string[],
): LegalSourcesSettings {
  const cleaned = sanitizeLpUrlList(urls);
  const next = { ...(settings.lpPresetUrls ?? {}) };

  if (cleaned.length) {
    next[presetId] = cleaned;
  } else {
    delete next[presetId];
  }

  return {
    ...settings,
    lpPresetUrls: Object.keys(next).length ? next : undefined,
  };
}

export function validateLpUrlList(urls: string[]): string | null {
  const cleaned = urls.map(normalizeLpUrlInput).filter(Boolean);
  if (!cleaned.length) return "Agrega al menos una URL de lpderecho.pe.";
  for (const url of cleaned) {
    if (!isAllowedLpUrl(url)) {
      return `URL no permitida: ${url}. Solo se admiten enlaces de lpderecho.pe.`;
    }
  }
  return null;
}

/** Tras sincronizar LP: una sola fuente visible, builtin equivalente desactivado. */
export function applyLpSyncToSettings(
  settings: LegalSourcesSettings,
  source: LegalSourceRecord,
  presetId: string,
  urls: string[],
): LegalSourcesSettings {
  const preset = getLpPresetById(presetId);
  const syncedSource = normalizeLpSourceTitle({
    ...source,
    title: preset?.norm ?? source.title,
    syncUrls: urls,
    sourceUrl: urls[0],
    enabled: true,
    priority: 1,
  });

  const withoutDupes = settings.sources.filter(
    (s) =>
      s.id !== syncedSource.id &&
      !(s.lpPresetId === presetId) &&
      !(preset && s.kind === "builtin" && s.id === getBuiltinIdForLpPreset(presetId)),
  );

  const builtinId = getBuiltinIdForLpPreset(presetId);
  const withBuiltinDisabled = withoutDupes.map((s) =>
    builtinId && s.id === builtinId ? { ...s, enabled: false } : s,
  );

  return setPresetSyncUrls(
    {
      ...settings,
      sources: coalesceLegalSources([syncedSource, ...withBuiltinDisabled]),
    },
    presetId,
    urls,
  );
}

/** Al eliminar fuente LP, no restaurar muestras integradas no verificadas. */
export function restoreBuiltinAfterLpRemove(
  settings: LegalSourcesSettings,
  removed: LegalSourceRecord,
): LegalSourcesSettings {
  return {
    ...settings,
    sources: coalesceLegalSources(settings.sources.filter((s) => s.id !== removed.id)),
  };
}
