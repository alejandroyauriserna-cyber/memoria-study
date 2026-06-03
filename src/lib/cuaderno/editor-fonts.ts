export type CuadernoFontId =
  | "eb-garamond"
  | "merriweather"
  | "georgia"
  | "inter"
  | "sf-pro"
  | "times";

export const CUADERNO_FONTS: Array<{
  id: CuadernoFontId;
  label: string;
  stack: string;
  google?: string;
}> = [
  {
    id: "eb-garamond",
    label: "EB Garamond",
    stack: '"EB Garamond", Georgia, "Times New Roman", serif',
    google: "EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400",
  },
  {
    id: "merriweather",
    label: "Merriweather",
    stack: "Merriweather, Georgia, serif",
    google: "Merriweather:ital,wght@0,400;0,700;1,400",
  },
  {
    id: "georgia",
    label: "Georgia",
    stack: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "inter",
    label: "Inter",
    stack: 'Inter, system-ui, -apple-system, sans-serif',
    google: "Inter:wght@400;500;600;700",
  },
  {
    id: "sf-pro",
    label: "SF Pro",
    stack: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  },
  {
    id: "times",
    label: "Times New Roman",
    stack: '"Times New Roman", Times, serif',
  },
];

export const DEFAULT_FONT_ID: CuadernoFontId = "eb-garamond";

export function getFontStack(id: CuadernoFontId): string {
  return CUADERNO_FONTS.find((f) => f.id === id)?.stack ?? CUADERNO_FONTS[0].stack;
}

export function getGoogleFontsHref(): string {
  const families = CUADERNO_FONTS.filter((f) => f.google).map((f) => `family=${f.google}`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
