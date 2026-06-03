import { parseNoteContent, serializeNoteContent, type CuadernoNoteMeta, type SheetCoverMeta } from "@/lib/cuaderno/note-meta";
import type { CuadernoPaperTone } from "@/lib/cuaderno/editor-preferences";
import {
  DEFAULT_PAGE_SETTINGS,
  type CuadernoPageMargin,
  type CuadernoPageSettings,
} from "@/lib/cuaderno/page-settings";
import type { CuadernoTemplateId } from "@/lib/cuaderno/templates";
import type { CuadernoPageSizeMode } from "@/lib/cuaderno/page-size";
import type { InkStroke } from "@/lib/cuaderno/ink-layer";
import { duplicateDecoration, type DecorationObject } from "@/lib/cuaderno/decoration-objects";

export type CuadernoPage = {
  id: string;
  title: string;
  templateId: CuadernoTemplateId;
  body: string;
  cover?: SheetCoverMeta;
  paperTone: CuadernoPaperTone;
  marginMode: CuadernoPageMargin;
  pageSizeMode: CuadernoPageSizeMode;
  favorite: boolean;
  inkStrokes: InkStroke[];
  decorations: DecorationObject[];
};

export type CuadernoDocument = {
  meta: CuadernoNoteMeta;
  pages: CuadernoPage[];
  activePageId: string;
};

function newPageId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function hydratePage(
  partial: {
    id: string;
    title?: string;
    templateId?: CuadernoTemplateId;
    body?: string;
    cover?: SheetCoverMeta;
    paperTone?: CuadernoPaperTone;
    marginMode?: CuadernoPageMargin;
    pageSizeMode?: CuadernoPageSizeMode;
    favorite?: boolean;
    inkStrokes?: InkStroke[];
    decorations?: DecorationObject[];
  },
  fallbackTemplate: CuadernoTemplateId,
): CuadernoPage {
  return {
    id: partial.id,
    title: partial.title ?? "Página",
    templateId: partial.templateId ?? fallbackTemplate,
    body: partial.body ?? "<p></p>",
    cover: partial.cover,
    paperTone: partial.paperTone ?? DEFAULT_PAGE_SETTINGS.paperTone,
    marginMode: partial.marginMode ?? DEFAULT_PAGE_SETTINGS.marginMode,
    pageSizeMode: partial.pageSizeMode ?? DEFAULT_PAGE_SETTINGS.pageSizeMode,
    favorite: partial.favorite ?? false,
    inkStrokes: partial.inkStrokes ?? [],
    decorations: partial.decorations ?? [],
  };
}

export function createPage(
  templateId: CuadernoTemplateId,
  body = "<p></p>",
  title?: string,
  settings?: Partial<CuadernoPageSettings>,
): CuadernoPage {
  return {
    id: newPageId(),
    title: title ?? "Página",
    templateId,
    body,
    paperTone: settings?.paperTone ?? DEFAULT_PAGE_SETTINGS.paperTone,
    marginMode: settings?.marginMode ?? DEFAULT_PAGE_SETTINGS.marginMode,
    pageSizeMode: settings?.pageSizeMode ?? DEFAULT_PAGE_SETTINGS.pageSizeMode,
    favorite: settings?.favorite ?? false,
    inkStrokes: settings?.inkStrokes ?? [],
    decorations: settings?.decorations ?? [],
  };
}

export function parseCuadernoDocument(raw: string): CuadernoDocument {
  const { meta, body } = parseNoteContent(raw);
  if (meta.pages?.length) {
    const activeId = meta.activePageId ?? meta.pages[0].id;
    const pages = meta.pages.map((p) =>
      hydratePage(
        {
          ...p,
          body: p.id === activeId ? body : p.body,
        },
        meta.templateId,
      ),
    );
    const active = pages.find((p) => p.id === activeId) ?? pages[0];
    if (active && (!active.body || active.body === "<p></p>")) active.body = body || "<p></p>";
    return {
      meta: { ...meta, templateId: active.templateId },
      pages,
      activePageId: active.id,
    };
  }

  const single = createPage(meta.templateId, body || "<p></p>", "Página 1");
  single.cover = meta.sheetCover;
  return {
    meta,
    pages: [single],
    activePageId: single.id,
  };
}

