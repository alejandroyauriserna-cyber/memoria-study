import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function extractPdfText(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDFs hasta 100 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  let text = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);

    const content = await page.getTextContent();

    const strings = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");

    text += strings + "\n";
  }

  const cleanText = text.trim();

  if (!cleanText) {
    throw new Error("No se pudo extraer texto del PDF.");
  }

  return cleanText;
}