import type { TutorNarrationScript } from "@/types/tutor-voice";

const PREFIX = "memoria-tutor-narration:";

export function narrationCacheKey(
  materialId: string,
  scopeKey: string,
): string {
  return `${PREFIX}${materialId}:${scopeKey}`;
}

export function loadNarrationCache(
  materialId: string,
  scopeKey: string,
): TutorNarrationScript | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(narrationCacheKey(materialId, scopeKey));
    if (!raw) return null;
    return JSON.parse(raw) as TutorNarrationScript;
  } catch {
    return null;
  }
}

export function saveNarrationCache(
  materialId: string,
  scopeKey: string,
  script: TutorNarrationScript,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(narrationCacheKey(materialId, scopeKey), JSON.stringify(script));
}
