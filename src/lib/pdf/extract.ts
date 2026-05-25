import * as pdfjsLib from "pdfjs-dist";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractPdfText(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDFs hasta 100 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  let text = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);

    const content = await page.getTextContent();

    const strings = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    text += strings + "\n";
  }

  const cleaned = text.trim();

  if (!cleaned) {
    throw new Error("No se pudo extraer texto del PDF.");
  }

  return cleaned;
}