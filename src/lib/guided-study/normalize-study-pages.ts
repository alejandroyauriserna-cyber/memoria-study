import type { PdfPageContent } from "@/types/guided-legal-study";

/** Alinea diapositivas/PDF con la navegación 1..n del estudio guiado y el tutor. */
export function normalizeStudyPages(pages: PdfPageContent[]): PdfPageContent[] {
  return pages
    .filter((page) => page.text.trim().length > 0)
    .map((page, index) => ({
      pageNumber: index + 1,
      text: page.text.trim(),
    }));
}

export function isSequentialStudyPages(pages: PdfPageContent[]): boolean {
  if (!pages.length) return false;
  return pages.every((page, index) => page.pageNumber === index + 1);
}
