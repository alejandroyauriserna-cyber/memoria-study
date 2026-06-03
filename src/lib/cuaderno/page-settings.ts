import type { CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";

export type CuadernoPageMargin = "narrow" | "normal" | "wide";

export type CuadernoPageSettings = {
  paperTone: CuadernoPaperTone;
  marginMode: CuadernoPageMargin;
  favorite: boolean;
};

export const DEFAULT_PAGE_SETTINGS: CuadernoPageSettings = {
  paperTone: "ivory",
  marginMode: "normal",
  favorite: false,
};
