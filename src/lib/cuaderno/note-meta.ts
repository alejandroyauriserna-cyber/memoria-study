import type { CuadernoTemplateId } from "@/lib/cuaderno/templates";
import type { CuadernoPageMargin, CuadernoWritingLayout } from "@/lib/cuaderno/page-settings";
import type { CuadernoPageSizeMode } from "@/lib/cuaderno/page-size";
import type { InkStroke } from "@/lib/cuaderno/ink-layer";
import type { DecorationObject } from "@/lib/cuaderno/decoration-objects";
import type { CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";
import { wordCountFromNotes } from "@/lib/cuaderno/rich-text";

const META_RE = /^<!--cuaderno:([\s\S]*?)-->\n?/;

export type SheetCoverMeta = {
  icon: string;
  keyword: string;
  tint: string;
  emoji?: string;
  imageUrl?: string;
};

export type CuadernoPageMeta = {
  id: string;
  title?: string;
  templateId?: CuadernoTemplateId;
  body?: string;
  cover?: SheetCoverMeta;
  paperTone?: CuadernoPaperTone;
  marginMode?: CuadernoPageMargin;
  pageSizeMode?: CuadernoPageSizeMode;
  writingLayout?: CuadernoWritingLayout;
  favorite?: boolean;
  inkStrokes?: InkStroke[];
  decorations?: DecorationObject[];
};

export type CuadernoNoteMeta = {
  templateId: CuadernoTemplateId;
  sheetCover?: SheetCoverMeta;
  pages?: CuadernoPageMeta[];
  activePageId?: string;
};

export function parseNoteContent(raw: string): { meta: CuadernoNoteMeta; body: string } {
  const match = raw.match(META_RE);
  if (!match) {
    return { meta: { templateId: "blank" }, body: raw };
  }

  try {
    const parsed = JSON.parse(match[1]) as Partial<CuadernoNoteMeta>;
    return {
      meta: {
        templateId: parsed.templateId ?? "blank",
        sheetCover: parsed.sheetCover,
        pages: parsed.pages,
        activePageId: parsed.activePageId,
      },
      body: raw.slice(match[0].length),
    };
  } catch {
    return { meta: { templateId: "blank" }, body: raw };
  }
}

export function serializeNoteContent(meta: CuadernoNoteMeta, body: string): string {
  return `<!--cuaderno:${JSON.stringify(meta)}-->\n${body}`;
}

export function estimatePageCount(notes: string): number {
  const words = wordCountFromNotes(notes);
  return Math.max(1, Math.ceil(words / 280));
}
