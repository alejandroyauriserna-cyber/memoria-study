import {
  DEFAULT_LEGAL_SOURCES,
  mergeWithDefaultSources,
} from "@/lib/legal-sources/defaults";
import type {
  LegalSourceAttribution,
  LegalSourceRecord,
  LegalSourcesSettings,
} from "@/types/legal-sources";

const STORAGE_KEY = "memoria-legal-sources-settings";

export function loadLegalSourcesSettings(): LegalSourcesSettings {
  if (typeof window === "undefined") {
    return { strictMode: false, strictNormativeMode: true, sources: DEFAULT_LEGAL_SOURCES };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { strictMode: false, strictNormativeMode: true, sources: DEFAULT_LEGAL_SOURCES };
    }

    const parsed = JSON.parse(raw) as LegalSourcesSettings;
    return {
      strictMode: Boolean(parsed.strictMode),
      strictNormativeMode: parsed.strictNormativeMode !== false,
      lpPresetUrls: parsed.lpPresetUrls,
      studyCategories: parsed.studyCategories,
      wizardCompleted: Boolean(parsed.wizardCompleted),
      sources: mergeWithDefaultSources(parsed.sources ?? []),
    };
  } catch {
    return { strictMode: false, strictNormativeMode: true, sources: DEFAULT_LEGAL_SOURCES };
  }
}

export function saveLegalSourcesSettings(settings: LegalSourcesSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function isManageableSource(source: LegalSourceRecord): boolean {
  return !(
    source.kind === "builtin" &&
    (source.category === "normativa" || source.category === "jurisprudencia")
  );
}

/** Fuentes que el estudiante puede activar/desactivar (incluye desactivadas). */
export function getManageableSources(settings: LegalSourcesSettings): LegalSourceRecord[] {
  return settings.sources
    .filter(isManageableSource)
    .sort((a, b) => a.priority - b.priority);
}

export function getEnabledSources(settings: LegalSourcesSettings): LegalSourceRecord[] {
  return getManageableSources(settings).filter((s) => s.enabled);
}

export function toSourceAttributions(sources: LegalSourceRecord[]): LegalSourceAttribution[] {
  return sources.map((s) => ({
    sourceId: s.id,
    title: s.title,
    category: s.category,
  }));
}

export function updateSourceInSettings(
  settings: LegalSourcesSettings,
  id: string,
  patch: Partial<LegalSourceRecord>,
): LegalSourcesSettings {
  return {
    ...settings,
    sources: settings.sources.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  };
}

export function upsertCustomSource(
  settings: LegalSourcesSettings,
  source: LegalSourceRecord,
): LegalSourcesSettings {
  const without = settings.sources.filter(
    (s) =>
      s.id !== source.id &&
      !(source.lpPresetId && s.lpPresetId === source.lpPresetId),
  );
  return {
    ...settings,
    sources: [source, ...without],
  };
}

export function addCustomSource(
  settings: LegalSourcesSettings,
  source: Omit<LegalSourceRecord, "id"> & { id?: string },
): LegalSourcesSettings {
  const id = source.id ?? `custom-${crypto.randomUUID()}`;
  return upsertCustomSource(settings, { ...source, id, kind: source.kind ?? "upload" });
}

export function upsertWebSource(
  settings: LegalSourcesSettings,
  source: LegalSourceRecord,
): LegalSourcesSettings {
  const without = settings.sources.filter(
    (s) =>
      s.id !== source.id &&
      !(source.webTemplateId && s.webTemplateId === source.webTemplateId),
  );
  return {
    ...settings,
    sources: [source, ...without],
  };
}

export function removeCustomSource(settings: LegalSourcesSettings, id: string): LegalSourcesSettings {
  return {
    ...settings,
    sources: settings.sources.filter((s) => s.id !== id || s.kind === "builtin"),
  };
}

export async function syncLegalSourcesSettings(
  settings: LegalSourcesSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  saveLegalSourcesSettings(settings);
  try {
    const res = await fetch("/api/legal-sources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        error: data.error ?? `No se pudo guardar en el servidor (${res.status}).`,
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Sin conexión al servidor. Los cambios quedaron solo en este dispositivo." };
  }
}

export async function fetchLegalSourcesSettings(): Promise<LegalSourcesSettings> {
  const local = loadLegalSourcesSettings();
  try {
    const res = await fetch("/api/legal-sources");
    if (res.status === 401) return local;
    if (!res.ok) return local;
    const remote = (await res.json()) as LegalSourcesSettings & { synced?: boolean };
    if (!Array.isArray(remote.sources)) return local;

    const localById = new Map(local.sources.map((s) => [s.id, s]));
    const remoteIds = new Set(remote.sources.map((s) => s.id));

    const mergedList = remote.sources.map((s) => {
      const localSource = localById.get(s.id);
      if (!localSource) return s;
      return {
        ...s,
        enabled: localSource.enabled,
        priority: localSource.priority,
        extractedText: s.extractedText ?? localSource.extractedText,
        syncUrls: s.syncUrls ?? localSource.syncUrls,
        lastSyncedAt: s.lastSyncedAt ?? localSource.lastSyncedAt,
      };
    });

    for (const s of local.sources) {
      if (!remoteIds.has(s.id)) {
        mergedList.push(s);
      }
    }

    const settings: LegalSourcesSettings = {
      strictMode: remote.strictMode ?? local.strictMode,
      strictNormativeMode: remote.strictNormativeMode ?? local.strictNormativeMode,
      lpPresetUrls: remote.lpPresetUrls ?? local.lpPresetUrls,
      studyCategories: remote.studyCategories?.length
        ? remote.studyCategories
        : local.studyCategories,
      wizardCompleted: Boolean(remote.wizardCompleted || local.wizardCompleted),
      sources: mergeWithDefaultSources(mergedList),
    };
    saveLegalSourcesSettings(settings);
    return settings;
  } catch {
    return local;
  }
}

export function reorderSourcePriority(
  settings: LegalSourcesSettings,
  id: string,
  direction: "up" | "down",
): LegalSourcesSettings {
  const sorted = [...settings.sources].sort((a, b) => a.priority - b.priority);
  const index = sorted.findIndex((s) => s.id === id);
  if (index < 0) return settings;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return settings;

  const current = sorted[index]!;
  const swap = sorted[swapIndex]!;
  const next = settings.sources.map((s) => {
    if (s.id === current.id) return { ...s, priority: swap.priority };
    if (s.id === swap.id) return { ...s, priority: current.priority };
    return s;
  });

  return { ...settings, sources: next };
}
