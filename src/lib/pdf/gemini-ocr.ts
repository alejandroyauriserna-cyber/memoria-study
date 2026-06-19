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

const SLIDE_OCR_PROMPT = `
Transcribe fielmente TODO el texto visible de esta diapositiva o página de presentación (derecho, códigos, doctrina).
- Idioma: español jurídico.
- Incluye títulos, viñetas, numeración, artículos, incisos y notas al pie.
- Respeta la jerarquía (título principal, subtítulos, puntos).
- No resumas: transcripción literal.
- Si algo es ilegible escribe [ilegible] y continúa.
`;

const MAX_INLINE_OCR_BYTES = 14 * 1024 * 1024;
const PAGES_PER_CHUNK = 3;
const MAX_MODEL_ATTEMPTS = 3;
const SUPPORTED_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
const RETRYABLE_MODEL_ERRORS = [/429/, /503/, /quota exceeded/i, /too many requests/i, /service unavailable/i];

export type OcrProgressCallback = (progress: PdfExtractionProgress) => void;

type GeminiOcrError = Error & {
  partialText?: string;
  completedChunks?: number;
  totalChunks?: number;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeGeminiModel(model: string | undefined) {
  if (!model) {
    return SUPPORTED_GEMINI_MODELS[0];
  }

  if (SUPPORTED_GEMINI_MODELS.includes(model as typeof SUPPORTED_GEMINI_MODELS[number])) {
    return model;
  }

  console.warn(`Gemini model no soportado: ${model}. Usando ${SUPPORTED_GEMINI_MODELS[0]}.`);
  return SUPPORTED_GEMINI_MODELS[0];
}

function isRetryableGeminiError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "";

  return RETRYABLE_MODEL_ERRORS.some((pattern) => pattern.test(message));
}

function extractErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function ocrWithModel(
  apiKey: string,
  modelName: string,
  buffer: Buffer,
  label: string,
  options?: { mimeType?: string; prompt?: string },
) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const mimeType = options?.mimeType ?? "application/pdf";
  const prompt = options?.prompt ?? OCR_PROMPT;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_MODEL_ATTEMPTS; attempt += 1) {
    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: buffer.toString("base64"),
          },
        },
        { text: `${prompt}\n\nFragmento: ${label}` },
      ]);

      const text = result.response.text();
      if (!text || text.trim().length < 20) {
        throw new Error(`Modelo ${modelName}: texto insuficiente`);
      }

      return text.replace(/\s+/g, " ").trim();
    } catch (error) {
      lastError = error;
      const message = extractErrorMessage(error);

      if (attempt < MAX_MODEL_ATTEMPTS && isRetryableGeminiError(error)) {
        const backoff = 1000 * 2 ** (attempt - 1);
        console.warn(
          `Gemini ${modelName} intento ${attempt} falló por error temporal: ${message}. Reintentando en ${backoff}ms...`,
        );
        await delay(backoff);
        continue;
      }

      throw new Error(
        `Modelo ${modelName} falló${attempt > 1 ? ` tras ${attempt} intentos` : ""}: ${message}`,
      );
    }
  }

  throw new Error(
    `Modelo ${modelName} falló tras ${MAX_MODEL_ATTEMPTS} reintentos: ${extractErrorMessage(lastError)}`,
  );
}

async function ocrBufferWithFallback(
  apiKey: string,
  buffer: Buffer,
  label: string,
  options?: { mimeType?: string; prompt?: string },
) {
  const errors: string[] = [];
  const preferred = normalizeGeminiModel(env.geminiModel);
  const models = [
    preferred,
    ...SUPPORTED_GEMINI_MODELS.filter((model) => model !== preferred),
  ];

  for (const modelName of models) {
    try {
      return await ocrWithModel(apiKey, modelName, buffer, label, options);
    } catch (error) {
      errors.push(
        `${modelName}: ${extractErrorMessage(error)}`,
      );
    }
  }

  throw new Error(errors.join(" | "));
}

export async function ocrSlideImageWithGemini(
  imageBuffer: Buffer,
  label: string,
) {
  if (!env.geminiApiKey) {
    throw new Error(
      "OCR no disponible: configura GEMINI_API_KEY para PDFs de diapositivas.",
    );
  }

  return ocrBufferWithFallback(env.geminiApiKey, imageBuffer, label, {
    mimeType: "image/jpeg",
    prompt: SLIDE_OCR_PROMPT,
  });
}

export async function ocrPdfSlideChunkWithGemini(
  pdfBuffer: Buffer,
  label: string,
) {
  if (!env.geminiApiKey) {
    throw new Error(
      "OCR no disponible: configura GEMINI_API_KEY para PDFs de diapositivas.",
    );
  }

  return ocrBufferWithFallback(env.geminiApiKey, pdfBuffer, label, {
    mimeType: "application/pdf",
    prompt: SLIDE_OCR_PROMPT,
  });
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

    try {
      const partText = await ocrBufferWithFallback(
        env.geminiApiKey,
        chunks[index],
        `${fileName} · parte ${chunkNum}/${chunks.length}`,
      );
      parts.push(partText);
    } catch (error) {
      const partial = parts.join(" ").trim();
      const message = extractErrorMessage(error);
      const partialError = new Error(
        `OCR falló en parte ${chunkNum}/${chunks.length}: ${message}`,
      ) as GeminiOcrError;
      partialError.partialText = partial;
      partialError.completedChunks = index;
      partialError.totalChunks = chunks.length;
      partialError.message = `OCR parcial (${index}/${chunks.length}). ${message}`;

      if (partial.length >= 50) {
        onProgress?.({
          stage: "ocr",
          percent: 100,
          message: `OCR parcialmente completado (${index}/${chunks.length} partes). Puedes continuar después sin perder el progreso.`,
          currentChunk: index,
          totalChunks: chunks.length,
          totalPages,
        });
      }

      throw partialError;
    }
  }

  const combined = parts.join(" ").trim();
  if (combined.length < 50) {
    throw new Error("OCR no extrajo suficiente texto del documento completo.");
  }

  return combined;
}
