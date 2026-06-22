import { env } from "@/lib/env";
import { readServerEnv } from "@/lib/env/runtime";

/** Modelos gratuitos en OpenRouter, en orden de preferencia tras OPENROUTER_MODEL. */
export const OPENROUTER_FREE_MODEL_FALLBACKS = [
  "deepseek/deepseek-chat-v3-0324:free",
  "openrouter/free",
  "qwen/qwen3-4b:free",
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
