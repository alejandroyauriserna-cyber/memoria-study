import type { CuadernoTemplateId } from "@/lib/cuaderno/templates";

const META_RE = /^<!--cuaderno:([\s\S]*?)-->\n?/;

export type SheetCoverMeta = {
  icon: string;
  keyword: string;
  tint: string;
};

export type CuadernoNoteMeta = {
  templateId: CuadernoTemplateId;
  sheetCover?: SheetCoverMeta;
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
  const { body } = parseNoteContent(notes);
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 280));
}
