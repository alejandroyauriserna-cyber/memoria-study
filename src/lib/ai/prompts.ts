import type { StudyGenerationCounts } from "@/types/generation";

export const UNT_DERECHO_AUDIENCE =
  "Estudiantes de la carrera de Derecho de la Universidad Nacional de Trujillo (UNT), Perú";

export const STUDY_DECK_JSON_SHAPE = `{
  "title": "string",
  "sourceName": "string",
  "summary": "string",
  "difficulty": "easy|medium|hard",
  "estimatedMinutes": number,
  "flashcards": [{"id":"card_1","front":"string","back":"string","hint":"string","tags":["string"]}],
  "fillBlanks": [{"id":"blank_1","sentence":"string con _____","answer":"string","explanation":"string"}],
  "quiz": [{"id":"quiz_1","question":"string","options":["A","B","C","D"],"answerIndex":0,"explanation":"string"}],
  "definitionCards": [{"id":"def_1","term":"string","definition":"string","hint":"string"}],
  "matchingPairs": [{"id":"pair_1","left":"string","right":"string"}]
}`;

export const SYSTEM_PROMPT_UNT_DERECHO = `
Eres tutor jurídico de élite para la Universidad Nacional de Trujillo (UNT), carrera de Derecho.

REGLAS DE IDIOMA Y CONTEXTO:
- TODO el material debe estar en español jurídico peruano (prohibido usar inglés).
- Prioriza el Código Civil, Constitución Política del Perú, doctrina y jurisprudencia del texto fuente.
- Simula evaluaciones exigentes: casos prácticos, distinciones doctrinales y preguntas orales.
- Los distractores del quiz deben ser plausibles en un examen universitario difícil.

TIPOS DE MATERIAL:
1. flashcards: pregunta/respuesta analítica.
2. fillBlanks: oraciones con espacio en blanco.
3. quiz: exactamente 4 opciones por pregunta.
4. definitionCards: término + definición para relacionar concepto-definición.
5. matchingPairs: pares concepto ↔ definición para juego de memoria.

Usa ÚNICAMENTE el texto fuente. No inventes normas ajenas al documento.
`;

export function buildCountsBlock(counts: StudyGenerationCounts) {
  return `
CANTIDADES EXACTAS (respeta estos números):
- flashcards: ${counts.flashcards}
- fillBlanks: ${counts.fillBlanks}
- quiz: ${counts.quiz}
- definitionCards: ${counts.definitionCards}
- matchingPairs: ${counts.matchingPairs}
Si un número es 0, devuelve un arreglo vacío [] para ese tipo.
`;
}

export function buildStudyUserPrompt(input: {
  sourceName: string;
  text: string;
  audience?: string;
  counts: StudyGenerationCounts;
  academic?: {
    yearLabel: string;
    cycleLabel: string;
    courseName: string;
    weekTitle: string;
  };
}) {
  const academicBlock = input.academic
    ? `
Contexto académico UNT:
- Año: ${input.academic.yearLabel}
- Ciclo: ${input.academic.cycleLabel}
- Curso: ${input.academic.courseName}
- ${input.academic.weekTitle}
`
    : "";

  return `
Archivo: ${input.sourceName}
Audiencia: ${input.audience ?? UNT_DERECHO_AUDIENCE}
${academicBlock}
${buildCountsBlock(input.counts)}

Genera el mazo de estudio completo en español para Derecho (UNT).

Texto fuente:
${input.text}
`;
}

export function buildProviderJsonPrompt(input: {
  sourceName: string;
  text: string;
  audience?: string;
  counts: StudyGenerationCounts;
  academic?: {
    yearLabel: string;
    cycleLabel: string;
    courseName: string;
    weekTitle: string;
  };
}) {
  return `${SYSTEM_PROMPT_UNT_DERECHO}

Devuelve SOLO JSON válido con esta forma exacta:
${STUDY_DECK_JSON_SHAPE}

${buildStudyUserPrompt(input)}`;
}
