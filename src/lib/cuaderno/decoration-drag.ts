import type { DecorationKind, PostItColor } from "@/lib/cuaderno/decoration-objects";

export const DECORATION_DRAG_MIME = "application/x-cuaderno-decoration";
/** Fallback para navegadores que ocultan MIME custom en dragOver/drop. */
export const DECORATION_DRAG_PLAIN_PREFIX = "cuaderno-decoration:";

export type DecorationDragPayload =
  | { type: "sticker"; stickerId: string }
  | { type: "sticker-src"; src: string; label: string; stickerId?: string }
  | { type: "user-sticker"; userStickerId: string; label: string; imageUrl?: string }
  | { type: "postit"; color: PostItColor; category?: string }
  | { type: "deco"; kind: Exclude<DecorationKind, "postit" | "sticker"> };

export function encodeDecorationDrag(payload: DecorationDragPayload): string {
  return JSON.stringify(payload);
}

export function writeDecorationDragData(
  dataTransfer: DataTransfer,
  payload: DecorationDragPayload,
): void {
  const encoded = encodeDecorationDrag(payload);
  dataTransfer.setData(DECORATION_DRAG_MIME, encoded);
  dataTransfer.setData("text/plain", `${DECORATION_DRAG_PLAIN_PREFIX}${encoded}`);
  dataTransfer.effectAllowed = "copy";
}

export function isDecorationDragTransfer(dataTransfer: DataTransfer): boolean {
  const types = Array.from(dataTransfer.types);
  if (types.includes(DECORATION_DRAG_MIME)) return true;
  return types.includes("text/plain");
}

function readDecorationDragRaw(dataTransfer: DataTransfer): string {
  const custom = dataTransfer.getData(DECORATION_DRAG_MIME);
  if (custom) return custom;
  const plain = dataTransfer.getData("text/plain");
  if (plain.startsWith(DECORATION_DRAG_PLAIN_PREFIX)) {
    return plain.slice(DECORATION_DRAG_PLAIN_PREFIX.length);
  }
  return "";
}

export function parseDecorationDrag(dataTransfer: DataTransfer): DecorationDragPayload | null {
  const raw = readDecorationDragRaw(dataTransfer);
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
