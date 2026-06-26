import { env } from "@/lib/env";
import { readServerEnv } from "@/lib/env/runtime";

/** Modelos gratuitos en OpenRouter (rotan; ver openrouter.ai/models). */
export const OPENROUTER_FREE_MODEL_FALLBACKS = [
  "openrouter/free",
  "google/gemma-4-26b-a4b-it:free",
  "poolside/laguna-m.1:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
] as const;

export function getGeminiApiKey(override?: string): string | undefined {
  return override?.trim() || readServerEnv("GEMINI_API_KEY") || env.geminiApiKey;
}

export function getGeminiModel(): string {
  return readServerEnv("GEMINI_MODEL") || env.geminiModel;
}

export function getOpenRouterApiKey(): string | undefined {
  return (
    readServerEnv("OPENROUTER_API_KEY") ||
    readServerEnv("OPENROUTER_KEY") ||
    env.openRouterApiKey
  );
}

export type TextAiProviderStatus = {
  gemini: boolean;
  openrouter: boolean;
  xai: boolean;
  openai: boolean;
};

export function getTextAiProviderStatus(): TextAiProviderStatus {
  return {
    gemini: Boolean(getGeminiApiKey()),
    openrouter: Boolean(getOpenRouterApiKey()),
    xai: Boolean(getXaiApiKey()),
    openai: Boolean(getOpenAiApiKey()),
  };
}

export function getOpenRouterModel(): string {
  return readServerEnv("OPENROUTER_MODEL") || env.openRouterModel;
}

export function getOpenRouterModelCandidates(): string[] {
  const preferred = getOpenRouterModel();
  const candidates = [
    preferred,
    ...OPENROUTER_FREE_MODEL_FALLBACKS.filter((model) => model !== preferred),
  ];
  return candidates.filter((model, index, list) => Boolean(model) && list.indexOf(model) === index);
}

export function getXaiApiKey(): string | undefined {
  return readServerEnv("XAI_API_KEY") || env.xaiApiKey;
}

export function getXaiModel(): string {
  return readServerEnv("XAI_MODEL") || env.xaiModel;
}

export function getOpenAiApiKey(): string | undefined {
  return readServerEnv("OPENAI_API_KEY") || env.openAiApiKey;
}

export function getOpenAiModel(): string {
  return readServerEnv("OPENAI_MODEL") || env.openAiModel;
}

export function hasTextAiProviders(): boolean {
  return Boolean(
    getGeminiApiKey() ||
      getOpenRouterApiKey() ||
      getXaiApiKey() ||
      getOpenAiApiKey(),
  );
}
