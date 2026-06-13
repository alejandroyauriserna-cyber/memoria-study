import {
  buildSourceFingerprint,
  buildTutorCacheKey,
  type TutorCacheScope,
} from "@/lib/guided-study/tutor-cache";
import type { TutorResponse } from "@/types/guided-legal-study";
import type { LegalSourcesSettings } from "@/types/legal-sources";

export async function fetchRemoteTutorCache(
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  settings: LegalSourcesSettings,
): Promise<Pick<TutorResponse, "analysis" | "customReply" | "activeSources"> | null> {
  const fingerprint = buildSourceFingerprint(settings);
  const cacheKey = buildTutorCacheKey(scope, examOnly);
  const params = new URLSearchParams({
    materialId,
    cacheKey,
    fingerprint,
    examOnly: examOnly ? "1" : "0",
    pageNumber: String(scope.type === "page" ? scope.pageNumber : 1),
  });

  if (scope.type === "chapter") {
    params.set("chapterId", scope.chapterId);
  }

  const response = await fetch(`/api/guided-study/tutor-cache?${params.toString()}`);
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    cached?: Pick<TutorResponse, "analysis" | "customReply" | "activeSources"> | null;
  };

  return payload.cached ?? null;
}
