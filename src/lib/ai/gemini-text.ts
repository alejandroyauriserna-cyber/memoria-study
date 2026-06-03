import { env } from "@/lib/env";

const SUPPORTED_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;

function normalizeGeminiModel(model: string | undefined) {
  if (!model) return SUPPORTED_GEMINI_MODELS[0];
  if (SUPPORTED_GEMINI_MODELS.includes(model as (typeof SUPPORTED_GEMINI_MODELS)[number])) {
    return model;
  }
  return SUPPORTED_GEMINI_MODELS[0];
}

export async function generateGeminiText(input: {
  prompt: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  json?: boolean;
}): Promise<string> {
  const apiKey = input.apiKey ?? env.geminiApiKey;
  if (!apiKey) {
    throw new Error("Gemini no está configurado.");
  }

  const model = normalizeGeminiModel(input.model ?? env.geminiModel);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: input.prompt }] }],
      generationConfig: {
        temperature: input.temperature ?? 0.35,
        ...(input.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Error al consultar Gemini.");
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini devolvió una respuesta vacía.");
  }

  return text;
}
