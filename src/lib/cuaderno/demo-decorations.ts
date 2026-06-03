import {
  createStickerFromCatalog,
  type DecorationObject,
} from "@/lib/cuaderno/decoration-objects";
import { getStickerById } from "@/lib/cuaderno/sticker-catalog";
import { getStickerSvgDataUrl } from "@/lib/cuaderno/sticker-svg";

const DEMO_IDS = ["balanza", "constitucion", "libro", "juez", "estrella"] as const;

const DEMO_LAYOUT: Array<{ x: number; y: number; w: number; h: number; rotation: number }> = [
  { x: 0.06, y: 0.1, w: 0.11, h: 0.11, rotation: -6 },
  { x: 0.78, y: 0.08, w: 0.12, h: 0.12, rotation: 4 },
  { x: 0.42, y: 0.06, w: 0.1, h: 0.1, rotation: 0 },
  { x: 0.72, y: 0.22, w: 0.13, h: 0.13, rotation: -3 },
  { x: 0.08, y: 0.28, w: 0.09, h: 0.09, rotation: 8 },
];

export function buildDemoDecorations(): DecorationObject[] {
  return DEMO_IDS.map((id, i) => {
    const item = getStickerById(id);
    if (!item) return null;
    const layout = DEMO_LAYOUT[i];
    const base = createStickerFromCatalog(
      id,
      getStickerSvgDataUrl(item),
      item.label,
      { x: layout.x, y: layout.y },
    );
    return {
      ...base,
      w: layout.w,
      h: layout.h,
      rotation: layout.rotation,
    };
  }).filter((d): d is DecorationObject => d !== null);
}

export function demoSeedKey(classId: string, pageId: string): string {
  return `cuaderno-demo-stickers:${classId}:${pageId}`;
}

export function shouldSeedDemoDecorations(
  classId: string,
  pageId: string,
  decorations: DecorationObject[],
): boolean {
  if (decorations.length > 0) return false;
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(demoSeedKey(classId, pageId));
}

export function markDemoSeeded(classId: string, pageId: string): void {
  localStorage.setItem(demoSeedKey(classId, pageId), "1");
}
