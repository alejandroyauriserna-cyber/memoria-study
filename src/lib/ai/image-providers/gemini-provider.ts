import { env } from "@/lib/env";
import { generateGeminiImage, quotaHint } from "@/lib/ai/gemini-image-generation";
import type { ImageProvider } from "@/lib/ai/image-providers/types";

/** Precio oficial gemini-2.5-flash-image (~1290 tokens × $30/M). */
const ESTIMATED_COST_USD = 0.039;

export const geminiImageProvider: ImageProvider = {
  id: "gemini",
  source: "gemini",
  label: "Gemini Image",

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY?.trim() || env.geminiApiKey?.trim());
  },

  estimateCostUsd() {
    return ESTIMATED_COST_USD;
  },

  quotaHint,

  async generate(prompt, options) {
    const result = await generateGeminiImage(prompt, options);
    if (result.ok) {
      return {
        ok: true,
        buffer: result.result.buffer,
        mimeType: result.result.mimeType,
        model: result.result.model,
      };
    }
    return {
      ok: false,
      error: result.lastError,
      model: process.env.GEMINI_IMAGE_MODEL?.trim(),
    };
  },
};
