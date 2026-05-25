import { PDFDocument } from "pdf-lib";

export async function splitPdfIntoPageChunks(
  buffer: Buffer,
  pagesPerChunk = 4,
) {
  const source = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = source.getPageCount();

  if (totalPages === 0) {
    throw new Error("El PDF no tiene páginas legibles.");
  }

  const chunks: Buffer[] = [];

  for (let start = 0; start < totalPages; start += pagesPerChunk) {
    const chunkDoc = await PDFDocument.create();
    const end = Math.min(start + pagesPerChunk, totalPages);
    const pageIndexes = Array.from(
      { length: end - start },
      (_, index) => start + index,
    );
    const copied = await chunkDoc.copyPages(source, pageIndexes);
    copied.forEach((page) => chunkDoc.addPage(page));
    const bytes = await chunkDoc.save();
    chunks.push(Buffer.from(bytes));
  }

  return { chunks, totalPages };
}
