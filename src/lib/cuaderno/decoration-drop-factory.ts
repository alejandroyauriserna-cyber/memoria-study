import {
  createDecoElement,
  createPostIt,
  createShape,
  createStickerFromCatalog,
  createStickerFromLibrary,
  createStickerFromSrc,
  createTextBox,
  type DecorationObject,
  type PostItColor,
  type ShapeVariant,
} from "@/lib/cuaderno/decoration-objects";
import type { DecorationDragPayload } from "@/lib/cuaderno/decoration-drag";
import { getStickerById } from "@/lib/cuaderno/sticker-catalog";
import { getJuridicoStickerById } from "@/lib/cuaderno/sticker-juridico-packs";
import { getPngStickerById } from "@/lib/cuaderno/sticker-png-packs";
import { getStickerSvgDataUrl } from "@/lib/cuaderno/sticker-svg";

export function createDecorationFromDrop(
  payload: DecorationDragPayload,
  at: { x: number; y: number },
): DecorationObject | null {
  const pos = {
    x: Math.min(0.88, Math.max(0.02, at.x - 0.06)),
    y: Math.min(0.88, Math.max(0.02, at.y - 0.06)),
  };

  if (payload.type === "postit") {
    const p = createPostIt(payload.color, "", payload.category);
    return { ...p, x: pos.x, y: pos.y };
  }

  if (payload.type === "deco") {
    const d = createDecoElement(payload.kind);
    return { ...d, x: pos.x, y: pos.y };
  }

  if (payload.type === "sticker-src") {
    return createStickerFromSrc(payload.src, payload.label, {
      stickerId: payload.stickerId,
      at: pos,
      aspectRatio: 1,
    });
  }

  if (payload.type === "user-sticker") {
    return createStickerFromLibrary(payload.userStickerId, payload.imageUrl ?? "", payload.label, pos);
  }

  if (payload.type === "sticker") {
    if (payload.stickerId.startsWith("png:")) {
      const id = payload.stickerId.slice(4);
      const png = getJuridicoStickerById(id) ?? getPngStickerById(id);
      if (!png) return null;
      return createStickerFromSrc(png.src, png.label, {
        stickerId: payload.stickerId,
        at: pos,
        aspectRatio: 1,
      });
    }
    if (payload.stickerId.startsWith("user:")) {
      return createStickerFromLibrary(payload.stickerId.slice(5), "", "Sticker", pos);
    }
    const item = getStickerById(payload.stickerId);
    if (!item) return null;
    const src = getStickerSvgDataUrl(item);
    return createStickerFromCatalog(item.id, src, item.label, pos);
  }

  return null;
}

export function createPostItDragPayload(color: PostItColor) {
  return { type: "postit" as const, color };
}
