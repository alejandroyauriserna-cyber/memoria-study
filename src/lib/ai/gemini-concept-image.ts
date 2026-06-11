import { generateOrganizerImageWithFallback } from "@/lib/ai/generate-image-with-fallback";
import { fluxQuotaHint } from "@/lib/ai/hf-flux-image-provider";
import { quotaHint } from "@/lib/ai/gemini-image-generation";
import type { ImageGenerationResult } from "@/lib/ai/image-generation-types";

function svgFallback(label: string): Buffer {
  const safe = label.replace(/[<>&"']/g, "").slice(0, 40);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00FFD5;stop-opacity:0.35"/>
      <stop offset="100%" style="stop-color:#00BFFF;stop-opacity:0.2"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" fill="#07131A"/>
  <circle cx="128" cy="128" r="96" fill="url(#g)" stroke="#00FFD5" stroke-width="2" opacity="0.9"/>
  <text x="128" y="138" text-anchor="middle" fill="#F5F7FA" font-family="system-ui,sans-serif" font-size="14" font-weight="600">${safe}</text>
</svg>`;
  return Buffer.from(svg, "utf-8");
}

export async function generateConceptImage(
  prompt: string,
  label: string,
): Promise<ImageGenerationResult> {
  const generated = await generateOrganizerImageWithFallback(prompt, { aspectRatio: "1:1" });

  if (generated.ok) {
    return generated.result;
  }

  const fluxError = generated.attempts.find((a) => a.provider === "flux")?.error;
  const geminiError = generated.attempts.find((a) => a.provider === "gemini")?.error;
  const hint = fluxQuotaHint(fluxError ?? "") ?? quotaHint(geminiError ?? generated.lastError);
  const buffer = svgFallback(label);

  return {
    buffer,
    mimeType: "image/svg+xml",
    source: "fallback",
    warning: hint ?? generated.lastError.slice(0, 200),
    diagnostics: {
      ...generated.diagnostics,
      imageSizeBytes: buffer.byteLength,
    },
  };
}

export function extensionForMime(mime: string) {
  if (mime.includes("svg")) return "svg";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "png";
}
