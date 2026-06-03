import type { StickerCatalogItem, StickerCategoryId } from "@/lib/cuaderno/sticker-catalog";

const CATEGORY_PALETTE: Record<
  StickerCategoryId,
  { bg: string; ring: string; accent: string }
> = {
  derecho: { bg: "#eef2ff", ring: "#6366f1", accent: "#4338ca" },
  estudio: { bg: "#ecfdf5", ring: "#10b981", accent: "#047857" },
  ia: { bg: "#f5f3ff", ring: "#8b5cf6", accent: "#6d28d9" },
  constitucional: { bg: "#fff7ed", ring: "#f97316", accent: "#c2410c" },
  legislacion: { bg: "#fefce8", ring: "#eab308", accent: "#a16207" },
  apuntes: { bg: "#fdf4ff", ring: "#d946ef", accent: "#a21caf" },
  universidad: { bg: "#eff6ff", ring: "#3b82f6", accent: "#1d4ed8" },
  productividad: { bg: "#f0fdfa", ring: "#14b8a6", accent: "#0f766e" },
  motivacion: { bg: "#fff1f2", ring: "#f43f5e", accent: "#be123c" },
  kawaii: { bg: "#fdf2f8", ring: "#ec4899", accent: "#db2777" },
  procesal: { bg: "#f8fafc", ring: "#64748b", accent: "#334155" },
  corporativo: { bg: "#f1f5f9", ring: "#475569", accent: "#1e293b" },
};

const svgCache = new Map<string, string>();

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** SVG premium con glyph centrado — usable como src en <img> y exportación de packs */
export function buildStickerSvg(item: Pick<StickerCatalogItem, "id" | "glyph" | "category" | "label">): string {
  const palette = CATEGORY_PALETTE[item.category] ?? CATEGORY_PALETTE.derecho;
  const glyph = escapeXml(item.glyph);
  const title = escapeXml(item.label);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${title}">
  <defs>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.12"/>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="29" fill="${palette.bg}" stroke="${palette.ring}" stroke-width="2" filter="url(#sh)"/>
  <circle cx="32" cy="32" r="24" fill="none" stroke="${palette.accent}" stroke-width="1" stroke-opacity="0.25"/>
  <text x="32" y="40" text-anchor="middle" font-size="28" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${glyph}</text>
</svg>`;
}

export function getStickerSvgDataUrl(item: Pick<StickerCatalogItem, "id" | "glyph" | "category" | "label">): string {
  const cached = svgCache.get(item.id);
  if (cached) return cached;
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildStickerSvg(item))}`;
  svgCache.set(item.id, url);
  return url;
}

export function getStickerPublicPath(id: string): string {
  return `/cuaderno/stickers/${id}.svg`;
}
