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

let activeDecorationDrag: DecorationDragPayload | null = null;

/** Mantiene el payload si el navegador no expone el MIME custom en drop. */
export function beginDecorationDrag(payload: DecorationDragPayload): void {
  activeDecorationDrag = payload;
}

export function endDecorationDrag(): void {
  activeDecorationDrag = null;
}

export function peekDecorationDragSession(): DecorationDragPayload | null {
  return activeDecorationDrag;
}

export function writeDecorationDragData(
  dataTransfer: DataTransfer,
  payload: DecorationDragPayload,
): void {
  beginDecorationDrag(payload);
  const encoded = encodeDecorationDrag(payload);
  dataTransfer.setData(DECORATION_DRAG_MIME, encoded);
  /* Evita que ProseMirror pegue la URL o el JSON en el texto. */
  dataTransfer.setData("text/plain", "\u200B");
  dataTransfer.effectAllowed = "copy";
}

export function isDecorationDragTransfer(dataTransfer: DataTransfer): boolean {
  const types = Array.from(dataTransfer.types);
  if (types.includes(DECORATION_DRAG_MIME)) return true;
  return activeDecorationDrag !== null;
}

function readDecorationDragRaw(dataTransfer: DataTransfer): string {
  return dataTransfer.getData(DECORATION_DRAG_MIME);
}

function parseDecorationDragJson(raw: string): DecorationDragPayload | null {
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

export function parseDecorationDrag(dataTransfer: DataTransfer): DecorationDragPayload | null {
  return parseDecorationDragJson(readDecorationDragRaw(dataTransfer)) ?? peekDecorationDragSession();
}
