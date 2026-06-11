import { generateOrganizerImageWithFallback } from "@/lib/ai/generate-image-with-fallback";
import { buildImageGenerationUserMessage } from "@/lib/ai/image-generation-user-messages";
import type { ImageAspectRatio, ImageGenerationResult } from "@/lib/ai/image-generation-types";
import { getVisualAiFormat } from "@/lib/organizers/visual-ai-formats";
import type { VisualAiFormatId } from "@/lib/organizers/visual-ai-types";

function safeText(value: string, max = 36) {
  return value.replace(/[<>&"']/g, "").slice(0, max);
}

function svgVisualFallback(
  formatId: VisualAiFormatId,
  centralTopic: string,
  subtopics: string[],
): Buffer {
  const format = getVisualAiFormat(formatId);
  const label = safeText(centralTopic, 40);
  const isWide = format.aspectRatio === "16:9";
  const w = isWide ? 1920 : format.aspectRatio === "4:3" ? 1200 : 1080;
  const h = isWide ? 1080 : format.aspectRatio === "4:3" ? 900 : 1080;

  const chips = subtopics
    .slice(0, 5)
    .map(
      (topic, i) =>
        `<text x="48" y="${180 + i * 36}" fill="#F5F7FA" font-family="system-ui,sans-serif" font-size="14">${safeText(topic)}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#040d12"/>
  <text x="48" y="56" fill="#00FFD5" font-family="system-ui,sans-serif" font-size="14" font-weight="700">${format.emoji} ${safeText(format.label, 28)} · MEMORIASTUDY</text>
  <text x="48" y="120" fill="#A78BFA" font-family="system-ui,sans-serif" font-size="28" font-weight="700">${label}</text>
  ${chips}
</svg>`;

  return Buffer.from(svg, "utf-8");
}

export async function generateVisualAiImage(
  formatId: VisualAiFormatId,
  prompt: string,
  centralTopic: string,
  subtopics: string[],
  aspectRatio: ImageAspectRatio,
): Promise<ImageGenerationResult & { providerError?: string }> {
  const generated = await generateOrganizerImageWithFallback(prompt, { aspectRatio, formatId });

  if (generated.ok) {
    return generated.result;
  }

  const buffer = svgVisualFallback(formatId, centralTopic, subtopics);
  const diagnostics = {
    ...generated.diagnostics,
    imageSizeBytes: buffer.byteLength,
  };
  const warning =
    buildImageGenerationUserMessage({
      diagnostics,
      source: "fallback",
    }) ?? "⚠️ No se pudo generar la imagen con los proveedores disponibles. Se mostró una vista previa básica.";

  return {
    buffer,
    mimeType: "image/svg+xml",
    source: "fallback",
    warning,
    providerError: generated.lastError,
    diagnostics: {
      ...diagnostics,
      userMessage: warning,
    },
  };
}

export function extensionForVisualAiMime(mime: string) {
  if (mime.includes("svg")) return "svg";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "png";
}
