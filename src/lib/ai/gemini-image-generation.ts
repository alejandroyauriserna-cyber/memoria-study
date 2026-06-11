import { env } from "@/lib/env";
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
} from "@/lib/ai/image-generation-types";

export type { GeminiImageResult, ImageGenerationResult } from "@/lib/ai/image-generation-types";

/** Modelos Nano Banana / Gemini Image (2025–2026). */
export const GEMINI_IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
] as const;

export type GeminiImageOptions = ImageGenerationOptions;

function extractImageFromPayload(payload: unknown): { data: string; mimeType: string } | null {
  const parts =
    (payload as { candidates?: Array<{ content?: { parts?: unknown[] } }> })?.candidates?.[0]
      ?.content?.parts ?? [];

  for (const part of parts) {
    const p = part as {
      inlineData?: { data?: string; mimeType?: string };
      inline_data?: { data?: string; mime_type?: string };
    };
    const inline = p.inlineData ?? p.inline_data;
    if (inline?.data) {
      const mime =
        ("mimeType" in inline && inline.mimeType) ||
        ("mime_type" in inline && inline.mime_type) ||
        "image/png";
      return {
        data: inline.data,
        mimeType: mime,
      };
    }
  }
  return null;
}

function errorMessage(payload: unknown, status: number): string {
  const msg = (payload as { error?: { message?: string } })?.error?.message;
  if (msg) return msg;
  return `HTTP ${status}`;
}

export async function generateGeminiImage(
  prompt: string,
  options: GeminiImageOptions = {},
): Promise<{ ok: true; result: ImageGenerationResult } | { ok: false; lastError: string }> {
  if (!env.geminiApiKey) {
    return { ok: false, lastError: "GEMINI_API_KEY no configurada." };
  }

  const preferred = process.env.GEMINI_IMAGE_MODEL?.trim();
  const models = preferred
    ? [preferred, ...GEMINI_IMAGE_MODELS.filter((m) => m !== preferred)]
    : [...GEMINI_IMAGE_MODELS];

  let lastError = "Ningún modelo de imagen respondió.";

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`;
      const generationConfig: Record<string, unknown> = {
        responseModalities: ["TEXT", "IMAGE"],
      };

      if (options.aspectRatio) {
        generationConfig.imageConfig = { aspectRatio: options.aspectRatio };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        lastError = `${model}: ${errorMessage(payload, response.status)}`;
        console.warn("[gemini-image]", lastError);
        continue;
      }

      const image = extractImageFromPayload(payload);
      if (image) {
        return {
          ok: true,
          result: {
            buffer: Buffer.from(image.data, "base64"),
            mimeType: image.mimeType,
            source: "gemini",
            model,
          },
        };
      }

      lastError = `${model}: respuesta sin imagen inline.`;
      console.warn("[gemini-image]", lastError);
    } catch (caught) {
      lastError = `${model}: ${caught instanceof Error ? caught.message : "error de red"}`;
      console.warn("[gemini-image]", lastError);
    }
  }

  return { ok: false, lastError };
}

export function quotaHint(error: string): string | undefined {
  if (/quota|429|billing|free_tier|limit:\s*0/i.test(error)) {
    return "Tu API key funciona para texto, pero la generación de imágenes requiere cuota de imagen en Google AI Studio (facturación activa o plan con Nano Banana).";
  }
  if (/not found|404/i.test(error)) {
    return "El modelo de imagen no está disponible en tu región o cuenta. Prueba GEMINI_IMAGE_MODEL=gemini-2.5-flash-image en .env.local.";
  }
  return undefined;
}
