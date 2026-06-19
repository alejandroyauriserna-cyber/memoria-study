import { ocrPdfSlideChunkWithGemini } from "@/lib/pdf/gemini-ocr";
import { splitPdfIntoPageChunks } from "@/lib/pdf/split-pdf";
import type { PdfPageContent } from "@/types/guided-legal-study";

const MAX_SLIDE_OCR_PAGES = 40;

export async function extractPdfPagesWithPerPageOcr(
  buffer: Buffer,
  fileName: string,
): Promise<PdfPageContent[]> {
  const { chunks, totalPages } = await splitPdfIntoPageChunks(buffer, 1);
  const pageLimit = Math.min(chunks.length, MAX_SLIDE_OCR_PAGES);
  const pages: PdfPageContent[] = [];

  for (let index = 0; index < pageLimit; index += 1) {
    const pageNumber = index + 1;
    const text = await ocrPdfSlideChunkWithGemini(
      chunks[index],
      `${fileName} · diapositiva ${pageNumber}/${totalPages}`,
    );

    pages.push({
      pageNumber,
      text: text.trim(),
    });
  }

  if (totalPages > pageLimit) {
    for (let pageNumber = pageLimit + 1; pageNumber <= totalPages; pageNumber += 1) {
      pages.push({ pageNumber, text: "" });
    }
  }

  return pages;
}
