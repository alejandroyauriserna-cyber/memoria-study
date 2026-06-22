import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getGeminiApiKey, getGeminiModel } from "@/lib/ai/server-ai-env";

const SUPPORTED_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"] as const;
const MAX_GEMINI_RETRIES = 3;
const GEMINI_RETRYABLE = [/429/, /503/, /quota exceeded/i, /too many requests/i, /resource_exhausted/i];

function normalizeGeminiModel(model: string | undefined) {
  if (!model) return SUPPORTED_GEMINI_MODELS[0];
  if (SUPPORTED_GEMINI_MODELS.includes(model as (typeof SUPPORTED_GEMINI_MODELS)[number])) {
    return model;
  }
  return SUPPORTED_GEMINI_MODELS[0];
}

function isRetryableGeminiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return GEMINI_RETRYABLE.some((pattern) => pattern.test(message));
}

function isBlockedFinishReason(reason: string | undefined) {
  return reason === "RECITATION" || reason === "SAFETY" || reason === "BLOCKLIST";
}

function finishReasonBlocked(message: string) {
  return /\b(SAFETY|RECITATION|BLOCKLIST)\b/.test(message);
}

async function requestGeminiOnce(input: {
  prompt: string;
  apiKey: string;
  model: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${input.model}:generateContent?key=${input.apiKey}`;

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: input.prompt }] }],
      generationConfig: {
        temperature: input.temperature ?? 0.35,
        ...(input.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
    timeoutMs: input.timeoutMs ?? 50_000,
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Error al consultar Gemini (${response.status}).`);
  }

  const candidate = payload.candidates?.[0];
  const finishReason = candidate?.finishReason;

  if (isBlockedFinishReason(finishReason)) {
    throw new Error(`Candidate was blocked due to ${finishReason}`);
  }

  const text = candidate?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    const reason = finishReason ? ` (${finishReason})` : "";
    throw new Error(`Gemini devolvió una respuesta vacía${reason}.`);
  }

  return text;
}

export async function generateGeminiText(input: {
  prompt: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = input.apiKey ?? getGeminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini no está configurado.");
  }

  const preferred = normalizeGeminiModel(input.model ?? getGeminiModel());
  const models = [
    preferred,
    ...SUPPORTED_GEMINI_MODELS.filter((model) => model !== preferred),
  ];
  const errors: string[] = [];

  for (const model of models) {
    for (let attempt = 1; attempt <= MAX_GEMINI_RETRIES; attempt += 1) {
      try {
        return await requestGeminiOnce({
          prompt: input.prompt,
          apiKey,
          model,
          temperature: input.temperature,
          json: input.json,
          timeoutMs: input.timeoutMs,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const blocked =
          /blocked due to/i.test(message) ||
          /recitation/i.test(message) ||
          finishReasonBlocked(message);

        if (blocked) {
          errors.push(`${model}: ${message}`);
          break;
        }

        if (attempt < MAX_GEMINI_RETRIES && isRetryableGeminiError(error)) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
          continue;
        }

        errors.push(`${model}: ${message}`);
        break;
      }
    }
  }

  throw new Error(errors.join(" | "));
}
