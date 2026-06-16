export type PostItColor =
  | "yellow"
  | "green"
  | "blue"
  | "pink"
  | "purple"
  | "lavender"
  | "cream";

export type ImageTextWrap = "inline" | "square" | "tight" | "inFront" | "behind";

export type ShapeVariant = "rectangle" | "circle" | "line";

export type DecorationKind =
  | "postit"
  | "sticker"
  | "image"
  | "diagram"
  | "washi"
  | "tape"
  | "divider"
  | "frame"
  | "arrow"
  | "highlight-deco"
  | "textbox"
  | "free-text"
  | "shape";

export type DecorationObject = {
  id: string;
  kind: DecorationKind;
  /** Posición normalizada 0–1 */
  x: number;
  y: number;
  /** Tamaño normalizado respecto al papel */
  w: number;
  h: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  /** Post-it */
  postitColor?: PostItColor;
  postitCategory?: string;
  text?: string;
  /** Sticker catálogo o IA / imagen flotante */
  stickerId?: string;
  src?: string;
  label?: string;
  /** Imagen flotante */
  aspectRatio?: number;
  textWrap?: ImageTextWrap;
  /** Recorte normalizado 0–1 dentro del marco */
  crop?: { x: number; y: number; w: number; h: number };
  /** Decorativos */
  decoVariant?: string;
  color?: string;
  opacity?: number;
  shapeShadow?: boolean;
};

export const POSTIT_COLORS: Record<PostItColor, { label: string; bg: string; border: string }> = {
  yellow: { label: "Amarillo", bg: "#fef08a", border: "#eab308" },
  green: { label: "Verde", bg: "#bbf7d0", border: "#22c55e" },
  blue: { label: "Celeste", bg: "#bfdbfe", border: "#3b82f6" },
  pink: { label: "Rosa", bg: "#fbcfe8", border: "#ec4899" },
  purple: { label: "Morado", bg: "#e9d5ff", border: "#a855f7" },
  lavender: { label: "Lavanda", bg: "#ede9fe", border: "#a78bfa" },
  cream: { label: "Crema", bg: "#faf6eb", border: "#d6c4a8" },
};

export function decorationId(): string {
  return `dec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function createPostIt(
  color: PostItColor = "yellow",
  text = "",
  category?: string,
): DecorationObject {
  return {
    id: decorationId(),
    kind: "postit",
    x: 0.12,
    y: 0.14,
    w: 0.2,
    h: 0.16,
    rotation: -2 + Math.random() * 4,
    zIndex: Date.now(),
    locked: false,
    postitColor: color,
    postitCategory: category,
    text: text || "Recordatorio…",
  };
}

export function createStickerFromCatalog(
  stickerId: string,
  src: string | undefined,
  label: string,
  at?: { x: number; y: number },
): DecorationObject {
  return createStickerFromSrc(src ?? "", label, { stickerId, at, aspectRatio: 1 });
}

export function createStickerFromAi(src: string, label: string): DecorationObject {
  return createStickerFromSrc(src, label);
}

export function createStickerFromSrc(
  src: string,
  label: string,
  opts?: { stickerId?: string; userStickerId?: string; at?: { x: number; y: number }; aspectRatio?: number },
): DecorationObject {
  const ar = opts?.aspectRatio ?? 1;
  const w = 0.14;
  return {
    id: decorationId(),
    kind: "sticker",
    x: opts?.at?.x ?? 0.4,
    y: opts?.at?.y ?? 0.35,
    w,
    h: w / ar,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    stickerId: opts?.stickerId,
    src,
    label,
    aspectRatio: ar,
  };
}

export function createStickerFromLibrary(
  userStickerId: string,
  imageUrl: string,
  name: string,
  at?: { x: number; y: number },
): DecorationObject {
  return createStickerFromSrc(imageUrl, name, {
    stickerId: `user:${userStickerId}`,
    at,
    aspectRatio: 1,
  });
}

export function createFreeText(text = "", at?: { x: number; y: number }): DecorationObject {
  return {
    id: decorationId(),
    kind: "free-text",
    x: at?.x ?? 0.15,
    y: at?.y ?? 0.12,
    w: 0.22,
    h: 0.05,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    text: text || "",
  };
}

export function createTextBox(text = "", at?: { x: number; y: number }): DecorationObject {
  return {
    id: decorationId(),
    kind: "textbox",
    x: at?.x ?? 0.2,
    y: at?.y ?? 0.18,
    w: 0.28,
    h: 0.12,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    text: text || "",
    color: "#0d9488",
  };
}

export function createShape(
  variant: ShapeVariant = "rectangle",
  color = "#0d9488",
  at?: { x: number; y: number },
): DecorationObject {
  const isLine = variant === "line";
  return {
    id: decorationId(),
    kind: "shape",
    x: at?.x ?? 0.22,
    y: at?.y ?? 0.2,
    w: isLine ? 0.3 : 0.26,
    h: isLine ? 0.02 : 0.14,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    text: "",
    color,
    decoVariant: variant,
    shapeShadow: variant !== "line",
  };
}

export function createDecoElement(
  kind: Exclude<DecorationKind, "postit" | "sticker">,
  color = "#00e5c3",
): DecorationObject {
  const base = {
    id: decorationId(),
    kind,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    color,
  };
  switch (kind) {
    case "washi":
      return { ...base, x: 0.05, y: 0.08, w: 0.9, h: 0.04, rotation: -1 };
    case "tape":
      return { ...base, x: 0.2, y: 0.05, w: 0.35, h: 0.05, rotation: -4 };
    case "divider":
      return { ...base, x: 0.1, y: 0.5, w: 0.8, h: 0.008, rotation: 0 };
    case "frame":
      return { ...base, x: 0.15, y: 0.2, w: 0.7, h: 0.5, rotation: 0 };
    case "arrow":
      return { ...base, x: 0.3, y: 0.4, w: 0.15, h: 0.08, rotation: 0 };
    case "highlight-deco":
      return { ...base, x: 0.2, y: 0.45, w: 0.5, h: 0.035, rotation: 0, color: "#fef08a" };
    default:
      return { ...base, x: 0.2, y: 0.2, w: 0.2, h: 0.1 };
  }
}

export function duplicateDecoration(obj: DecorationObject): DecorationObject {
  return {
    ...obj,
    id: decorationId(),
    x: Math.min(0.85, obj.x + 0.04),
    y: Math.min(0.85, obj.y + 0.04),
    zIndex: Date.now(),
    locked: false,
  };
}

export function sortByZIndex(items: DecorationObject[]): DecorationObject[] {
  return [...items].sort((a, b) => a.zIndex - b.zIndex);
}
