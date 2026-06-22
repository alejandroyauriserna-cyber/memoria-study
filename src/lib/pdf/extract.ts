import PDFParser, { type Output } from "pdf2json";
import { env } from "@/lib/env";
import {
  extractTextWithGeminiOcr,
  type OcrProgressCallback,
} from "@/lib/pdf/gemini-ocr";
import { isLowQualityExtractedText } from "@/lib/pdf/text-quality";
import { MAX_AI_INPUT_CHARS, MAX_FILE_SIZE, MAX_ORGANIZER_INPUT_CHARS } from "@/lib/pdf/constants";
import type { PdfExtractionProgress } from "@/types/pdf-progress";

export { MAX_AI_INPUT_CHARS, MAX_FILE_SIZE, MAX_ORGANIZER_INPUT_CHARS } from "@/lib/pdf/constants";

const MIN_USEFUL_TEXT_LENGTH = 50;

type PdfParserError = { parserError: Error } | Error;

export type PdfExtractionOptions = {
  forceScanned?: boolean;
  /** Evita OCR con Gemini (útil para análisis rápido de metadatos). */
  skipOcr?: boolean;
  onProgress?: OcrProgressCallback;
};

export type PdfExtractionMeta = {
  method: "pdf2json" | "pdf-parse" | "gemini-ocr";
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function extractTextWithGeminiOcrSafe(
  buffer: Buffer,
  fileName: string,
  onProgress?: OcrProgressCallback,
): Promise<string> {
  try {
    return await extractTextWithGeminiOcr(buffer, fileName, onProgress);
  } catch (error) {
    if (error instanceof Error && "partialText" in error) {
      const partialText = (error as { partialText?: string }).partialText;
      if (typeof partialText === "string" && partialText.length >= MIN_USEFUL_TEXT_LENGTH) {
        return partialText;
      }
    }

    throw error;
  }
}

export function prepareTextForGeneration(text: string, maxChars = MAX_AI_INPUT_CHARS) {
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }

  return {
    text:
      text.slice(0, maxChars) +
      "\n\n[... documento recortado por longitud; se usó la parte inicial ...]",
    truncated: true,
  };
}

const ORGANIZER_SECTION_SEPARATOR = "\n\n[... sección omitida ...]\n\n";

/** Inicio + final sin el desarrollo intermedio (útil para asunto y resolución en casaciones). */
export function sampleTextHeadTail(text: string, maxChars: number, headRatio = 0.5) {
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }

  const separator = "\n\n[... desarrollo omitido para catalogación ...]\n\n";
  const separatorBudget = separator.length;
  const contentBudget = maxChars - separatorBudget;
  const headLen = Math.max(400, Math.floor(contentBudget * headRatio));
  const tailLen = contentBudget - headLen;

  return {
    text:
      `${text.slice(0, headLen)}${separator}${text.slice(text.length - tailLen)}` +
      "\n\n[... solo inicio y final del documento ...]",
    truncated: true,
  };
}

/** Muestrea inicio (40%), centro (20%) y final (40%) para no perder conclusiones. */
export function sampleTextHeadMiddleTail(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return { text, truncated: false };
  }

  const separatorBudget = ORGANIZER_SECTION_SEPARATOR.length * 2;
  const contentBudget = maxChars - separatorBudget;

  const startLen = Math.floor(contentBudget * 0.4);
  const middleLen = Math.floor(contentBudget * 0.2);
  const endLen = contentBudget - startLen - middleLen;

  const start = text.slice(0, startLen);
  const middleStart = Math.floor((text.length - middleLen) / 2);
  const middle = text.slice(middleStart, middleStart + middleLen);
  const end = text.slice(text.length - endLen);

  return {
    text:
      `${start}${ORGANIZER_SECTION_SEPARATOR}${middle}${ORGANIZER_SECTION_SEPARATOR}${end}` +
      "\n\n[... documento recortado: 40% inicio, 20% centro, 40% final ...]",
    truncated: true,
  };
}

