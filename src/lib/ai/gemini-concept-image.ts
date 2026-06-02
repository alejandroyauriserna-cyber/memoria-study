import { env } from "@/lib/env";

const IMAGE_MODELS = [
  "gemini-2.0-flash-preview-image-generation",
  "gemini-2.0-flash-exp-image-generation",
] as const;

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
): Promise<{ buffer: Buffer; mimeType: string; source: "gemini" | "svg" }> {
  if (!env.geminiApiKey) {
    return { buffer: svgFallback(label), mimeType: "image/svg+xml", source: "svg" };
  }

  for (const model of IMAGE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.geminiApiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) continue;

      const parts = payload.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const inline = part.inlineData ?? part.inline_data;
        if (inline?.data) {
          return {
            buffer: Buffer.from(inline.data, "base64"),
            mimeType: inline.mimeType ?? inline.mime_type ?? "image/png",
            source: "gemini",
          };
        }
      }
    } catch {
      /* try next model */
    }
  }

  return { buffer: svgFallback(label), mimeType: "image/svg+xml", source: "svg" };
}

export function extensionForMime(mime: string) {
  if (mime.includes("svg")) return "svg";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "png";
}
