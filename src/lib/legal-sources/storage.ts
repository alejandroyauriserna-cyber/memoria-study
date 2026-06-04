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

export function getEnabledSources(settings: LegalSourcesSettings): LegalSourceRecord[] {
  return settings.sources
    .filter((s) => s.enabled)
    .sort((a, b) => a.priority - b.priority);
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

export function removeCustomSource(settings: LegalSourcesSettings, id: string): LegalSourcesSettings {
  return {
    ...settings,
    sources: settings.sources.filter((s) => s.id !== id || s.kind === "builtin"),
  };
}

export async function syncLegalSourcesSettings(settings: LegalSourcesSettings): Promise<void> {
  saveLegalSourcesSettings(settings);
  try {
    await fetch("/api/legal-sources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
  } catch {
    // localStorage sigue siendo respaldo offline
  }
}

export async function fetchLegalSourcesSettings(): Promise<LegalSourcesSettings> {
  const local = loadLegalSourcesSettings();
  try {
    const res = await fetch("/api/legal-sources");
    if (!res.ok) return local;
    const remote = (await res.json()) as LegalSourcesSettings & { synced?: boolean };
    if (!remote.sources?.length) return local;

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
      };
    });

    for (const s of local.sources) {
      if (!remoteIds.has(s.id) && s.id.startsWith("custom-")) {
        mergedList.push(s);
      }
    }

    const settings: LegalSourcesSettings = {
      strictMode: remote.strictMode ?? local.strictMode,
      strictNormativeMode: remote.strictNormativeMode ?? local.strictNormativeMode,
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