export function prepareOrganizerText(text: string) {
  return sampleTextHeadMiddleTail(text, MAX_ORGANIZER_INPUT_CHARS);
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

function report(
  onProgress: OcrProgressCallback | undefined,
  progress: PdfExtractionProgress,
) {
  onProgress?.(progress);
}

export async function extractPdfFromBuffer(
  buffer: Buffer,
  fileName: string,
  options: PdfExtractionOptions = {},
): Promise<{ text: string; method: PdfExtractionMeta["method"] }> {
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error("El PDF supera el límite de 150 MB.");
  }

  const onProgress = options.onProgress;

  if (options.forceScanned) {
    if (!env.geminiApiKey) {
      throw new Error(
        "Marcaste PDF escaneado pero falta GEMINI_API_KEY en .env.local.",
      );
    }

    report(onProgress, {
      stage: "ocr",
      percent: 20,
      message: "Iniciando OCR para PDF escaneado...",
    });

    const ocrText = await extractTextWithGeminiOcrSafe(
      buffer,
      fileName,
      onProgress,
    );

    return { text: ocrText, method: "gemini-ocr" as const };
  }

  report(onProgress, {
    stage: "parse",
    percent: 12,
    message: "Analizando capas de texto del PDF...",
  });

  const attempts: Array<{
    text: string;
    method: "pdf2json" | "pdf-parse";
  }> = [];
  let pdfParseFailed = false;
  let pdf2jsonText = "";

  try {
    pdf2jsonText = await extractWithPdf2Json(buffer);
    console.log("pdf2json result length:", pdf2jsonText.length);
    if (
      pdf2jsonText.length >= MIN_USEFUL_TEXT_LENGTH &&
      !isLowQualityExtractedText(pdf2jsonText)
    ) {
      report(onProgress, {
        stage: "parse",
        percent: 70,
        message: "Texto extraído correctamente (pdf2json).",
      });
      return { text: pdf2jsonText, method: "pdf2json" as const };
    }
    if (pdf2jsonText) {
      attempts.push({ text: pdf2jsonText, method: "pdf2json" });
    }
  } catch (error) {
    console.error("pdf2json fallo:", error);
  }

  try {
    report(onProgress, {
      stage: "parse",
      percent: 22,
      message: "Intentando lectura profunda (pdf-parse)...",
    });

    const pdfParseText = await extractWithPdfParse(buffer);
    console.log("pdf-parse result length:", pdfParseText.length);
    if (
      pdfParseText.length >= MIN_USEFUL_TEXT_LENGTH &&
      !isLowQualityExtractedText(pdfParseText)
    ) {
      report(onProgress, {
        stage: "parse",
        percent: 70,
        message: "Texto extraído correctamente (pdf-parse).",
      });
      return { text: pdfParseText, method: "pdf-parse" as const };
    }
    if (pdfParseText) {
      attempts.push({ text: pdfParseText, method: "pdf-parse" });
    } else {
      pdfParseFailed = true;
    }
  } catch (error) {
    pdfParseFailed = true;
    console.error("pdf-parse fallo:", error);
  }

  const bestAttempt = attempts.sort((a, b) => b.text.length - a.text.length)[0];

  if (options.skipOcr) {
    if (bestAttempt?.text) {
      return { text: bestAttempt.text, method: bestAttempt.method };
    }

    throw new Error(
      "No se extrajo texto suficiente sin OCR. Si es un PDF escaneado, conviértelo a texto seleccionable o completa los campos manualmente.",
    );
  }

  if (pdfParseFailed && env.geminiApiKey) {
    report(onProgress, {
      stage: "ocr",
      percent: 28,
      message: "pdf-parse falló: usando OCR automático como ruta principal...",
    });

    const ocrText = await extractTextWithGeminiOcrSafe(
      buffer,
      fileName,
      onProgress,
    );
    console.log("OCR result length after pdf-parse failure:", ocrText.length);
    return { text: ocrText, method: "gemini-ocr" as const };
  }

  if (bestAttempt && bestAttempt.text.length >= MIN_USEFUL_TEXT_LENGTH) {
    if (!isLowQualityExtractedText(bestAttempt.text)) {
      return { text: bestAttempt.text, method: bestAttempt.method };
    }

    if (env.geminiApiKey) {
      report(onProgress, {
        stage: "ocr",
        percent: 28,
        message: "Texto de mala calidad: aplicando OCR automático...",
      });

      const ocrText = await extractTextWithGeminiOcrSafe(
        buffer,
        fileName,
        onProgress,
      );
      console.log("OCR result length after low-quality parse:", ocrText.length);
      return { text: ocrText, method: "gemini-ocr" as const };
    }

    console.warn(
      "Texto extraído con calidad baja y Gemini no está disponible. Usando el mejor intento disponible.",
    );
    return { text: bestAttempt.text, method: bestAttempt.method };
  }

  if (env.geminiApiKey) {
    report(onProgress, {
      stage: "ocr",
      percent: 25,
      message: "Texto pobre o escaneado: aplicando OCR con Gemini...",
    });

    const ocrText = await extractTextWithGeminiOcrSafe(
      buffer,
      fileName,
      onProgress,
    );
    return { text: ocrText, method: "gemini-ocr" as const };
  }

  throw new Error(
    "No se pudo extraer texto. Marca «PDF escaneado» o configura GEMINI_API_KEY.",
  );
}

export async function extractPdfText(
  file: File,
  options: PdfExtractionOptions = {},
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return extractPdfFromBuffer(buffer, file.name, options);
}
