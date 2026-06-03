import { ALL_JURIDICO_STICKERS, JURIDICO_STICKER_PACKS, type JuridicoPackId } from "@/lib/cuaderno/sticker-juridico-packs";
import type { PngStickerItem } from "@/lib/cuaderno/sticker-png-packs";

export type StickerPanelTab =
  | "biblioteca"
  | "favoritos"
  | "mis-stickers"
  | "importar"
  | "ia";

export const STICKER_PANEL_TABS: Array<{ id: StickerPanelTab; label: string }> = [
  { id: "biblioteca", label: "Biblioteca" },
  { id: "favoritos", label: "Favoritos" },
  { id: "mis-stickers", label: "Mis stickers" },
  { id: "importar", label: "Importar" },
  { id: "ia", label: "IA" },
];

export const JURIDICO_PACK_FILTERS: Array<{ id: JuridicoPackId | "all"; label: string }> = [
  { id: "all", label: "Todos" },
  ...JURIDICO_STICKER_PACKS.map((p) => ({ id: p.id, label: p.label })),
];

export function filterJuridicoStickers(
  packId: JuridicoPackId | "all",
  query: string,
): PngStickerItem[] {
  const q = query.trim().toLowerCase();
  let items =
    packId === "all"
      ? ALL_JURIDICO_STICKERS
      : JURIDICO_STICKER_PACKS.find((p) => p.id === packId)?.stickers ?? [];

  if (q) {
    items = ALL_JURIDICO_STICKERS.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q)) ||
        s.packId.includes(q),
    );
    if (packId !== "all") items = items.filter((s) => s.packId === packId);
  }
  return items;
}
