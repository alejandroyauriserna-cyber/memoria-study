import type { TutorNarrationScript } from "@/types/tutor-voice";
import type { NarrationStyle } from "@/types/tutor-voice";

const PREFIX = "memoria-tutor-narration:";

export function narrationCacheKey(
  materialId: string,
  scopeKey: string,
  style?: NarrationStyle,
): string {
  const styleSuffix = style ? `:${style}` : "";
  return `${PREFIX}${materialId}:${scopeKey}${styleSuffix}`;
}

export function loadNarrationCache(
  materialId: string,
  scopeKey: string,
  style?: NarrationStyle,
): TutorNarrationScript | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(narrationCacheKey(materialId, scopeKey, style));
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
  style?: NarrationStyle,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    narrationCacheKey(materialId, scopeKey, style ?? script.style),
    JSON.stringify(script),
  );
}
