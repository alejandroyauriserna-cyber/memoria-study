import pdf from "pdf-parse";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function extractPdfText(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDFs hasta 100 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  const data = await pdf(buffer);

  const text = data.text?.trim();

  if (!text) {
    throw new Error("No se pudo extraer texto del PDF.");
  }

  return text;
}