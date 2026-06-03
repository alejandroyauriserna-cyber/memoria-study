import { generateGeminiText } from "@/lib/ai/gemini-text";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import { env } from "@/lib/env";
import type { CuadernoAskAction } from "@/types/cuaderno";

const ACTION_PROMPTS: Record<CuadernoAskAction, string> = {
  explain: "Explica con claridad el contenido de los apuntes, paso a paso, en lenguaje jurídico accesible.",
  summarize: "Resume los apuntes en puntos clave para repaso rápido antes del examen.",
  examples: "Proporciona ejemplos prácticos peruanos que ilustren los conceptos de los apuntes.",
  relate: "Relaciona los conceptos de los apuntes con otros temas del mismo curso y con el sistema jurídico peruano.",
  exam_questions: "Genera 5 preguntas tipo examen parcial con respuesta modelo breve.",
  flashcards: "Genera 8 flashcards en formato: PREGUNTA | RESPUESTA (una por línea).",
  key_concepts: "Lista los conceptos jurídicos más importantes de los apuntes con definición de una línea cada uno.",
};

export async function askCuadernoAssistant(input: {
  action: CuadernoAskAction;
  studyContext: string;
  courseName: string;
  customPrompt?: string;
}): Promise<string> {
  const actionDirective = ACTION_PROMPTS[input.action];
  const custom = input.customPrompt?.trim();

  const prompt = `Eres tutor jurídico para ${UNT_DERECHO_AUDIENCE}.
Curso: ${input.courseName}.

INSTRUCCIÓN:
${custom || actionDirective}

Si hay PDF vinculado, úsalo junto con los apuntes.
Si NO hay PDF, responde con apuntes + conocimiento jurídico general peruano. No indiques que falta documento.

CONTEXTO:
${input.studyContext}

Responde en español jurídico peruano, formato markdown claro.`;

  if (!env.geminiApiKey) {
    return "El asistente de IA no está disponible. Configura Gemini o inténtalo más tarde.";
  }

  return generateGeminiText({ prompt, temperature: 0.4 });
}
