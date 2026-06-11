import type { ImageAspectRatio } from "@/lib/ai/image-generation-types";
import {
  FLUX_VISUAL_AI_FORMATS,
  STRUCTURED_VISUAL_AI_FORMATS,
} from "@/lib/organizers/visual-ai-render-mode";
import {
  VISUAL_AI_FORMAT_IDS,
  type VisualAiFormatId,
} from "@/lib/organizers/visual-ai-types";

export type VisualAiBentoSize = "2x2" | "2x1" | "1x2" | "1x1";
export type VisualAiRenderMode = "flux" | "structured";

export type VisualAiFormatConfig = {
  id: VisualAiFormatId;
  renderMode: VisualAiRenderMode;
  emoji: string;
  label: string;
  /** Descripción técnica completa */
  description: string;
  /** Tagline corta para tarjeta de galería */
  tagline: string;
  aspectRatio: ImageAspectRatio;
  bento: VisualAiBentoSize;
  previewGradient: string;
  previewGlow: string;
  estimatedSeconds: number;
};

export const VISUAL_AI_FORMATS: VisualAiFormatConfig[] = [
  {
    id: "infographic",
    renderMode: "flux",
    emoji: "📊",
    label: "Infografía académica",
    tagline: "Resumen visual para exposiciones.",
    description: "Póster radial 16:9 con subtemas ilustrados alrededor del concepto central.",
    aspectRatio: "16:9",
    bento: "2x2",
    previewGradient: "linear-gradient(135deg, #1a0a2e 0%, #16213e 45%, #0f3460 100%)",
    previewGlow: "rgba(167, 139, 250, 0.35)",
    estimatedSeconds: 35,
  },
  {
    id: "legalAtlas",
    renderMode: "flux",
    emoji: "⚖️",
    label: "Atlas jurídico",
    tagline: "Diseño editorial estilo Harvard / National Geographic.",
    description: "Atlas editorial premium con densidad doctrinal y composición de posgrado.",
    aspectRatio: "16:9",
    bento: "1x2",
    previewGradient: "linear-gradient(160deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%)",
    previewGlow: "rgba(0, 191, 255, 0.3)",
    estimatedSeconds: 40,
  },
  {
    id: "mindMap",
    renderMode: "structured",
    emoji: "🧠",
    label: "Mapa mental",
    tagline: "Relaciones rápidas entre conceptos.",
    description: "Red orgánica de ideas con ramas, iconos y conexiones cognitivas.",
    aspectRatio: "1:1",
    bento: "1x2",
    previewGradient: "linear-gradient(145deg, #0a1628 0%, #1e3a5f 55%, #00ffd520 100%)",
    previewGlow: "rgba(0, 255, 213, 0.28)",
    estimatedSeconds: 30,
  },
  {
    id: "conceptMap",
    renderMode: "structured",
    emoji: "🗺️",
    label: "Mapa conceptual",
    tagline: "Nodos doctrinales y sus vínculos.",
    description: "Nodos enlazados con relaciones causa-efecto y jerarquía clara.",
    aspectRatio: "1:1",
    bento: "1x1",
    previewGradient: "linear-gradient(140deg, #07131a 0%, #134e4a 60%, #0d9488 100%)",
    previewGlow: "rgba(52, 211, 153, 0.25)",
    estimatedSeconds: 30,
  },
  {
    id: "comparisonTable",
    renderMode: "structured",
    emoji: "📋",
    label: "Cuadro comparativo",
    tagline: "Contrasta conceptos jurídicos en columnas.",
    description:
      "Lámina de comparación académica: criterios, similitudes y diferencias (nulidad vs anulabilidad, posesión vs propiedad, etc.).",
    aspectRatio: "16:9",
    bento: "2x1",
    previewGradient: "linear-gradient(120deg, #1a1025 0%, #4c1d95 40%, #7c3aed55 100%)",
    previewGlow: "rgba(167, 139, 250, 0.32)",
    estimatedSeconds: 35,
  },
  {
    id: "timeline",
    renderMode: "structured",
    emoji: "⏳",
    label: "Línea de tiempo visual",
    tagline: "Hitos cronológicos del tema.",
    description: "Cronología horizontal con fechas y contexto histórico-jurídico.",
    aspectRatio: "16:9",
    bento: "2x1",
    previewGradient: "linear-gradient(90deg, #040d12 0%, #1e293b 50%, #f59e0b33 100%)",
    previewGlow: "rgba(251, 191, 36, 0.22)",
    estimatedSeconds: 32,
  },
  {
    id: "academicPoster",
    renderMode: "flux",
    emoji: "📑",
    label: "Poster académico",
    tagline: "Lámina lista para muro o feria.",
    description: "Póster universitario con bloques de síntesis, definiciones y citas normativas.",
    aspectRatio: "4:3",
    bento: "1x1",
    previewGradient: "linear-gradient(155deg, #0f172a 0%, #312e81 70%, #6366f1 100%)",
    previewGlow: "rgba(99, 102, 241, 0.28)",
    estimatedSeconds: 33,
  },
  {
    id: "presentation",
    renderMode: "flux",
    emoji: "🎓",
    label: "Portada de exposición",
    tagline: "Una slide maestra para proyectar.",
    description: "Lámina 16:9 única para abrir tu sustentación oral (exportación PPTX próximamente).",
    aspectRatio: "16:9",
    bento: "1x1",
    previewGradient: "linear-gradient(135deg, #020617 0%, #0c4a6e 50%, #00ffd515 100%)",
    previewGlow: "rgba(56, 189, 248, 0.25)",
    estimatedSeconds: 28,
  },
];

export function getVisualAiFormat(id: VisualAiFormatId): VisualAiFormatConfig {
  const found = VISUAL_AI_FORMATS.find((f) => f.id === id);
  if (!found) throw new Error(`Formato visual desconocido: ${id}`);
  return found;
}

export function isVisualAiFormatId(value: unknown): value is VisualAiFormatId {
  return typeof value === "string" && VISUAL_AI_FORMAT_IDS.includes(value as VisualAiFormatId);
}

export { FLUX_VISUAL_AI_FORMATS, STRUCTURED_VISUAL_AI_FORMATS };
