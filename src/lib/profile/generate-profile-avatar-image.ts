import { fluxQuotaHint, generateFluxImage } from "@/lib/ai/hf-flux-image-provider";
import type { ImageGenerationResult } from "@/lib/ai/image-generation-types";
import {
  buildProfileAvatarNegativePrompt,
  resolveProfileAvatarFluxPrompt,
} from "@/lib/profile/profile-avatar-prompts";

export { resolveProfileAvatarFluxPrompt } from "@/lib/profile/profile-avatar-prompts";

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

/** Avatar SVG estilo MemoriaStudy (iniciales + Tron cyan) si FLUX no responde. */
export function buildProfileAvatarSvgFallback(prompt: string, displayName?: string): Buffer {
  const seed = hashString(`${prompt}:${displayName ?? ""}`.toLowerCase());
  const words = (displayName ?? prompt).trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "MS";

  const accentAngle = seed % 360;
  const accent = "#00FFD5";
  const accentBlue = "#00BFFF";
  const bg = "#07131a";
  const safeInitials = escapeXml(initials);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="58%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="${accentBlue}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${accentBlue}"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d7f9f4"/>
    </linearGradient>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" fill="${bg}"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  <circle cx="256" cy="256" r="196" fill="none" stroke="url(#ring)" stroke-width="3" opacity="0.35" transform="rotate(${accentAngle} 256 256)"/>
  <circle cx="256" cy="256" r="168" fill="rgba(16,39,48,0.55)" stroke="url(#ring)" stroke-width="4" filter="url(#softGlow)"/>
  <text x="256" y="278" text-anchor="middle" fill="url(#textGrad)" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="128" font-weight="900" letter-spacing="-6">${safeInitials}</text>
  <text x="256" y="392" text-anchor="middle" fill="${accent}" opacity="0.85" font-family="Segoe UI, Inter, system-ui, sans-serif" font-size="18" font-weight="700" letter-spacing="6">MEMORIA</text>
</svg>`;

  return Buffer.from(svg, "utf-8");
}

/** @deprecated Usar resolveProfileAvatarFluxPrompt desde profile-avatar-prompts. */
export function buildProfileAvatarFluxPrompt(userPrompt: string): string {
  return resolveProfileAvatarFluxPrompt(userPrompt);
}

function fluxFailureMessage(lastError: string): string {
  return (
    fluxQuotaHint(lastError) ??
    "FLUX no generó imagen IA. Se usó un avatar con tus iniciales. Para ilustraciones reales, verifica HF_TOKEN en Vercel (mismo token de organizadores visuales)."
  );
}

/**
 * Avatares: solo FLUX gratuito (HF_TOKEN). Sin Gemini Imagen (de pago).
 * Si Flux falla, avatar Tron con iniciales (no bloquea al estudiante).
 */
export async function generateProfileAvatarImage(
  userPrompt: string,
  displayName?: string,
): Promise<ProfileAvatarGeneration> {
  const fluxPrompt = resolveProfileAvatarFluxPrompt(userPrompt);
  const negativePrompt = buildProfileAvatarNegativePrompt(userPrompt);
  const flux = await generateFluxImage(fluxPrompt, {
    aspectRatio: "1:1",
    profileAvatar: true,
    negativePrompt,
  });

  if (flux.ok) {
    return {
      result: flux.result,
      warning: null,
    };
  }

  const buffer = buildProfileAvatarSvgFallback(userPrompt, displayName);
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
