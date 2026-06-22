import PDFParser, { type Output } from "pdf2json";
import { PDFDocument } from "pdf-lib";
import { cleanPageTextForStudy, scorePageTextQuality } from "@/lib/guided-study/prepare-study-page-text";
import type { PdfPageContent } from "@/types/guided-legal-study";

type PdfParserError = { parserError: Error } | Error;

type PdfTextItem = NonNullable<Output["Pages"][number]["Texts"]>[number] & {
  x?: number;
  y?: number;
};

function decodeTextRun(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function textFromSinglePage(page: Output["Pages"][number]) {
  const items = [...(page.Texts ?? [])] as PdfTextItem[];

  const joinItems = (sortedItems: PdfTextItem[], skipFooter = false) => {
    const pageHeight = (page as { Height?: number }).Height ?? 0;
    const footerCutoff = pageHeight > 0 ? pageHeight * 0.12 : 0;
    const parts: string[] = [];

    for (const item of sortedItems) {
      if (skipFooter && footerCutoff > 0 && (item.y ?? pageHeight) < footerCutoff) {
        continue;
      }

      for (const run of item.R ?? []) {
        if (run.T) {
          parts.push(decodeTextRun(run.T));
        }
      }
    }

    return normalizeText(parts.join(" "));
  };

  const byPosition = [...items].sort((a, b) => {
    const yDiff = (b.y ?? 0) - (a.y ?? 0);
    if (Math.abs(yDiff) > 0.35) return yDiff;
    return (a.x ?? 0) - (b.x ?? 0);
  });

  const byPositionAsc = [...items].sort((a, b) => {
    const yDiff = (a.y ?? 0) - (b.y ?? 0);
    if (Math.abs(yDiff) > 0.35) return yDiff;
    return (a.x ?? 0) - (b.x ?? 0);
  });

  const candidates = [
    joinItems(byPosition, true),
    joinItems(byPositionAsc, true),
    joinItems(items, false),
  ];

  let best = candidates[0] ?? "";
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = scorePageTextQuality(cleanPageTextForStudy(candidate));
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

async function extractPagesWithPdf2Json(buffer: Buffer): Promise<PdfPageContent[]> {
  const pdfParser = new PDFParser(null, true);

  const pdfData = await new Promise<Output>((resolve, reject) => {
    pdfParser.on("pdfParser_dataError", (errData: PdfParserError) => {
      const error =
        typeof errData === "object" &&
        errData !== null &&
        "parserError" in errData &&
        errData.parserError instanceof Error
          ? errData.parserError
          : errData instanceof Error
            ? errData
            : new Error("Error leyendo PDF.");
      reject(error);
    });

    pdfParser.on("pdfParser_dataReady", (data: Output) => resolve(data));
    pdfParser.parseBuffer(buffer);
  });

  const pages = pdfData.Pages ?? [];

  return pages.map((page, index) => ({
    pageNumber: index + 1,
    text: textFromSinglePage(page),
  }));
}

function splitTextIntoPages(fullText: string, totalPages: number): PdfPageContent[] {
  const normalized = fullText.trim();
  if (!normalized || totalPages <= 0) {
    return [];
  }

  const charsPerPage = Math.ceil(normalized.length / totalPages);
  const pages: PdfPageContent[] = [];

  for (let i = 0; i < totalPages; i++) {
    const start = i * charsPerPage;
    const end = Math.min(start + charsPerPage, normalized.length);
    pages.push({
      pageNumber: i + 1,
      text: normalizeText(normalized.slice(start, end)),
    });
  }

  return pages;
}

export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  const source = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return source.getPageCount();
}

export async function extractPdfPagesFromBuffer(
  buffer: Buffer,
  fallbackFullText?: string,
): Promise<PdfPageContent[]> {
  try {
    const pages = await extractPagesWithPdf2Json(buffer);
    const withText = pages.filter((p) => p.text.length >= 20);

    if (withText.length >= Math.max(1, pages.length * 0.5)) {
      return pages;
    }
  } catch {
    // fallback below
  }

  const totalPages = await getPdfPageCount(buffer);
  if (fallbackFullText?.trim()) {
    return splitTextIntoPages(fallbackFullText, totalPages);
  }

  return Array.from({ length: totalPages }, (_, i) => ({
    pageNumber: i + 1,
    text: "",
  }));
}

export function getPageText(pages: PdfPageContent[], pageNumber: number, maxChars = 12_000): string {
  const byIndex = pages[pageNumber - 1];
  const page =
    byIndex && byIndex.text.trim()
      ? byIndex
      : pages.find((entry) => entry.pageNumber === pageNumber);
  const text = cleanPageTextForStudy(page?.text ?? "");
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[... texto de la página truncado ...]`;
}

export function getChapterText(
  pages: PdfPageContent[],
  startPage: number,
  endPage: number,
  maxChars = 14_000,
): string {
  const chunks: string[] = [];
  let total = 0;

  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
    const text = getPageText(pages, pageNumber);
    const chunk = `--- Página ${pageNumber} ---\n${text || "(sin texto extraíble)"}`;
    if (total + chunk.length > maxChars) {
      chunks.push(`--- (texto del capítulo truncado por límite) ---`);
      break;
    }
    chunks.push(chunk);
    total += chunk.length;
  }

  return chunks.join("\n\n");
}
