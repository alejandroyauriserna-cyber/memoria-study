import { studyDeckSchema, type StudyDeckOutput } from "@/lib/ai/schema";
import { buildProviderJsonPrompt } from "@/lib/ai/prompts";
import type { StudyGenerationCounts } from "@/types/generation";

const SUPPORTED_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
const MAX_GEMINI_RETRIES = 3;
const GEMINI_RETRYABLE = [/429/, /503/, /quota exceeded/i, /too many requests/i, /service unavailable/i];

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

  return GEMINI_RETRYABLE.some((pattern) => pattern.test(message));
}

function parseJsonDeck(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("El proveedor no devolvió JSON.");
  }

  return studyDeckSchema.parse(JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)));
}

async function fetchGeminiResponse(input: {
  apiKey: string;
  model: string;
  body: unknown;
}) {
  let lastError: unknown;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`;

  for (let attempt = 1; attempt <= MAX_GEMINI_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input.body),
      });

      const text = await response.text();
      if (response.ok) {
        return JSON.parse(text);
      }

      lastError = new Error(`Gemini falló (${response.status}): ${text}`);
      if (attempt < MAX_GEMINI_RETRIES && isRetryableGeminiError(lastError)) {
        const backoff = 1000 * 2 ** (attempt - 1);
        console.warn(
          `Gemini intento ${attempt} falló con estado ${response.status}. Reintentando en ${backoff}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_GEMINI_RETRIES && isRetryableGeminiError(error)) {
        const backoff = 1000 * 2 ** (attempt - 1);
        console.warn(
          `Gemini fetch intento ${attempt} falló por error temporal: ${error instanceof Error ? error.message : String(error)}. Reintentando en ${backoff}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    `Gemini falló tras ${MAX_GEMINI_RETRIES} intentos: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

export async function generateWithGemini(input: {
  sourceName: string;
  text: string;
  audience?: string;
  counts: StudyGenerationCounts;
  academic?: {
    yearLabel: string;
    cycleLabel: string;
    courseName: string;
    weekTitle: string;
  };
  apiKey: string;
  model: string;
}): Promise<StudyDeckOutput> {
  const model = normalizeGeminiModel(input.model);
  const payload = await fetchGeminiResponse({
    apiKey: input.apiKey,
    model,
    body: {
      contents: [
        {
          role: "user",
          parts: [{ text: buildProviderJsonPrompt(input) }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.25,
      },
    },
  });

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Gemini devolvió una respuesta vacía.");
  }

  return parseJsonDeck(text);
}

export async function generateWithXai(input: {
  sourceName: string;
  text: string;
  audience?: string;
  counts: StudyGenerationCounts;
  academic?: {
    yearLabel: string;
    cycleLabel: string;
    courseName: string;
    weekTitle: string;
  };
  apiKey: string;
  model: string;
}): Promise<StudyDeckOutput> {
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Generador de material jurídico UNT. Devuelve solo JSON válido en español.",
        },
        { role: "user", content: buildProviderJsonPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`xAI falló (${response.status}): ${await response.text()}`);
  }

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;

  if (typeof text !== "string") {
    throw new Error("xAI devolvió una respuesta vacía.");
  }

  return parseJsonDeck(text);
}
