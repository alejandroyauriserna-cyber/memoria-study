/** Packs visuales PNG (sin emojis en assets). */

export type StickerPackId =
  | "libros"
  | "flores"
  | "postit"
  | "estudio"
  | "juridico"
  | "documentos"
  | "tribunal";

export type PngStickerItem = {
  id: string;
  label: string;
  packId: string;
  src: string;
  tags: string[];
};

export type StickerPngPack = {
  id: StickerPackId;
  label: string;
  description: string;
  stickers: PngStickerItem[];
};

/** PNG transparentes / recortables (Open Clipart + dominio público). */
export const STICKER_PNG_PACKS: StickerPngPack[] = [
  {
    id: "libros",
    label: "Libros",
    description: "Libros, apuntes y lectura",
    stickers: [
      { id: "libros-stack", label: "Pila de libros", packId: "libros", src: "https://openclipart.org/image/800px/svg_to_png/291844/book-stack.png", tags: ["libro", "estudio", "apuntes"] },
      { id: "libros-open", label: "Libro abierto", packId: "libros", src: "https://openclipart.org/image/800px/svg_to_png/262359/open-book.png", tags: ["libro", "lectura"] },
      { id: "libros-red", label: "Libro rojo", packId: "libros", src: "https://openclipart.org/image/800px/svg_to_png/189295/red-book.png", tags: ["libro", "vintage"] },
      { id: "libros-law", label: "Código", packId: "libros", src: "https://openclipart.org/image/800px/svg_to_png/304447/law-book.png", tags: ["derecho", "código"] },
    ],
  },
  {
    id: "flores",
    label: "Flores",
    description: "Flores suaves para decorar",
    stickers: [
      { id: "flor-rosa", label: "Rosa", packId: "flores", src: "https://openclipart.org/image/800px/svg_to_png/281923/pink-rose.png", tags: ["flor", "beige", "rosa"] },
      { id: "flor-sakura", label: "Sakura", packId: "flores", src: "https://openclipart.org/image/800px/svg_to_png/193837/cherry-blossom.png", tags: ["flor", "primavera"] },
      { id: "flor-tulip", label: "Tulipán", packId: "flores", src: "https://openclipart.org/image/800px/svg_to_png/262361/tulip.png", tags: ["flor"] },
      { id: "flor-ramo", label: "Ramo", packId: "flores", src: "https://openclipart.org/image/800px/svg_to_png/193838/flower-bouquet.png", tags: ["flor", "ramo"] },
    ],
  },
  {
    id: "postit",
    label: "Post-it",
    description: "Notas adhesivas",
    stickers: [
      { id: "postit-yellow", label: "Post-it amarillo", packId: "postit", src: "https://openclipart.org/image/800px/svg_to_png/281924/sticky-note.png", tags: ["post-it", "nota"] },
      { id: "postit-pink", label: "Post-it rosa", packId: "postit", src: "https://openclipart.org/image/800px/svg_to_png/281925/pink-sticky-note.png", tags: ["post-it"] },
      { id: "postit-pin", label: "Nota con pin", packId: "postit", src: "https://openclipart.org/image/800px/svg_to_png/189296/note-pin.png", tags: ["post-it", "recordatorio"] },
    ],
  },
  {
    id: "estudio",
    label: "Estudio",
    description: "Universidad y productividad",
    stickers: [
      { id: "estudio-laptop", label: "Laptop", packId: "estudio", src: "https://openclipart.org/image/800px/svg_to_png/281926/laptop.png", tags: ["estudio", "universidad"] },
      { id: "estudio-cafe", label: "Café", packId: "estudio", src: "https://openclipart.org/image/800px/svg_to_png/262362/coffee-cup.png", tags: ["café", "estudio"] },
      { id: "estudio-lamp", label: "Lámpara", packId: "estudio", src: "https://openclipart.org/image/800px/svg_to_png/193839/desk-lamp.png", tags: ["escritorio", "noche"] },
      { id: "estudio-pencil", label: "Lápiz", packId: "estudio", src: "https://openclipart.org/image/800px/svg_to_png/189297/pencil.png", tags: ["apuntes", "escribir"] },
    ],
  },
  {
    id: "juridico",
    label: "Jurídico",
    description: "Derecho y justicia",
    stickers: [
      { id: "juridico-balanza", label: "Balanza", packId: "juridico", src: "https://openclipart.org/image/800px/svg_to_png/304448/justice-scale.png", tags: ["balanza", "justicia", "derecho"] },
      { id: "juridico-martillo", label: "Martillo", packId: "juridico", src: "https://openclipart.org/image/800px/svg_to_png/281927/gavel.png", tags: ["tribunal", "juez"] },
      { id: "juridico-const", label: "Constitución", packId: "juridico", src: "https://openclipart.org/image/800px/svg_to_png/304449/constitution.png", tags: ["constitución", "ley"] },
      { id: "juridico-dorada", label: "Balanza dorada", packId: "juridico", src: "https://openclipart.org/image/800px/svg_to_png/262363/gold-scale.png", tags: ["balanza", "dorada"] },
    ],
  },
  {
    id: "documentos",
    label: "Documentos",
    description: "Expedientes y pergamino",
    stickers: [
      { id: "doc-scroll", label: "Pergamino", packId: "documentos", src: "https://openclipart.org/image/800px/svg_to_png/193840/scroll.png", tags: ["documento", "pergamino"] },
      { id: "doc-folder", label: "Carpeta", packId: "documentos", src: "https://openclipart.org/image/800px/svg_to_png/281928/folder.png", tags: ["expediente", "carpeta"] },
      { id: "doc-contract", label: "Contrato", packId: "documentos", src: "https://openclipart.org/image/800px/svg_to_png/189298/contract.png", tags: ["contrato", "firma"] },
      { id: "doc-stamp", label: "Sello", packId: "documentos", src: "https://openclipart.org/image/800px/svg_to_png/262364/stamp.png", tags: ["sello", "oficial"] },
    ],
  },
  {
    id: "tribunal",
    label: "Tribunal",
    description: "Sala, columna y justicia",
    stickers: [
      { id: "tribunal-building", label: "Tribunal", packId: "tribunal", src: "https://openclipart.org/image/800px/svg_to_png/304450/courthouse.png", tags: ["tribunal", "justicia"] },
      { id: "tribunal-column", label: "Columna", packId: "tribunal", src: "https://openclipart.org/image/800px/svg_to_png/281929/column.png", tags: ["tribunal", "clásico"] },
      { id: "tribunal-badge", label: "Insignia", packId: "tribunal", src: "https://openclipart.org/image/800px/svg_to_png/193841/badge.png", tags: ["tribunal", "escudo"] },
    ],
  },
];

export const ALL_PNG_STICKERS: PngStickerItem[] = STICKER_PNG_PACKS.flatMap((p) => p.stickers);

export function searchPngStickers(query: string): PngStickerItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_PNG_STICKERS;
  return ALL_PNG_STICKERS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.tags.some((t) => t.includes(q)) ||
      s.id.includes(q) ||
      s.packId.includes(q),
  );
}

export function getPngStickerById(id: string): PngStickerItem | undefined {
  return ALL_PNG_STICKERS.find((s) => s.id === id);
}
