import type { NarrationInterruptAction, NarrationMicroAction } from "@/types/tutor-voice";
import { NARRATION_MICRO_ACTION_LABELS } from "@/types/tutor-voice";

export function buildInterruptSystemPrompt(): string {
  return `
Eres un profesor particular de Derecho peruano. El estudiante está escuchando una clase narrada y te interrumpe.

Responde en 60–120 palabras, en lenguaje HABLADO (como si le hablaras al oído).
Sin markdown, sin listas numeradas, sin copiar párrafos del material.
Segunda persona, tono cercano y paciente. Si dice que no entiende, baja el nivel sin condescender.
Incluye un ejemplo concreto cuando ayude.
`.trim();
}

function presetInstruction(action: NarrationMicroAction): string {
  switch (action) {
    case "example":
      return "Da UN ejemplo concreto y sencillo (preferiblemente peruano) del concepto principal de esta página.";
    case "simpler":
      return "Reexplica la idea central con palabras más simples, una analogía cotidiana y sin tecnicismos.";
    case "casacion":
      return "Relaciona la idea con un criterio de casación o jurisprudencia típica (puede ser ilustrativa si no hay cita exacta).";
    case "exam":
      return "Explica cómo responderían esto en un examen oral o escrito: estructura de respuesta y punto que no deben olvidar.";
    case "repeat_main":
      return "Repite la idea principal de la página en 2–3 frases claras, como cierre rápido.";
  }
}

export function buildInterruptUserPrompt(input: {
  action: NarrationInterruptAction;
  pageFocus: string;
  pedagogicalSummary: string;
  primaryConcept?: string;
  studentMessage?: string;
}): string {
  const isFree = input.action === "free";
  const label = isFree
    ? "Pregunta libre del estudiante"
    : NARRATION_MICRO_ACTION_LABELS[input.action as NarrationMicroAction].label;

  const instruction = isFree
    ? `Responde directamente a lo que el estudiante dijo o preguntó. Si expresa confusión, aclara solo ese punto sin repetir toda la clase.`
    : presetInstruction(input.action as NarrationMicroAction);

  const studentLine = input.studentMessage?.trim()
    ? `\nMENSAJE DEL ESTUDIANTE: «${input.studentMessage.trim()}»`
    : "";

  return `
INTERRUPCIÓN: ${label}
${input.primaryConcept ? `CONCEPTO EN FOCO: ${input.primaryConcept}` : ""}${studentLine}

ENFOQUE DE PÁGINA: ${input.pageFocus}

CONTEXTO PEDAGÓGICO (Tutor IA — no leer literal):
${input.pedagogicalSummary.slice(0, 4_000)}

INSTRUCCIÓN: ${instruction}

Responde SOLO con el texto hablado del profesor.
`.trim();
}

/** @deprecated */
export const buildMicroActionSystemPrompt = buildInterruptSystemPrompt;
/** @deprecated */
export const buildMicroActionUserPrompt = buildInterruptUserPrompt;
