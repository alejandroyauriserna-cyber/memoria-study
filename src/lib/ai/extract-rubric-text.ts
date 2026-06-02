import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";
import { extractPdfFromBuffer } from "@/lib/pdf/extract";

const MAX_RUBRIC_CHARS = 14_000;

const RUBRIC_OCR_PROMPT = `
Transcribe fielmente TODO el texto visible de esta rúbrica académica o captura de pantalla.
Incluye criterios de evaluación, puntajes, tablas, requisitos visuales y formato solicitado.
No resumas: transcripción literal en español.
`.trim();

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function extensionOf(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop()! : "";
}

function mimeForFile(fileName: string, declared?: string | null) {
  if (declared && declared !== "application/octet-stream") return declared;
  const ext = extensionOf(fileName);
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

async function extractWithGeminiDocument(buffer: Buffer, mimeType: string, fileName: string) {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY no configurada para leer la rúbrica.");
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: env.geminiModel });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    },
    { text: `${RUBRIC_OCR_PROMPT}\n\nArchivo: ${fileName}` },
  ]);

  const text = result.response.text()?.trim();
  if (!text || text.length < 20) {
    throw new Error("No se pudo extraer texto suficiente de la rúbrica.");
  }

  return text.slice(0, MAX_RUBRIC_CHARS);
}

export async function extractRubricText(
  buffer: Buffer,
  fileName: string,
  declaredMime?: string | null,
): Promise<string> {
  const mimeType = mimeForFile(fileName, declaredMime);

  if (mimeType === "application/pdf") {
    const { text } = await extractPdfFromBuffer(buffer, fileName);
    if (!text?.trim()) {
      throw new Error("No se pudo leer el PDF de la rúbrica.");
    }
    return text.slice(0, MAX_RUBRIC_CHARS);
  }

  if (mimeType.startsWith("image/")) {
    return extractWithGeminiDocument(buffer, mimeType, fileName);
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractWithGeminiDocument(buffer, mimeType, fileName);
  }

  throw new Error("Formato no soportado. Usa PDF, DOCX, JPG o PNG.");
}
