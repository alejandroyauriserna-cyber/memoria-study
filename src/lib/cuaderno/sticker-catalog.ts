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

export const STICKER_CATALOG: StickerCatalogItem[] = [
  { id: "balanza", label: "Balanza", glyph: "⚖️", category: "derecho", tags: ["justicia", "ley"], packIds: ["derecho-constitucional", "derecho-civil"] },
  { id: "martillo", label: "Martillo", glyph: "🔨", category: "derecho", tags: ["juez", "sentencia"], packIds: ["derecho-procesal"] },
  { id: "constitucion", label: "Constitución", glyph: "📜", category: "constitucional", tags: ["norma", "estado"], packIds: ["derecho-constitucional"] },
  { id: "libro", label: "Libro abierto", glyph: "📖", category: "estudio", tags: ["leer", "clase"], packIds: ["productividad-uni", "derecho-civil"] },
  { id: "codigo", label: "Código civil", glyph: "📕", category: "legislacion", tags: ["codigo", "articulo"], packIds: ["derecho-civil"] },
  { id: "pergamino", label: "Pergamino", glyph: "📃", category: "legislacion", tags: ["decreto", "ley"], packIds: ["derecho-constitucional"] },
  { id: "juez", label: "Juez", glyph: "👨‍⚖️", category: "derecho", tags: ["tribunal"], packIds: ["derecho-procesal"] },
  { id: "toga", label: "Toga", glyph: "🎓", category: "universidad", tags: ["abogado", "egresado"], packIds: ["productividad-uni"] },
  { id: "sello", label: "Sello notarial", glyph: "🔏", category: "derecho", tags: ["notaria", "fe"], packIds: ["derecho-civil"] },
  { id: "marcador", label: "Marcador", glyph: "🖍️", category: "apuntes", tags: ["resaltar"], packIds: ["productividad-uni", "examenes-finales"] },
  { id: "estrella", label: "Estrella", glyph: "⭐", category: "motivacion", tags: ["importante"], packIds: ["examenes-finales", "productividad-uni"] },
  { id: "check", label: "Check", glyph: "✅", category: "productividad", tags: ["hecho", "lista"], packIds: ["productividad-uni", "examenes-finales"] },
  { id: "idea", label: "Idea", glyph: "💡", category: "estudio", tags: ["concepto", "foco"], packIds: ["productividad-uni"] },
  { id: "cerebro", label: "IA / mente", glyph: "🧠", category: "ia", tags: ["inteligencia"], packIds: ["productividad-uni"] },
  { id: "cafe", label: "Café estudio", glyph: "☕", category: "productividad", tags: ["focus"], packIds: ["productividad-uni", "examenes-finales"] },
  { id: "reloj", label: "Fecha límite", glyph: "⏰", category: "productividad", tags: ["examen", "fecha"], packIds: ["examenes-finales"] },
  { id: "corazon-kawaii", label: "Kawaii", glyph: "💖", category: "kawaii", tags: ["cute"], packIds: ["productividad-uni"] },
  { id: "tribunal", label: "Tribunal", glyph: "🏛️", category: "constitucional", tags: ["estado"], packIds: ["derecho-constitucional"] },
  { id: "maletin", label: "Corporativo", glyph: "💼", category: "corporativo", tags: ["empresa"], packIds: ["derecho-tributario"] },
  { id: "alerta", label: "Alerta legal", glyph: "⚠️", category: "derecho", tags: ["riesgo"], packIds: ["derecho-penal"] },
  { id: "dinero", label: "Tributario", glyph: "💰", category: "corporativo", tags: ["impuesto"], packIds: ["derecho-tributario"] },
  { id: "mano", label: "Firmar", glyph: "✍️", category: "apuntes", tags: ["firma"], packIds: ["derecho-civil"] },
  { id: "clip", label: "Clip", glyph: "📎", category: "apuntes", tags: ["adjunto"], packIds: ["productividad-uni"] },
  { id: "fuego", label: "Urgente", glyph: "🔥", category: "motivacion", tags: ["prioridad"], packIds: ["examenes-finales"] },
  { id: "target", label: "Meta", glyph: "🎯", category: "motivacion", tags: ["objetivo"], packIds: ["examenes-finales"] },
];

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
