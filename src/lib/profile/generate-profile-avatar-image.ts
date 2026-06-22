import { fluxQuotaHint, generateFluxImage } from "@/lib/ai/hf-flux-image-provider";
import type { ImageGenerationResult } from "@/lib/ai/image-generation-types";

export type ProfileAvatarGeneration = {
  result: ImageGenerationResult;
  warning: string | null;
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, "");
}

/** Avatar SVG local cuando Flux no está disponible (sin Gemini de pago). */
export function buildProfileAvatarSvgFallback(prompt: string): Buffer {
  const seed = hashString(prompt.toLowerCase());
  const hue = seed % 360;
  const accent = `hsl(${hue} 78% 58%)`;
  const accentSoft = `hsl(${(hue + 40) % 360} 70% 72%)`;
  const label = escapeXml(prompt.split(/\s+/).slice(0, 2).join(" ").slice(0, 24) || "Estudiante");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accentSoft}"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="256" cy="196" r="92" fill="rgba(255,255,255,0.92)"/>
  <ellipse cx="256" cy="390" rx="132" ry="118" fill="rgba(255,255,255,0.92)"/>
  <circle cx="224" cy="184" r="10" fill="#0f172a"/>
  <circle cx="288" cy="184" r="10" fill="#0f172a"/>
  <path d="M228 220 Q256 244 284 220" stroke="#0f172a" stroke-width="6" fill="none" stroke-linecap="round"/>
  <text x="256" y="468" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="system-ui,sans-serif" font-size="22" font-weight="800">${label}</text>
</svg>`;

  return Buffer.from(svg, "utf-8");
}

/** Prompt corto en inglés — FLUX Schnell responde mejor que prompts largos. */
export function buildProfileAvatarFluxPrompt(userPrompt: string): string {
  const subject = userPrompt.replace(/[<>&"']/g, "").trim().slice(0, 120);
  return `Cute profile avatar portrait, law student app mascot, ${subject}, shoulders up, centered, friendly expressive face, vibrant illustration, soft gradient background, high quality, no text, no watermark, single character`;
}

function fluxFailureMessage(lastError: string): string {
  return (
    fluxQuotaHint(lastError) ??
    "FLUX (Hugging Face) no respondió. Se generó un avatar ilustrado local mientras tanto."
  );
}

/**
 * Avatares: solo FLUX gratuito (HF_TOKEN). Sin Gemini Imagen (de pago).
 * Si Flux falla, SVG local para que el estudiante siempre reciba un avatar.
 */
export async function generateProfileAvatarImage(
  userPrompt: string,
): Promise<ProfileAvatarGeneration> {
  const fluxPrompt = buildProfileAvatarFluxPrompt(userPrompt);
  const flux = await generateFluxImage(fluxPrompt, { aspectRatio: "1:1" });

  if (flux.ok) {
    return {
      result: flux.result,
      warning: null,
    };
  }

  const buffer = buildProfileAvatarSvgFallback(userPrompt);
  return {
    result: {
      buffer,
      mimeType: "image/svg+xml",
      source: "fallback",
      warning: fluxFailureMessage(flux.lastError),
    },
    warning: fluxFailureMessage(flux.lastError),
  };
}
