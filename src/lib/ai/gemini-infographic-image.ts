import {
  generateGeminiImage,
  quotaHint,
  type GeminiImageResult,
} from "@/lib/ai/gemini-image-generation";

function svgInfographicFallback(
  centralTopic: string,
  subtopics: string[],
): Buffer {
  const safe = (s: string) => s.replace(/[<>&"']/g, "").slice(0, 36);
  const w = 1920;
  const h = 1080;
  const cx = w / 2;
  const cy = h / 2;
  const radius = 340;

  const topicNodes = subtopics.slice(0, 6).map((label, i) => {
    const angle = (i / Math.min(subtopics.length, 6)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const colors = ["#00FFD5", "#00BFFF", "#34D399", "#FF8A00", "#A78BFA", "#FBBF24"];
    return { x, y, label: safe(label), color: colors[i % colors.length]! };
  });

  const edges = topicNodes
    .map(
      (n) =>
        `<path d="M ${cx} ${cy} Q ${(cx + n.x) / 2} ${(cy + n.y) / 2 - 40} ${n.x} ${n.y}" fill="none" stroke="${n.color}" stroke-width="2" stroke-opacity="0.35"/>`,
    )
    .join("");

  const bubbles = topicNodes
    .map(
      (n) => `
    <g>
      <circle cx="${n.x}" cy="${n.y}" r="72" fill="${n.color}22" stroke="${n.color}" stroke-width="2"/>
      <text x="${n.x}" y="${n.y + 5}" text-anchor="middle" fill="#F5F7FA" font-family="system-ui,sans-serif" font-size="13" font-weight="600">${n.label}</text>
    </g>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="70%">
      <stop offset="0%" style="stop-color:#0a1f2e"/>
      <stop offset="100%" style="stop-color:#040d12"/>
    </radialGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <text x="48" y="56" fill="#00FFD5" font-family="system-ui,sans-serif" font-size="14" font-weight="700" letter-spacing="3">INFOGRAFÍA ACADÉMICA · MEMORIASTUDY</text>
  ${edges}
  <circle cx="${cx}" cy="${cy}" r="110" fill="rgba(0,255,213,0.15)" stroke="#00FFD5" stroke-width="3" filter="url(#glow)"/>
  <text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="#00FFD5" font-size="32">⚖</text>
  <text x="${cx}" y="${cy + 28}" text-anchor="middle" fill="#F5F7FA" font-family="system-ui,sans-serif" font-size="16" font-weight="700">${safe(centralTopic)}</text>
  ${bubbles}
</svg>`;

  return Buffer.from(svg, "utf-8");
}

export async function generateAcademicInfographicImage(
  prompt: string,
  centralTopic: string,
  subtopics: string[],
): Promise<GeminiImageResult & { geminiError?: string }> {
  const gemini = await generateGeminiImage(prompt, { aspectRatio: "16:9" });

  if (gemini.ok) {
    return gemini.result;
  }

  const hint = quotaHint(gemini.lastError);
  return {
    buffer: svgInfographicFallback(centralTopic, subtopics),
    mimeType: "image/svg+xml",
    source: "fallback",
    warning: hint ?? `Gemini imagen no disponible: ${gemini.lastError.slice(0, 200)}`,
    geminiError: gemini.lastError,
  };
}

export function extensionForInfographicMime(mime: string) {
  if (mime.includes("svg")) return "svg";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "png";
}
