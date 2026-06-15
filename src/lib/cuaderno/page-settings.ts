import type { CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";
import type { CuadernoPageSizeMode } from "@/lib/cuaderno/page-size";
import type { InkStroke } from "@/lib/cuaderno/ink-layer";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";

export type CuadernoPageMargin = "narrow" | "normal" | "wide";

/** word = cursor arriba-izquierda (como Word); free = lienzo largo, clic en cualquier zona */
export type CuadernoWritingLayout = "word" | "free";

export type CuadernoPageSettings = {
  paperTone: CuadernoPaperTone;
  marginMode: CuadernoPageMargin;
  pageSizeMode: CuadernoPageSizeMode;
  writingLayout: CuadernoWritingLayout;
  favorite: boolean;
  inkStrokes?: InkStroke[];
  decorations?: DecorationObject[];
};

export const WRITING_LAYOUT_OPTIONS: Array<{
  id: CuadernoWritingLayout;
  label: string;
  description: string;
}> = [
  { id: "word", label: "Tipo Word", description: "Empieza arriba a la izquierda" },
  { id: "free", label: "Escribir libre", description: "Hoja larga — clic donde quieras" },
];

export const DEFAULT_PAGE_SETTINGS: CuadernoPageSettings = {
  paperTone: "ivory",
  marginMode: "normal",
  pageSizeMode: "infinite",
  writingLayout: "word",
  favorite: false,
};
