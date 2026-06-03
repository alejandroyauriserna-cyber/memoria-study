import type { DecorationKind, PostItColor } from "@/lib/cuaderno/decoration-objects";

export const DECORATION_DRAG_MIME = "application/x-cuaderno-decoration";

export type DecorationDragPayload =
  | { type: "sticker"; stickerId: string }
  | { type: "sticker-src"; src: string; label: string; stickerId?: string }
  | { type: "user-sticker"; userStickerId: string; label: string; imageUrl?: string }
  | { type: "postit"; color: PostItColor; category?: string }
  | { type: "deco"; kind: Exclude<DecorationKind, "postit" | "sticker"> };

export function encodeDecorationDrag(payload: DecorationDragPayload): string {
  return JSON.stringify(payload);
}

export function parseDecorationDrag(dataTransfer: DataTransfer): DecorationDragPayload | null {
  const raw = dataTransfer.getData(DECORATION_DRAG_MIME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DecorationDragPayload;
    if (parsed?.type === "sticker" && typeof parsed.stickerId === "string") return parsed;
    if (
      parsed?.type === "sticker-src" &&
      typeof parsed.src === "string" &&
      typeof parsed.label === "string"
    ) {
      return parsed;
    }
    if (
      parsed?.type === "user-sticker" &&
      typeof parsed.userStickerId === "string" &&
      typeof parsed.label === "string"
    ) {
      return parsed;
    }
    if (parsed?.type === "postit" && typeof parsed.color === "string") return parsed;
    if (parsed?.type === "deco" && typeof parsed.kind === "string") return parsed;
  } catch {
    return null;
  }
  return null;
}
