import {
  buildSourceFingerprint,
  buildTutorCacheKey,
  type TutorCacheScope,
} from "@/lib/guided-study/tutor-cache";
import type { TutorChatMessage } from "@/types/guided-legal-study";
import type { LegalSourcesSettings } from "@/types/legal-sources";

export async function fetchRemoteTutorChat(
  materialId: string,
  scope: TutorCacheScope,
  examOnly: boolean,
  settings: LegalSourcesSettings,
): Promise<TutorChatMessage[]> {
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

  const response = await fetch(`/api/guided-study/tutor-chat?${params.toString()}`);
  if (!response.ok) return [];

  const payload = (await response.json()) as { messages?: TutorChatMessage[] };
  return payload.messages ?? [];
}
