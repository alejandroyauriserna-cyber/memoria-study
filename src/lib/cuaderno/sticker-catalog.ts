export type StickerCategoryId =
  | "derecho"
  | "estudio"
  | "ia"
  | "constitucional"
  | "legislacion"
  | "apuntes"
  | "universidad"
  | "productividad"
  | "motivacion"
  | "kawaii"
  | "procesal"
  | "corporativo";

export type StickerCatalogItem = {
  id: string;
  label: string;
  glyph: string;
  category: StickerCategoryId;
  tags: string[];
  packIds: string[];
};

export type StickerPack = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  category: StickerCategoryId;
  stickerIds: string[];
};

export const STICKER_CATEGORIES: Array<{ id: StickerCategoryId; label: string; icon: string }> = [
  { id: "derecho", label: "Derecho", icon: "⚖️" },
  { id: "estudio", label: "Estudio", icon: "📚" },
  { id: "ia", label: "IA", icon: "🧠" },
  { id: "constitucional", label: "Constitucional", icon: "🏛️" },
  { id: "legislacion", label: "Legislación", icon: "📜" },
  { id: "apuntes", label: "Apuntes", icon: "✍️" },
  { id: "universidad", label: "Universidad", icon: "🎓" },
  { id: "productividad", label: "Productividad", icon: "☕" },
  { id: "motivacion", label: "Motivación", icon: "✨" },
  { id: "kawaii", label: "Kawaii", icon: "🩷" },
  { id: "procesal", label: "Procesal", icon: "📋" },
  { id: "corporativo", label: "Corporativo", icon: "💼" },
];

import { STICKER_CATALOG_ITEMS } from "@/lib/cuaderno/sticker-catalog-items";
import { getStickerSvgDataUrl } from "@/lib/cuaderno/sticker-svg";

export const STICKER_CATALOG: StickerCatalogItem[] = STICKER_CATALOG_ITEMS;

export const STICKER_MARKETPLACE: StickerPack[] = [
  {
    id: "derecho-constitucional",
    label: "Derecho Constitucional",
    emoji: "🏛️",
    description: "Constitución, tribunal, pergamino y balanza.",
    category: "constitucional",
    stickerIds: STICKER_CATALOG.filter((s) => s.packIds.includes("derecho-constitucional")).map((s) => s.id),
  },
  {
    id: "derecho-civil",
    label: "Derecho Civil",
    emoji: "📕",
    description: "Código, sello, contratos y libro.",
    category: "derecho",
    stickerIds: STICKER_CATALOG.filter((s) => s.packIds.includes("derecho-civil")).map((s) => s.id),
  },
  {
    id: "derecho-penal",
    label: "Derecho Penal",
    emoji: "⚖️",
    description: "Alertas, justicia y sentencias.",
    category: "derecho",
    stickerIds: STICKER_CATALOG.filter((s) => s.packIds.includes("derecho-penal")).map((s) => s.id),
  },
  {
    id: "derecho-tributario",
    label: "Derecho Tributario",
    emoji: "💰",
    description: "Impuestos y corporativo.",
    category: "corporativo",
    stickerIds: STICKER_CATALOG.filter((s) => s.packIds.includes("derecho-tributario")).map((s) => s.id),
  },
  {
    id: "derecho-procesal",
    label: "Derecho Procesal",
    emoji: "📋",
    description: "Martillo, juez y trámites.",
    category: "procesal",
    stickerIds: STICKER_CATALOG.filter((s) => s.packIds.includes("derecho-procesal")).map((s) => s.id),
  },
  {
    id: "examenes-finales",
    label: "Exámenes Finales",
    emoji: "🔥",
    description: "Checks, estrellas, café y metas.",
    category: "motivacion",
    stickerIds: STICKER_CATALOG.filter((s) => s.packIds.includes("examenes-finales")).map((s) => s.id),
  },
  {
    id: "productividad-uni",
    label: "Productividad Universitaria",
    emoji: "☕",
    description: "Todo lo esencial para estudiar con estilo.",
    category: "productividad",
    stickerIds: STICKER_CATALOG.filter((s) => s.packIds.includes("productividad-uni")).map((s) => s.id),
  },
];

export function getStickerById(id: string): StickerCatalogItem | undefined {
  return STICKER_CATALOG.find((s) => s.id === id);
}

export function getPackExport(packId: string) {
  const pack = STICKER_MARKETPLACE.find((p) => p.id === packId);
  if (!pack) return null;
  const stickers = pack.stickerIds
    .map((id) => getStickerById(id))
    .filter((s): s is StickerCatalogItem => !!s)
    .map((s) => ({
      id: s.id,
      label: s.label,
      glyph: s.glyph,
      category: s.category,
      tags: s.tags,
      svg: getStickerSvgDataUrl(s),
    }));
  return { pack, stickers, count: stickers.length };
}

export function searchStickers(query: string, category?: StickerCategoryId | "all"): StickerCatalogItem[] {
  const q = query.trim().toLowerCase();
  return STICKER_CATALOG.filter((s) => {
    if (category && category !== "all" && s.category !== category) return false;
    if (!q) return true;
    return (
      s.label.toLowerCase().includes(q) ||
      s.tags.some((t) => t.includes(q)) ||
      s.id.includes(q)
    );
  });
}
