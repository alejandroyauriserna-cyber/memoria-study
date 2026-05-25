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

    pdfParser.on(
      "pdfParser_dataError",
      (errData: any) => {
        reject(
          errData?.parserError ??
            new Error("Error leyendo el PDF."),
        );
      },
    );

    pdfParser.on(
      "pdfParser_dataReady",
      () => {
        try {
          const rawText =
            pdfParser.getRawTextContent();

          resolve(rawText ?? "");
        } catch (error) {
          reject(error);
        }
      },
    );

    pdfParser.parseBuffer(buffer);
  });

  const cleanText = text
    .replace(/\s+/g, " ")
    .trim();

  if (
    !cleanText ||
    cleanText.length < 50
  ) {
    throw new Error(
      "El PDF parece estar escaneado o no contiene texto seleccionable.",
    );
  }

  return cleanText;
}