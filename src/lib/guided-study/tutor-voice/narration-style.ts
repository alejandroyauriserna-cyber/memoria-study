import type { NarrationStyle } from "@/types/tutor-voice";

export const NARRATION_STYLES: NarrationStyle[] = ["quick", "normal", "magistral"];

export const NARRATION_STYLE_META: Record<
  NarrationStyle,
  { emoji: string; label: string; duration: string; objective: string; maxWords: number }
> = {
  quick: {
    emoji: "⚡",
    label: "Explicación rápida",
    duration: "~1 min",
    objective: "Idea principal de la página.",
    maxWords: 150,
  },
  normal: {
    emoji: "🎓",
    label: "Explicación normal",
    duration: "2–4 min",
    objective: "Explicación completa con ejemplos simples.",
    maxWords: 480,
  },
  magistral: {
    emoji: "🏛",
    label: "Clase magistral",
    duration: "5–8 min",
    objective:
      "Mini clase universitaria: ejemplos, analogías, errores comunes, examen, jurisprudencia y aplicación práctica.",
    maxWords: 1_050,
  },
};

export function loadNarrationStyle(): NarrationStyle {
  if (typeof window === "undefined") return "normal";
  try {
    const raw = localStorage.getItem("memoria-narration-style");
    if (raw === "quick" || raw === "normal" || raw === "magistral") return raw;
  } catch {
    // ignore
  }
  return "normal";
}

export function saveNarrationStyle(style: NarrationStyle) {
  if (typeof window === "undefined") return;
  localStorage.setItem("memoria-narration-style", style);
}
