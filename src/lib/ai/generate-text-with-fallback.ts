import { env } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { generateGeminiText } from "@/lib/ai/gemini-text";
import type { UserAiCredentials } from "@/lib/ai/user-ai-credentials";

export type TextGenerationProvider = "gemini" | "openrouter" | "xai" | "openai";

export type TextGenerationResult = {
  text: string;
  provider: TextGenerationProvider;
  model: string;
};

const OPENROUTER_FREE_MODEL_CANDIDATES = [
  env.openRouterModel,
  "deepseek/deepseek-chat-v3-0324:free",
  "openrouter/free",
].filter((model, index, list) => Boolean(model) && list.indexOf(model) === index);

function providerError(provider: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `${provider}: ${message}`;
}

async function fetchOpenRouterText(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  model: string;
  timeoutMs?: number;
}): Promise<string> {
  if (!env.openRouterApiKey) {
    throw new Error("OPENROUTER_API_KEY no configurada.");
  }

  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.appUrl,
      "X-Title": "MemoriaStudy",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: input.temperature ?? 0.35,
      messages: [{ role: "user", content: input.prompt }],
      ...(input.json ? { response_format: { type: "json_object" } } : {}),
    }),
    timeoutMs: input.timeoutMs ?? 45_000,
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenRouter (${input.model}) ${response.status}: ${raw.slice(0, 400)}`);
  }

  const payload = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`OpenRouter (${input.model}) devolvió una respuesta vacía.`);
  }

  return content;
}

export async function generateOpenRouterTextOnly(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
}): Promise<TextGenerationResult> {
  return tryOpenRouterText(input);
}

async function tryOpenRouterText(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<TextGenerationResult> {
  let lastError: Error | null = null;

  for (const model of OPENROUTER_FREE_MODEL_CANDIDATES.slice(0, 2)) {
    try {
      const text = await fetchOpenRouterText({ ...input, model, timeoutMs: input.timeoutMs ?? 45_000 });
      return { text, provider: "openrouter", model };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn("[ai-fallback] OpenRouter model failed:", model, lastError.message);
    }
  }

  throw lastError ?? new Error("OpenRouter no devolvió respuesta en ningún modelo.");
}

async function tryXaiText(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<TextGenerationResult> {
  if (!env.xaiApiKey) {
    throw new Error("XAI_API_KEY no configurada.");
  }

  const response = await fetchWithTimeout("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.xaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.xaiModel,
      temperature: input.temperature ?? 0.35,
      messages: [{ role: "user", content: input.prompt }],
      ...(input.json ? { response_format: { type: "json_object" } } : {}),
    }),
    timeoutMs: input.timeoutMs ?? 45_000,
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`xAI ${response.status}: ${raw.slice(0, 400)}`);
  }

  const payload = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("xAI devolvió una respuesta vacía.");
  }

  return { text: content, provider: "xai", model: env.xaiModel };
}

async function tryOpenAiText(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<TextGenerationResult> {
  if (!env.openAiApiKey) {
    throw new Error("OPENAI_API_KEY no configurada.");
  }

  const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.openAiModel,
      temperature: input.temperature ?? 0.35,
      messages: [{ role: "user", content: input.prompt }],
      ...(input.json ? { response_format: { type: "json_object" } } : {}),
    }),
    timeoutMs: input.timeoutMs ?? 45_000,
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${raw.slice(0, 400)}`);
  }

  const payload = JSON.parse(raw) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI devolvió una respuesta vacía.");
  }

  return { text: content, provider: "openai", model: env.openAiModel };
}

async function tryGeminiText(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
  apiKey?: string;
}): Promise<TextGenerationResult> {
  const text = await generateGeminiText(input);
  return { text, provider: "gemini", model: env.geminiModel };
}

/**
 * Gemini primero; si falla (cuota, 429, etc.) usa OpenRouter/DeepSeek gratis y otros proveedores.
 * DeepSeek no es API directa: requiere OPENROUTER_API_KEY y modelo :free.
 */
export async function generateTextWithFallback(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
  userCredentials?: UserAiCredentials;
}): Promise<TextGenerationResult> {
  const providerTimeoutMs = input.timeoutMs;
  const userGemini = input.userCredentials?.geminiApiKey?.trim();
  const attempts: Array<{
    provider: TextGenerationProvider;
    run: () => Promise<TextGenerationResult>;
    enabled: boolean;
  }> = [
    {
      provider: "gemini",
      run: () => tryGeminiText({ ...input, apiKey: userGemini }),
      enabled: Boolean(userGemini || env.geminiApiKey),
    },
    {
      provider: "openrouter",
      run: () => tryOpenRouterText({ ...input, timeoutMs: providerTimeoutMs }),
      enabled: Boolean(env.openRouterApiKey),
    },
    {
      provider: "xai",
      run: () => tryXaiText({ ...input, timeoutMs: providerTimeoutMs }),
      enabled: Boolean(env.xaiApiKey),
    },
    {
      provider: "openai",
      run: () => tryOpenAiText({ ...input, timeoutMs: providerTimeoutMs }),
      enabled: Boolean(env.openAiApiKey),
    },
  ];

  const errors: string[] = [];

  for (const attempt of attempts) {
    if (!attempt.enabled) continue;
    try {
      const result = await attempt.run();
      if (attempt.provider !== "gemini") {
        console.info(
          `[ai-fallback] Usando ${result.provider} (${result.model}) tras fallo de proveedores anteriores.`,
        );
      }
      return result;
    } catch (error) {
      const message = providerError(attempt.provider, error);
      errors.push(message);
      console.warn("[ai-fallback]", message);
    }
  }

  if (!errors.length) {
    throw new Error(
      "No hay proveedores de IA configurados. Añade GEMINI_API_KEY u OPENROUTER_API_KEY (DeepSeek gratis).",
    );
  }

  throw new Error(`Todos los proveedores de texto fallaron. ${errors.join(" | ")}`);
}