export function serializeCuadernoDocument(doc: CuadernoDocument): string {
  const active = doc.pages.find((p) => p.id === doc.activePageId) ?? doc.pages[0];
  const meta: CuadernoNoteMeta = {
    ...doc.meta,
    templateId: active.templateId,
    sheetCover: active.cover ?? doc.meta.sheetCover,
    pages: doc.pages.map((p) => ({
      id: p.id,
      title: p.title,
      templateId: p.templateId,
      body: p.id === active.id ? active.body : p.body,
      cover: p.cover,
      paperTone: p.paperTone,
      marginMode: p.marginMode,
      pageSizeMode: p.pageSizeMode,
      favorite: p.favorite,
      inkStrokes: p.inkStrokes,
      decorations: p.decorations,
    })),
    activePageId: active.id,
  };
  return serializeNoteContent(meta, active.body);
}

export function getActivePage(doc: CuadernoDocument): CuadernoPage {
  return doc.pages.find((p) => p.id === doc.activePageId) ?? doc.pages[0];
}

export function setActivePageBody(doc: CuadernoDocument, html: string): CuadernoDocument {
  return {
    ...doc,
    pages: doc.pages.map((p) => (p.id === doc.activePageId ? { ...p, body: html } : p)),
  };
}

export function setActivePageInk(doc: CuadernoDocument, inkStrokes: InkStroke[]): CuadernoDocument {
  return {
    ...doc,
    pages: doc.pages.map((p) => (p.id === doc.activePageId ? { ...p, inkStrokes } : p)),
  };
}

export function setActivePageDecorations(
  doc: CuadernoDocument,
  decorations: DecorationObject[],
): CuadernoDocument {
  return {
    ...doc,
    pages: doc.pages.map((p) => (p.id === doc.activePageId ? { ...p, decorations } : p)),
  };
}

export function updatePage(
  doc: CuadernoDocument,
  pageId: string,
  patch: Partial<Omit<CuadernoPage, "id">>,
): CuadernoDocument {
  return {
    ...doc,
    pages: doc.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)),
    meta:
      pageId === doc.activePageId && patch.templateId
        ? { ...doc.meta, templateId: patch.templateId }
        : doc.meta,
  };
}

export function setActivePageTemplate(doc: CuadernoDocument, templateId: CuadernoTemplateId): CuadernoDocument {
  return updatePage(doc, doc.activePageId, { templateId });
}

export function switchActivePage(doc: CuadernoDocument, pageId: string): CuadernoDocument {
  const page = doc.pages.find((p) => p.id === pageId);
  if (!page) return doc;
  return { ...doc, activePageId: pageId, meta: { ...doc.meta, templateId: page.templateId } };
}

export function addPage(doc: CuadernoDocument, templateId: CuadernoTemplateId, body = "<p></p>"): CuadernoDocument {
  const page = createPage(templateId, body, `Página ${doc.pages.length + 1}`);
  return { ...doc, pages: [...doc.pages, page], activePageId: page.id };
}

export function duplicatePage(doc: CuadernoDocument, pageId: string): CuadernoDocument {
  const source = doc.pages.find((p) => p.id === pageId);
  if (!source) return doc;
  const copy = createPage(source.templateId, source.body, `${source.title} (copia)`, {
    paperTone: source.paperTone,
    marginMode: source.marginMode,
    pageSizeMode: source.pageSizeMode,
    inkStrokes: [...source.inkStrokes],
    decorations: source.decorations.map((d) => duplicateDecoration(d)),
    favorite: false,
  });
  copy.cover = source.cover;
  const idx = doc.pages.findIndex((p) => p.id === pageId);
  const pages = [...doc.pages];
  pages.splice(idx + 1, 0, copy);
  return { ...doc, pages, activePageId: copy.id };
}

export function removePage(doc: CuadernoDocument, pageId: string): CuadernoDocument {
  if (doc.pages.length <= 1) return doc;
  const pages = doc.pages.filter((p) => p.id !== pageId);
  const activePageId = doc.activePageId === pageId ? pages[0].id : doc.activePageId;
  return { ...doc, pages, activePageId };
}

export function movePage(doc: CuadernoDocument, pageId: string, direction: "up" | "down"): CuadernoDocument {
  const idx = doc.pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return doc;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= doc.pages.length) return doc;
  const pages = [...doc.pages];
  [pages[idx], pages[target]] = [pages[target], pages[idx]];
  return { ...doc, pages };
}

export function updatePageCover(
  doc: CuadernoDocument,
  pageId: string,
  cover: SheetCoverMeta,
): CuadernoDocument {
  return updatePage(doc, pageId, { cover });
}

export function togglePageFavorite(doc: CuadernoDocument, pageId: string): CuadernoDocument {
  const page = doc.pages.find((p) => p.id === pageId);
  if (!page) return doc;
  return updatePage(doc, pageId, { favorite: !page.favorite });
}
