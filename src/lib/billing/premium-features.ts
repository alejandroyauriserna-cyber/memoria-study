export type PremiumFeatureId =
  | "gemini-infographic"
  | "gemini-visual-map"
  | "visual-atlas-prompt"
  | "gemini-ocr-scanned"
  | "ai-sticker-packs";

export type PremiumFeature = {
  id: PremiumFeatureId;
  title: string;
  description: string;
  badge: string;
};

export const PREMIUM_FEATURES: Record<PremiumFeatureId, PremiumFeature> = {
  "gemini-infographic": {
    id: "gemini-infographic",
    title: "Infografía IA (Nano Banana)",
    description:
      "Genera pósters académicos ilustrados con Gemini Image — estilo atlas jurídico como el de Ferrajoli.",
    badge: "Pro",
  },
  "gemini-visual-map": {
    id: "gemini-visual-map",
    title: "Mapa mental con imágenes IA",
    description: "Nodos visuales generados por imagen para cada concepto del organizador.",
    badge: "Pro",
  },
  "visual-atlas-prompt": {
    id: "visual-atlas-prompt",
    title: "Atlas jurídico premium",
    description: "Prompts avanzados, rúbrica académica y personalización para infografías de maestría.",
    badge: "Pro",
  },
  "gemini-ocr-scanned": {
    id: "gemini-ocr-scanned",
    title: "OCR Gemini en PDF escaneados",
    description: "Extrae texto de apuntes fotografiados o escaneados con IA de visión.",
    badge: "Pro",
  },
  "ai-sticker-packs": {
    id: "ai-sticker-packs",
    title: "Packs de stickers IA",
    description: "Generación masiva de stickers temáticos para el cuaderno con Gemini Image.",
    badge: "Pro",
  },
};

/** Habilitar en .env.local: NEXT_PUBLIC_PREMIUM_FEATURES=gemini-infographic,gemini-visual-map */
export function isPremiumFeatureAvailable(featureId: PremiumFeatureId): boolean {
  const raw = process.env.NEXT_PUBLIC_PREMIUM_FEATURES ?? "";
  const enabled = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return enabled.includes(featureId);
}

export function getPremiumFeature(featureId: PremiumFeatureId): PremiumFeature {
  return PREMIUM_FEATURES[featureId];
}
