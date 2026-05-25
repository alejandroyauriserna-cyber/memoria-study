import PDFParser, { type Output } from "pdf2json";
import { env } from "@/lib/env";
import { extractTextWithGeminiOcr } from "@/lib/pdf/gemini-ocr";
import { isLowQualityExtractedText } from "@/lib/pdf/text-quality";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MIN_USEFUL_TEXT_LENGTH = 50;

type PdfParserError = { parserError: Error } | Error;

export type PdfExtractionOptions = {
  forceScanned?: boolean;
};

export type PdfExtractionMeta = {
  method: "pdf2json" | "pdf-parse" | "gemini-ocr";
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function decodeTextRun(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function textFromPages(pdfData: Output) {
  const parts: string[] = [];

  for (const page of pdfData.Pages ?? []) {
    for (const item of page.Texts ?? []) {
      for (const run of item.R ?? []) {
        if (run.T) {
          parts.push(decodeTextRun(run.T));
        }
      }
    }
  }

  return normalizeText(parts.join(" "));
}

async function extractWithPdf2Json(buffer: Buffer) {
  const pdfParser = new PDFParser(null, true);

  const result = await new Promise<{ rawText: string; pdfData: Output }>(
    (resolve, reject) => {
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

      pdfParser.on("pdfParser_dataReady", (pdfData: Output) => {
        try {
          resolve({
            rawText: normalizeText(pdfParser.getRawTextContent() ?? ""),
            pdfData,
          });
        } catch (error) {
          reject(error);
        }
      });

      pdfParser.parseBuffer(buffer);
    },
  );

  const pageText = textFromPages(result.pdfData);
  return pageText.length > result.rawText.length ? pageText : result.rawText;
}

async function extractWithPdfParse(buffer: Buffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const result = await pdfParse(buffer);
  return normalizeText(result.text ?? "");
}

export async function extractPdfText(
  file: File,
  options: PdfExtractionOptions = {},
) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("PDFs hasta 100 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (options.forceScanned) {
    if (!env.geminiApiKey) {
      throw new Error(
        "Marcaste PDF escaneado pero falta GEMINI_API_KEY en .env.local.",
      );
    }
    const ocrText = await extractTextWithGeminiOcr(buffer, file.name);
    return { text: ocrText, method: "gemini-ocr" as const };
  }

  const attempts: string[] = [];

  try {
    const pdf2jsonText = await extractWithPdf2Json(buffer);
    if (
      pdf2jsonText.length >= MIN_USEFUL_TEXT_LENGTH &&
      !isLowQualityExtractedText(pdf2jsonText)
    ) {
      return { text: pdf2jsonText, method: "pdf2json" as const };
    }
    if (pdf2jsonText) {
      attempts.push(pdf2jsonText);
    }
  } catch (error) {
    console.warn("pdf2json fallo:", error);
  }

  try {
    const pdfParseText = await extractWithPdfParse(buffer);
    if (
      pdfParseText.length >= MIN_USEFUL_TEXT_LENGTH &&
      !isLowQualityExtractedText(pdfParseText)
    ) {
      return { text: pdfParseText, method: "pdf-parse" as const };
    }
    if (pdfParseText) {
      attempts.push(pdfParseText);
    }
  } catch (error) {
    console.warn("pdf-parse fallo:", error);
  }

  const bestAttempt = attempts.sort((a, b) => b.length - a.length)[0];
  if (
    bestAttempt &&
    bestAttempt.length >= MIN_USEFUL_TEXT_LENGTH &&
    !isLowQualityExtractedText(bestAttempt)
  ) {
    return { text: bestAttempt, method: "pdf-parse" as const };
  }

  if (env.geminiApiKey) {
    console.warn("Aplicando OCR con Gemini (PDF escaneado o texto pobre)...");
    const ocrText = await extractTextWithGeminiOcr(buffer, file.name);
    return { text: ocrText, method: "gemini-ocr" as const };
  }

  throw new Error(
    "No se pudo extraer texto del PDF. Marca «PDF escaneado» o configura GEMINI_API_KEY.",
  );
}
