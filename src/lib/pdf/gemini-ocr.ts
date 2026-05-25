import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";
import { splitPdfIntoPageChunks } from "@/lib/pdf/split-pdf";
import type { PdfExtractionProgress } from "@/types/pdf-progress";

const OCR_PROMPT = `
Transcribe fielmente TODO el texto visible de este fragmento de PDF escaneado (derecho, códigos, doctrina).
- Idioma: español jurídico.
- Incluye artículos, incisos, numeración, títulos y notas.
- No resumas: transcripción literal.
- Si algo es ilegible escribe [ilegible] y continúa.
`;

/** Límite seguro por petición inline a Gemini */
const MAX_INLINE_OCR_BYTES = 14 * 1024 * 1024;
const PAGES_PER_CHUNK = 3;

const OCR_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
] as const;

export type OcrProgressCallback = (progress: PdfExtractionProgress) => void;

async function ocrWithModel(
  apiKey: string,
  modelName: string,
  buffer: Buffer,
  label: string,
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: buffer.toString("base64"),
      },
    },
    { text: `${OCR_PROMPT}\n\nFragmento: ${label}` },
  ]);

  const text = result.response.text();
  if (!text || text.trim().length < 20) {
    throw new Error(`Modelo ${modelName}: texto insuficiente`);
  }

  return text.replace(/\s+/g, " ").trim();
}

async function ocrBufferWithFallback(
  apiKey: string,
  buffer: Buffer,
  label: string,
) {
  const errors: string[] = [];
  const preferred = env.geminiModel;
  const models = [
    preferred,
    ...OCR_MODELS.filter((model) => model !== preferred),
  ];

  for (const modelName of models) {
    try {
      return await ocrWithModel(apiKey, modelName, buffer, label);
    } catch (error) {
      errors.push(
        `${modelName}: ${error instanceof Error ? error.message : "falló"}`,
      );
    }
  }

  throw new Error(errors.join(" | "));
}

export async function extractTextWithGeminiOcr(
  buffer: Buffer,
  fileName: string,
  onProgress?: OcrProgressCallback,
) {
  if (!env.geminiApiKey) {
    throw new Error(
      "OCR no disponible: configura GEMINI_API_KEY para PDFs escaneados.",
    );
  }

  const sizeMb = (buffer.byteLength / (1024 * 1024)).toFixed(1);

  if (buffer.byteLength <= MAX_INLINE_OCR_BYTES) {
    onProgress?.({
      stage: "ocr",
      percent: 35,
      message: `OCR del documento completo (${sizeMb} MB)...`,
      currentChunk: 1,
      totalChunks: 1,
    });

    return ocrBufferWithFallback(env.geminiApiKey, buffer, fileName);
  }

  onProgress?.({
    stage: "ocr",
    percent: 28,
    message: `PDF grande (${sizeMb} MB): dividiendo en partes para OCR...`,
  });

  const { chunks, totalPages } = await splitPdfIntoPageChunks(
    buffer,
    PAGES_PER_CHUNK,
  );

  const parts: string[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunkNum = index + 1;
    const percent = 28 + Math.round((chunkNum / chunks.length) * 42);

    onProgress?.({
      stage: "ocr",
      percent,
      message: `OCR parte ${chunkNum} de ${chunks.length} (${totalPages} páginas en total)...`,
      currentChunk: chunkNum,
      totalChunks: chunks.length,
      totalPages,
    });

    const partText = await ocrBufferWithFallback(
      env.geminiApiKey,
      chunks[index],
      `${fileName} · parte ${chunkNum}/${chunks.length}`,
    );

    parts.push(partText);
  }

  const combined = parts.join(" ").trim();
  if (combined.length < 50) {
    throw new Error("OCR no extrajo suficiente texto del documento completo.");
  }

  return combined;
}
