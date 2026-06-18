import type { NarrationClassMode } from "@/types/tutor-voice";

const STORAGE_KEY = "memoria-narration-class-mode";

export const NARRATION_CLASS_MODE_META: Record<
  NarrationClassMode,
  { emoji: string; label: string; description: string }
> = {
  listen: {
    emoji: "🎧",
    label: "Solo escuchar",
    description: "Flujo continuo — ideal caminando o repaso ligero",
  },
  practice: {
    emoji: "🎯",
    label: "Clase interactiva",
    description: "Pausas breves para demostrar lo que entendiste",
  },
};

export function loadNarrationClassMode(): NarrationClassMode {
  if (typeof window === "undefined") return "listen";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "practice" ? "practice" : "listen";
}

export function saveNarrationClassMode(mode: NarrationClassMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, mode);
}
