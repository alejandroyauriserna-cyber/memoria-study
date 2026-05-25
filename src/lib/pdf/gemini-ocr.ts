import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

const OCR_PROMPT = `
Transcribe fielmente TODO el texto visible de este documento PDF escaneado.
- Idioma: español (conserva términos jurídicos en español).
- Incluye títulos, artículos, numeración, notas al pie y encabezados.
- No resumas: solo transcripción literal.
- Si una zona es ilegible escribe [ilegible] y continúa.
`;

const OCR_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
] as const;

async function ocrWithModel(
  apiKey: string,
  modelName: string,
  buffer: Buffer,
  fileName: string,
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
    { text: `${OCR_PROMPT}\n\nArchivo: ${fileName}` },
  ]);

  const text = result.response.text();
  if (!text || text.trim().length < 50) {
    throw new Error(`Modelo ${modelName}: texto insuficiente`);
  }

  return text.replace(/\s+/g, " ").trim();
}

export async function extractTextWithGeminiOcr(
  buffer: Buffer,
  fileName: string,
) {
  if (!env.geminiApiKey) {
    throw new Error(
      "OCR no disponible: configura GEMINI_API_KEY para PDFs escaneados.",
    );
  }

  if (buffer.byteLength > 20 * 1024 * 1024) {
    throw new Error(
      "El PDF es muy grande para OCR (>20 MB). Comprime el archivo o divídelo.",
    );
  }

  const errors: string[] = [];
  const preferred = env.geminiModel;
  const models = [
    preferred,
    ...OCR_MODELS.filter((model) => model !== preferred),
  ];

  for (const modelName of models) {
    try {
      return await ocrWithModel(env.geminiApiKey, modelName, buffer, fileName);
    } catch (error) {
      errors.push(
        `${modelName}: ${error instanceof Error ? error.message : "falló"}`,
      );
    }
  }

  throw new Error(
    `No se pudo leer el PDF escaneado. Detalle: ${errors.join(" | ")}`,
  );
}
