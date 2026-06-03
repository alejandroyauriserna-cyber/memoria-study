import {
  STICKER_CATALOG,
  searchStickers,
  type StickerCatalogItem,
  type StickerCategoryId,
} from "@/lib/cuaderno/sticker-catalog";

export type StickerPanelTab =
  | "juridicos"
  | "estudio"
  | "universidad"
  | "ia"
  | "decorativos"
  | "postits"
  | "favoritos";

export const STICKER_PANEL_TABS: Array<{ id: StickerPanelTab; label: string; icon: string }> = [
  { id: "juridicos", label: "Jurídicos", icon: "⚖️" },
  { id: "estudio", label: "Estudio", icon: "📚" },
  { id: "universidad", label: "Universidad", icon: "🎓" },
  { id: "ia", label: "IA", icon: "🧠" },
  { id: "decorativos", label: "Decorativos", icon: "✨" },
  { id: "postits", label: "Post-its", icon: "📝" },
  { id: "favoritos", label: "Favoritos", icon: "❤️" },
];

const TAB_CATEGORIES: Record<Exclude<StickerPanelTab, "postits" | "favoritos">, StickerCategoryId[]> = {
  juridicos: ["derecho", "legislacion", "constitucional", "procesal", "corporativo"],
  estudio: ["estudio", "apuntes"],
  universidad: ["universidad"],
  ia: ["ia"],
  decorativos: ["productividad", "motivacion", "kawaii"],
};

export function filterStickersForPanel(
  tab: StickerPanelTab,
  query: string,
  favoriteIds: string[],
): StickerCatalogItem[] {
  const q = query.trim().toLowerCase();

  if (tab === "favoritos") {
    const favs = favoriteIds
      .map((id) => STICKER_CATALOG.find((s) => s.id === id))
      .filter((s): s is StickerCatalogItem => !!s);
    if (!q) return favs;
    return favs.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q)) ||
        s.id.includes(q),
    );
  }

  if (tab === "postits") return [];

  const categories = TAB_CATEGORIES[tab];
  let items = STICKER_CATALOG.filter((s) => categories.includes(s.category));

  if (q) {
    items = searchStickers(q).filter((s) => categories.includes(s.category));
  }

  return items;
}
