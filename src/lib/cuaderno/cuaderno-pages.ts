import { parseNoteContent, serializeNoteContent, type CuadernoNoteMeta, type SheetCoverMeta } from "@/lib/cuaderno/note-meta";
import type { CuadernoTemplateId } from "@/lib/cuaderno/templates";

export type CuadernoPage = {
  id: string;
  title: string;
  templateId: CuadernoTemplateId;
  body: string;
  cover?: SheetCoverMeta;
};

export type CuadernoDocument = {
  meta: CuadernoNoteMeta;
  pages: CuadernoPage[];
  activePageId: string;
};

function newPageId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createPage(
  templateId: CuadernoTemplateId,
  body = "<p></p>",
  title?: string,
): CuadernoPage {
  return {
    id: newPageId(),
    title: title ?? "Página",
    templateId,
    body,
  };
}

export function parseCuadernoDocument(raw: string): CuadernoDocument {
  const { meta, body } = parseNoteContent(raw);
  if (meta.pages?.length) {
    const activeId = meta.activePageId ?? meta.pages[0].id;
    const pages = meta.pages.map((p) => ({
      id: p.id,
      title: p.title ?? "Página",
      templateId: (p.templateId ?? meta.templateId) as CuadernoTemplateId,
      body: p.id === activeId ? body : (p.body ?? "<p></p>"),
      cover: p.cover,
    }));
    const active = pages.find((p) => p.id === activeId) ?? pages[0];
    if (active && !active.body) active.body = body;
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

export function setActivePageTemplate(doc: CuadernoDocument, templateId: CuadernoTemplateId): CuadernoDocument {
  return {
    ...doc,
    meta: { ...doc.meta, templateId },
    pages: doc.pages.map((p) => (p.id === doc.activePageId ? { ...p, templateId } : p)),
  };
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
  const copy = createPage(source.templateId, source.body, `${source.title} (copia)`);
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
  return {
    ...doc,
    pages: doc.pages.map((p) => (p.id === pageId ? { ...p, cover } : p)),
  };
}
