import PDFParser from "pdf2json";

const MAX_FILE_SIZE =
  100 * 1024 * 1024;

async function extractWithPdf2Json(
  buffer: Buffer,
) {
  const text =
    await new Promise<string>(
      (
        resolve,
        reject,
      ) => {
        const pdfParser =
          new PDFParser();

        pdfParser.on(
          "pdfParser_dataError",
          (
            errData: any,
          ) => {
            reject(
              errData?.parserError ??
                new Error(
                  "Error leyendo PDF.",
                ),
            );
          },
        );

        pdfParser.on(
          "pdfParser_dataReady",
          () => {
            try {
              const rawText =
                pdfParser.getRawTextContent();

              resolve(
                rawText ?? "",
              );
            } catch (
              error
            ) {
              reject(
                error,
              );
            }
          },
        );

        pdfParser.parseBuffer(
          buffer,
        );
      },
    );

  return text
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

async function extractWithOCR(
  buffer: Buffer,
) {
  const {
    createWorker,
  } = await import(
    "tesseract.js"
  );

  const worker =
    await createWorker();

  // TU VERSION usa initialize
  await worker.initialize(
    "spa",
  );

  const {
    data: { text },
  } = await worker.recognize(
    buffer,
  );

  await worker.terminate();

  return text
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

export async function extractPdfText(
  file: File,
) {
  if (
    file.size >
    MAX_FILE_SIZE
  ) {
    throw new Error(
      "PDFs hasta 100 MB.",
    );
  }

  const arrayBuffer =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer,
    );

  // intento normal
  try {
    const cleanText =
      await extractWithPdf2Json(
        buffer,
      );

    if (
      cleanText &&
      cleanText.length >
        100
    ) {
      return cleanText;
    }
  } catch (error) {
    console.warn(
      "pdf2json fallo:",
      error,
    );
  }

  // OCR fallback
  console.warn(
    "Usando OCR fallback...",
  );

  const ocrText =
    await extractWithOCR(
      buffer,
    );

  if (
    !ocrText ||
    ocrText.length < 50
  ) {
    throw new Error(
      "No se pudo extraer texto útil del PDF.",
    );
  }

  return ocrText;
}