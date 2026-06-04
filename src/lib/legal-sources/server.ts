import { createAdminClient } from "@/lib/supabase/admin";
import { mergeWithDefaultSources } from "@/lib/legal-sources/defaults";
import type { LegalSourceRecord, LegalSourcesSettings } from "@/types/legal-sources";

const MAX_EXCERPT = 14_000;

export function truncateExtractedText(text: string) {
  if (text.length <= MAX_EXCERPT) return text;
  return `${text.slice(0, MAX_EXCERPT)}\n\n[... texto recortado ...]`;
}

export async function loadUserLegalSourcesFromDb(userId: string): Promise<LegalSourceRecord[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .schema("public")
    .from("legal_sources")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category as LegalSourceRecord["category"],
    kind: row.kind as LegalSourceRecord["kind"],
    enabled: row.enabled,
    priority: row.priority,
    author: row.author ?? undefined,
    description: row.description ?? undefined,
    fileUrl: row.file_url ?? undefined,
    fileName: row.file_name ?? undefined,
    materialId: row.material_id ?? undefined,
    extractedText: row.extracted_text
      ? truncateExtractedText(row.extracted_text)
      : undefined,
    updatedAt: row.updated_at ?? undefined,
  }));
}

export async function loadUserLegalSourceSettings(userId: string): Promise<LegalSourcesSettings | null> {
  const admin = createAdminClient();
  const [{ data: settingsRow }, uploaded] = await Promise.all([
    admin
      .schema("public")
      .from("legal_source_settings")
      .select("strict_mode, strict_normative_mode, source_overrides")
      .eq("user_id", userId)
      .maybeSingle(),
    loadUserLegalSourcesFromDb(userId),
  ]);

  const overrides = (settingsRow?.source_overrides ?? {}) as Record<
    string,
    Partial<LegalSourceRecord>
  >;

  const customAndUploaded = uploaded.map((s) => ({
    ...s,
    ...(overrides[s.id] ?? {}),
  }));

  const builtinPatches = Object.entries(overrides)
    .filter(([id]) => id.startsWith("src-"))
    .map(([id, patch]) => ({ id, ...patch } as LegalSourceRecord));

  const sources = mergeWithDefaultSources([...customAndUploaded, ...builtinPatches]);

  return {
    strictMode: Boolean(settingsRow?.strict_mode),
    strictNormativeMode: settingsRow?.strict_normative_mode !== false,
    sources: sources.map((s) => ({
      ...s,
      ...(overrides[s.id] ?? {}),
    })),
  };
}

export async function enrichSourceSettings(
  userId: string | undefined,
  clientSettings?: LegalSourcesSettings,
): Promise<LegalSourcesSettings> {
  if (!userId) {
    return clientSettings ?? { strictMode: false, strictNormativeMode: true, sources: mergeWithDefaultSources([]) };
  }

  try {
    const fromDb = await loadUserLegalSourceSettings(userId);
    if (!clientSettings) return fromDb ?? { strictMode: false, strictNormativeMode: true, sources: mergeWithDefaultSources([]) };

    const merged = new Map<string, LegalSourceRecord>();
    for (const s of fromDb?.sources ?? []) merged.set(s.id, s);
    for (const s of clientSettings.sources) {
      const existing = merged.get(s.id);
      merged.set(s.id, existing ? { ...existing, ...s } : s);
    }

    return {
      strictMode: clientSettings.strictMode,
      strictNormativeMode:
        clientSettings.strictNormativeMode ?? fromDb?.strictNormativeMode ?? true,
      sources: [...merged.values()].sort((a, b) => a.priority - b.priority),
    };
  } catch {
    return clientSettings ?? { strictMode: false, strictNormativeMode: true, sources: mergeWithDefaultSources([]) };
  }
}

export async function saveUserLegalSourceSettings(
  userId: string,
  settings: LegalSourcesSettings,
) {
  const admin = createAdminClient();
  const overrides: Record<string, Partial<LegalSourceRecord>> = {};

  for (const source of settings.sources) {
    overrides[source.id] = {
      enabled: source.enabled,
      priority: source.priority,
    };
  }

  await admin.schema("public").from("legal_source_settings").upsert(
    {
      user_id: userId,
      strict_mode: settings.strictMode,
      strict_normative_mode: settings.strictNormativeMode,
      source_overrides: overrides,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  for (const source of settings.sources) {
    if (source.kind === "upload" || source.kind === "material") {
      await admin
        .schema("public")
        .from("legal_sources")
        .update({ enabled: source.enabled, priority: source.priority })
        .eq("id", source.id)
        .eq("user_id", userId);
    }
  }
}
