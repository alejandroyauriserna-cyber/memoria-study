import { getChapterText, getPageText } from "@/lib/guided-study/extract-pages";
import {
  cleanPageTextForStudy,
  hasSubstantiveStudyText,
} from "@/lib/guided-study/prepare-study-page-text";
import type { PdfPageContent } from "@/types/guided-legal-study";

const MIN_TUTOR_TEXT = 120;

function combineDocumentText(pages: PdfPageContent[], maxChars = 14_000) {
  const parts: string[] = [];

  for (const page of pages) {
    const text = cleanPageTextForStudy(page.text);
    if (text.length < 20) continue;
    parts.push(`--- Página ${page.pageNumber} ---\n${text}`);
  }

  return parts.join("\n\n").slice(0, maxChars).trim();
}

export function resolveTutorPageText(input: {
  pages: PdfPageContent[];
  pageNumber: number;
  chapter?: { startPage: number; endPage: number };
  chapterMode?: boolean;
}) {
  const scopedText = input.chapter
    ? getChapterText(input.pages, input.chapter.startPage, input.chapter.endPage)
    : getPageText(input.pages, input.pageNumber);

  const cleanedScoped = cleanPageTextForStudy(scopedText);
  if (
    cleanedScoped.length >= MIN_TUTOR_TEXT &&
    (hasSubstantiveStudyText(cleanedScoped) || cleanedScoped.length >= 400)
  ) {
    return scopedText;
  }

  const documentText = combineDocumentText(input.pages);
  if (!documentText) {
    return scopedText;
  }

  if (input.chapterMode && input.chapter) {
    return `${scopedText}\n\n--- Contexto del documento ---\n${documentText}`.slice(0, 14_000);
  }

  return documentText;
}
