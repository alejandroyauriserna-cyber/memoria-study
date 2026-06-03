import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import { getStickerById } from "@/lib/cuaderno/sticker-catalog";
import { getPngStickerById } from "@/lib/cuaderno/sticker-png-packs";
import { getStickerSvgDataUrl } from "@/lib/cuaderno/sticker-svg";

export function resolveStickerSrc(obj: DecorationObject): string | undefined {
  if (obj.src) return obj.src;
  if (obj.stickerId?.startsWith("png:")) {
    const png = getPngStickerById(obj.stickerId.slice(4));
    return png?.src;
  }
  const catalog = obj.stickerId ? getStickerById(obj.stickerId) : undefined;
  if (catalog) return getStickerSvgDataUrl(catalog);
  return undefined;
}

export function resolveStickerLabel(obj: DecorationObject): string {
  if (obj.label) return obj.label;
  if (obj.stickerId?.startsWith("png:")) {
    return getPngStickerById(obj.stickerId.slice(4))?.label ?? "Sticker";
  }
  if (obj.stickerId) return getStickerById(obj.stickerId)?.label ?? "Sticker";
  return "Sticker";
}
