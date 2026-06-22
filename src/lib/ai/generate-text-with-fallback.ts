import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { generateGeminiText } from "@/lib/ai/gemini-text";
import { parseJsonText } from "@/lib/ai/parse-json-text";
import {
  getGeminiApiKey,
  getGeminiModel,
  getOpenAiApiKey,
  getOpenAiModel,
  getOpenRouterApiKey,
  getOpenRouterModelCandidates,
  getTextAiProviderStatus,
  getXaiApiKey,
  getXaiModel,
  hasTextAiProviders,
} from "@/lib/ai/server-ai-env";
import { TextAiProvidersFailedError } from "@/lib/ai/text-ai-providers-failed";
import type { TextGenerationProvider } from "@/lib/ai/text-generation-types";
import type { UserAiCredentials } from "@/lib/ai/user-ai-credentials";
import { env } from "@/lib/env";

export type { TextGenerationProvider } from "@/lib/ai/text-generation-types";

export type TextGenerationResult = {
  text: string;
  provider: TextGenerationProvider;
  model: string;
};

const OPENROUTER_RETRYABLE = [/429/, /503/, /rate limit/i, /too many requests/i];

function providerError(provider: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return `${provider}: ${message}`;
}

function isRetryableOpenRouterError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return OPENROUTER_RETRYABLE.some((pattern) => pattern.test(message));
}

async function fetchOpenRouterText(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  model: string;
  timeoutMs?: number;
}): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY no configurada.");
  }

  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    timeoutMs: input.timeoutMs ?? 60_000,
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

  return input.json ? parseJsonText(content) : content;
}

export async function generateOpenRouterTextOnly(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
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

  for (const model of getOpenRouterModelCandidates()) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const text = await fetchOpenRouterText({
          ...input,
          model,
          timeoutMs: input.timeoutMs ?? 60_000,
        });
        return { text, provider: "openrouter", model };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn("[ai-fallback] OpenRouter model failed:", model, lastError.message);
        if (attempt < 2 && isRetryableOpenRouterError(error)) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          continue;
        }
        break;
      }
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
  const apiKey = getXaiApiKey();
  if (!apiKey) {
    throw new Error("XAI_API_KEY no configurada.");
  }

  const model = getXaiModel();
  const response = await fetchWithTimeout("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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

  return {
    text: input.json ? parseJsonText(content) : content,
    provider: "xai",
    model,
  };
}

async function tryOpenAiText(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
}): Promise<TextGenerationResult> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY no configurada.");
  }

  const model = getOpenAiModel();
  const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
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

  return {
    text: input.json ? parseJsonText(content) : content,
    provider: "openai",
    model,
  };
}

async function tryGeminiText(input: {
  prompt: string;
  temperature?: number;
  json?: boolean;
  timeoutMs?: number;
  apiKey?: string;
}): Promise<TextGenerationResult> {
  const text = await generateGeminiText(input);
  return { text, provider: "gemini", model: getGeminiModel() };
}

/**
 * Gemini primero; si falla (cuota, RECITATION, etc.) usa OpenRouter gratuito y otros proveedores.
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
      enabled: Boolean(userGemini || getGeminiApiKey()),
    },
    {
      provider: "openrouter",
      run: () => tryOpenRouterText({ ...input, timeoutMs: providerTimeoutMs }),
      enabled: Boolean(getOpenRouterApiKey()),
    },
    {
      provider: "xai",
      run: () => tryXaiText({ ...input, timeoutMs: providerTimeoutMs }),
      enabled: Boolean(getXaiApiKey()),
    },
    {
      provider: "openai",
      run: () => tryOpenAiText({ ...input, timeoutMs: providerTimeoutMs }),
      enabled: Boolean(getOpenAiApiKey()),
    },
  ];

  const providerStatus = getTextAiProviderStatus();
  console.info("[ai-fallback] proveedores configurados", providerStatus);

  const errors: string[] = [];
  const providersAttempted: TextGenerationProvider[] = [];

  for (const attempt of attempts) {
    if (!attempt.enabled) continue;
    providersAttempted.push(attempt.provider);
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

  if (!errors.length || !hasTextAiProviders()) {
    throw new Error(
      "No hay proveedores de IA configurados. Añade GEMINI_API_KEY y OPENROUTER_API_KEY (DeepSeek gratis).",
    );
  }

  throw new TextAiProvidersFailedError(
    `Todos los proveedores de texto fallaron. ${errors.join(" | ")}`,
    {
      providerErrors: errors,
      providersAttempted,
      providersConfigured: getTextAiProviderStatus(),
    },
  );
}
