import type { ProfessorTeachingStyle } from "@/types/guided-legal-study";

const STORAGE_KEY = "memoria-professor-style";

export const PROFESSOR_STYLE_LABELS: Record<
  ProfessorTeachingStyle,
  { label: string; description: string }
> = {
  friendly: {
    label: "Profesor amable",
    description: "Cercano, motivador y paciente.",
  },
  university: {
    label: "Profesor universitario",
    description: "Rigor académico estándar de cátedra.",
  },
  demanding: {
    label: "Profesor exigente",
    description: "Repreguntas frecuentes y estándar alto.",
  },
  defense_simulation: {
    label: "Sustentación oral",
    description: "Simula tribunal universitario.",
  },
};

export function loadProfessorStyle(): ProfessorTeachingStyle {
  if (typeof window === "undefined") return "university";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (
      raw === "friendly" ||
      raw === "university" ||
      raw === "demanding" ||
      raw === "defense_simulation"
    ) {
      return raw;
    }
  } catch {
    // ignore
  }
  return "university";
}

export function saveProfessorStyle(style: ProfessorTeachingStyle) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, style);
}

export function buildProfessorStylePrompt(style: ProfessorTeachingStyle): string {
  switch (style) {
    case "friendly":
      return `
ESTILO DEL PROFESOR — AMABLE:
- Tono cercano y alentador; celebra el esfuerzo del estudiante.
- Explica con paciencia; usa analogías cotidianas.
- Repregunta suavemente antes de dar la respuesta completa.`.trim();
    case "demanding":
      return `
ESTILO DEL PROFESOR — EXIGENTE:
- Tono universitario riguroso; no aceptes respuestas vagas.
- Repregunta con frecuencia para profundizar.
- Señala errores con claridad y pide precisión jurídica.`.trim();
    case "defense_simulation":
      return `
ESTILO DEL PROFESOR — SUSTENTACIÓN ORAL:
- Actúa como tribunal universitario evaluando una defensa.
- Formula preguntas directas: "Señor estudiante, defina…"
- Evalúa con criterios estrictos; repregunta si la respuesta es incompleta.`.trim();
    default:
      return `
ESTILO DEL PROFESOR — UNIVERSITARIO:
- Tono de cátedra UNT: riguroso pero didáctico.
- Profundidad doctrinal equilibrada con ejemplos peruanos.
- Repregunta cuando detectes confusión antes de explicar todo.`.trim();
  }
}
