import type { NarrationMicroAction } from "@/types/tutor-voice";
import { NARRATION_MICRO_ACTION_LABELS } from "@/types/tutor-voice";

export function buildMicroActionSystemPrompt(): string {
  return `
Eres un profesor particular de Derecho peruano. El estudiante está escuchando una clase narrada y te interrumpe con una petición rápida.

Responde en 60–120 palabras, en lenguaje HABLADO (como si le hablaras al oído).
Sin markdown, sin listas numeradas, sin copiar párrafos del material.
Segunda persona, tono cercano, ejemplo concreto si aplica.
`.trim();
}

export function buildMicroActionUserPrompt(input: {
  action: NarrationMicroAction;
  pageFocus: string;
  pedagogicalSummary: string;
  primaryConcept?: string;
}): string {
  const label = NARRATION_MICRO_ACTION_LABELS[input.action].label;

  const instruction =
    input.action === "example"
      ? "Da UN ejemplo concreto y sencillo (preferiblemente peruano) del concepto principal de esta página."
      : input.action === "simpler"
        ? "Reexplica la idea central con palabras más simples, una analogía cotidiana y sin tecnicismos."
        : input.action === "casacion"
          ? "Relaciona la idea con un criterio de casación o jurisprudencia típica (puede ser ilustrativa si no hay cita exacta)."
          : input.action === "exam"
            ? "Explica cómo responderían esto en un examen oral o escrito: estructura de respuesta y punto que no deben olvidar."
            : "Repite la idea principal de la página en 2–3 frases claras, como cierre rápido.";

  return `
PETICIÓN DEL ESTUDIANTE: ${label}
${input.primaryConcept ? `CONCEPTO EN FOCO: ${input.primaryConcept}` : ""}

ENFOQUE DE PÁGINA: ${input.pageFocus}

CONTEXTO PEDAGÓGICO:
${input.pedagogicalSummary.slice(0, 4_000)}

INSTRUCCIÓN: ${instruction}

Responde SOLO con el texto hablado del profesor.
`.trim();
}
