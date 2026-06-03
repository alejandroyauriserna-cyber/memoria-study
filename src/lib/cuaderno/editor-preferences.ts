export type CuadernoLayoutMode = "compact" | "standard" | "fullscreen";

export type CuadernoPaperTone = "warm" | "white" | "ivory" | "beige" | "cool" | "dark";

const LAYOUT_KEY = "memoria-cuaderno-layout";
const TONE_KEY = "memoria-cuaderno-paper-tone";

export function getLayoutMode(): CuadernoLayoutMode {
  if (typeof window === "undefined") return "fullscreen";
  const v = localStorage.getItem(LAYOUT_KEY);
  if (v === "compact" || v === "standard" || v === "fullscreen") return v;
  return "fullscreen";
}

export function saveLayoutMode(mode: CuadernoLayoutMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAYOUT_KEY, mode);
}

export function getPaperTone(): CuadernoPaperTone {
  if (typeof window === "undefined") return "warm";
  const v = localStorage.getItem(TONE_KEY);
  if (
    v === "warm" ||
    v === "white" ||
    v === "ivory" ||
    v === "beige" ||
    v === "cool" ||
    v === "dark"
  ) {
    return v;
  }
  return "warm";
}

export function savePaperTone(tone: CuadernoPaperTone) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TONE_KEY, tone);
}
