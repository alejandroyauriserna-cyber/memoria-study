import type { CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";
import { DEFAULT_PAGE_SIZE_MODE, type CuadernoPageSizeMode } from "@/lib/cuaderno/page-size";
import type { InkStroke } from "@/lib/cuaderno/ink-layer";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";

export type CuadernoPageMargin = "narrow" | "normal" | "wide";

export type CuadernoPageSettings = {
  paperTone: CuadernoPaperTone;
  marginMode: CuadernoPageMargin;
  pageSizeMode: CuadernoPageSizeMode;
  favorite: boolean;
  inkStrokes?: InkStroke[];
  decorations?: DecorationObject[];
};

export const DEFAULT_PAGE_SETTINGS: CuadernoPageSettings = {
  paperTone: "ivory",
  marginMode: "normal",
  pageSizeMode: DEFAULT_PAGE_SIZE_MODE,
  favorite: false,
};
