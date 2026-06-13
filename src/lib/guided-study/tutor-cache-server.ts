import {
  buildSourceFingerprint,
  buildTutorCacheKey,
  hasTutorCacheContent,
  type TutorCacheScope,
} from "@/lib/guided-study/tutor-cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LegalSourcesSettings } from "@/types/legal-sources";
import type { TutorResponse } from "@/types/guided-legal-study";

const MAX_ENTRIES_PER_MATERIAL = 80;

export type TutorCachePayload = Pick<
  TutorResponse,
  "analysis" | "customReply" | "activeSources"
>;

export async function loadServerTutorCache(
  userId: string,
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
): Promise<TutorCachePayload | null> {
  const admin = createAdminClient();
  const cacheKey = buildTutorCacheKey(scope, examOnly);

  const { data, error } = await admin
    .from("guided_study_tutor_cache")
    .select("result, source_fingerprint")
    .eq("user_id", userId)
    .eq("material_id", materialId)
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") return null;
    throw error;
  }

  if (!data || data.source_fingerprint !== fingerprint) return null;

  const result = data.result as TutorCachePayload;
  return hasTutorCacheContent(result) ? result : null;
}

export async function saveServerTutorCache(
  userId: string,
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  fingerprint: string,
  result: TutorCachePayload,
) {
  if (!hasTutorCacheContent(result)) return;

  const admin = createAdminClient();
  const cacheKey = buildTutorCacheKey(scope, examOnly);
  const now = new Date().toISOString();

  const { error } = await admin.from("guided_study_tutor_cache").upsert(
    {
      user_id: userId,
      material_id: materialId,
      cache_key: cacheKey,
      source_fingerprint: fingerprint,
      result,
      cached_at: now,
    },
    { onConflict: "user_id,material_id,cache_key" },
  );

  if (error) {
    if (error.code === "42P01") return;
    throw error;
  }

  const { data: rows, error: listError } = await admin
    .from("guided_study_tutor_cache")
    .select("id, cached_at")
    .eq("user_id", userId)
    .eq("material_id", materialId)
    .order("cached_at", { ascending: true });

  if (listError || !rows || rows.length <= MAX_ENTRIES_PER_MATERIAL) return;

  const toDelete = rows.slice(0, rows.length - MAX_ENTRIES_PER_MATERIAL).map((row) => row.id);
  await admin.from("guided_study_tutor_cache").delete().in("id", toDelete);
}

export function resolveTutorCacheScope(input: {
  pageNumber: number;
  chapterId?: string;
}): TutorCacheScope {
  if (input.chapterId) {
    return { type: "chapter", chapterId: input.chapterId };
  }
  return { type: "page", pageNumber: input.pageNumber };
}

export function buildServerSourceFingerprint(settings: LegalSourcesSettings): string {
  return buildSourceFingerprint(settings);
}
