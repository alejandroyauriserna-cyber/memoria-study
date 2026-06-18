import type { PageProfessorAnalysis } from "@/types/guided-legal-study";
import type { NarrationStyle } from "@/types/tutor-voice";
import { NARRATION_STYLE_META } from "@/lib/guided-study/tutor-voice/narration-style";

/**
 * Resume la explicación pedagógica del Tutor IA — NO el PDF.
 * Es la base para convertir en clase hablada.
 */
export function buildPedagogicalSourceSummary(analysis: PageProfessorAnalysis): string {
  const concepts = analysis.conceptCards
    .slice(0, 8)
    .map((c, i) => {
      const parts = [
        `${i + 1}. ${c.concept}`,
        `   Explicación: ${c.explanation.slice(0, 600)}`,
      ];
      if (c.example) parts.push(`   Ejemplo didáctico: ${c.example.slice(0, 250)}`);
      if (c.examImportance) parts.push(`   Para examen: ${c.examImportance.slice(0, 200)}`);
      if (c.peruLaw) parts.push(`   Derecho peruano: ${c.peruLaw.slice(0, 200)}`);
      return parts.join("\n");
    })
    .join("\n\n");

  const secondary = analysis.secondaryMentions
    .slice(0, 4)
    .map((m) => `• ${m.mention}: ${m.briefNote.slice(0, 180)}`)
    .join("\n");

  const keyIdeas = analysis.keyLearning.map((k) => k.label).join("; ");

  const examBits = [
    analysis.examMode.memorableConcepts.length
      ? `Conceptos memorables: ${analysis.examMode.memorableConcepts.slice(0, 5).join("; ")}`
      : "",
    analysis.examMode.commonErrors.length
      ? `Errores típicos: ${analysis.examMode.commonErrors.slice(0, 4).join("; ")}`
      : "",
    analysis.examMode.oral[0]?.question
      ? `Pregunta oral tipo: ${analysis.examMode.oral[0].question.slice(0, 200)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const norms = analysis.citations
    .slice(0, 3)
    .map((c) => `${c.norm} ${c.article}: ${(c.fragment ?? c.text).slice(0, 160)}`)
    .join("\n");

  return [
    `ENFOQUE DE LA PÁGINA: ${analysis.pageFocus}`,
    keyIdeas ? `IDEAS CLAVE: ${keyIdeas}` : "",
    concepts ? `EXPLICACIÓN PEDAGÓGICA (Tutor IA — no copies literal):\n${concepts}` : "",
    secondary ? `MENCIONES SECUNDARIAS:\n${secondary}` : "",
    examBits ? `ÁNGULO DE EXAMEN:\n${examBits}` : "",
    norms ? `NORMAS / JURISPRUDENCIA CITADA:\n${norms}` : "",
    analysis.comprehensionQuestion
      ? `PREGUNTA DE COMPRENSIÓN: ${analysis.comprehensionQuestion}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** @deprecated alias */
export const buildNarrationSourceSummary = buildPedagogicalSourceSummary;

export function buildNarrationSystemPrompt(
  style: NarrationStyle,
  memoryHint?: string,
): string {
  const meta = NARRATION_STYLE_META[style];

  const styleBlock =
    style === "quick"
      ? `
MODO: EXPLICACIÓN RÁPIDA (~1 minuto, máximo ${meta.maxWords} palabras).
OBJETIVO: Una sola idea central de la página, clara y memorable.
Incluye UNA analogía breve o ejemplo peruano. No desarrolles todos los conceptos.`
      : style === "magistral"
        ? `
MODO: CLASE MAGISTRAL (5–8 minutos, hasta ${meta.maxWords} palabras).
OBJETIVO: Mini clase universitaria completa.
DEBES incluir: ejemplos concretos, analogías, errores comunes de examen, relación con jurisprudencia o casación cuando aplique, y una aplicación práctica.
Cierra con cómo responderían esto en un examen oral o escrito.`
        : `
MODO: EXPLICACIÓN NORMAL (2–4 minutos, hasta ${meta.maxWords} palabras).
OBJETIVO: Explicación pedagógica completa con ejemplos simples y conexión con el examen.`;

  return `
Eres un profesor particular de Derecho peruano. El estudiante tiene una página densa del material y YA tiene una explicación pedagógica generada por el Tutor IA.

TU TRABAJO: convertir esa explicación pedagógica en una CLASE BREVE HABLADA — como si estuvieras sentado a su lado explicándole, NO leyendo un PDF ni un texto académico.

${styleBlock}

ESTILO DE VOZ (obligatorio):
- Segunda persona: "mira", "fíjate", "piensa en esto".
- Preguntas retóricas: "¿Qué haría un juez aquí?", "¿Por qué importa esto en el examen?"
- Ejemplos sencillos del mundo real o del derecho peruano.
- Transiciones naturales: "ahora bien", "ojo con esto", "para que no se te olvide".
- Pausas conceptuales con frases cortas; NO uses puntos suspensivos.

EVITA:
- Leer párrafos completos o definiciones como diccionario.
- Enumeraciones rígidas ("primero, segundo, tercero").
- Lenguaje excesivamente formal o latino jurídico innecesario.
- Copiar literalmente la explicación del panel; TRANSFÓRMALA en voz hablada.

EJEMPLO DE TONO:
Mal: "La interpretación sistemática consiste en..."
Bien: "Piensa en esto. Imagina que tienes una cláusula contractual que parece contradictoria. ¿Qué haría un juez? Aquí entra la interpretación sistemática..."

SALIDA: solo el guion hablado, un bloque continuo sin saltos de línea, sin markdown, sin comillas envolventes.
${memoryHint ? `\nMEMORIA DE SESIÓN:\n${memoryHint}` : ""}
`.trim();
}

export function buildNarrationUserPrompt(input: {
  documentTitle: string;
  courseName?: string;
  chapterTitle?: string;
  pageNumber: number;
  pedagogicalSummary: string;
  style: NarrationStyle;
}): string {
  const meta = NARRATION_STYLE_META[input.style];

  return `
DOCUMENTO: ${input.documentTitle}
${input.courseName ? `CURSO: ${input.courseName}` : ""}
${input.chapterTitle ? `CAPÍTULO: ${input.chapterTitle}` : ""}
PÁGINA: ${input.pageNumber}
FORMATO: ${meta.label} (${meta.duration})

EXPLICACIÓN PEDAGÓGICA DEL TUTOR IA (base — conviértela en clase hablada, no la leas):
${input.pedagogicalSummary.slice(0, 10_000)}

Escribe SOLO el guion de la clase hablada del profesor particular.
`.trim();
}
