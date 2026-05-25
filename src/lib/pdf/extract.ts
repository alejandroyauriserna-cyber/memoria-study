import PDFParser from "pdf2json";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function extractPdfText(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDFs hasta 100 MB.");
  }

  const arrayBuffer = await file.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);

  const text = await new Promise<string>((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", () => {
      const rawText = pdfParser.getRawTextContent();

      resolve(rawText);
    });

    pdfParser.parseBuffer(buffer);
  });

  const cleanText = text.trim();

  if (!cleanText) {
    throw new Error("No se pudo extraer texto del PDF.");
  }

  return cleanText;
}