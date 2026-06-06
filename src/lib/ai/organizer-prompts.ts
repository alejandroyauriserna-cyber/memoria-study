import { ORGANIZER_JSON_SHAPE } from "@/lib/ai/organizer-schema";
import { getOfficialCourseNames } from "@/lib/academic/helpers";

export const SYSTEM_PROMPT_ORGANIZER = `
Eres un asistente académico especializado en crear organizadores visuales de estudio jurídico universitario (Derecho UNT).

REGLAS ESTRICTAS:
- Usa EXCLUSIVAMENTE el texto fuente del PDF proporcionado.
- NO inventes conceptos, fechas, autores, definiciones ni ejemplos que no aparezcan en el documento.
- NO uses placeholders genéricos ni frases vacías.
- PROHIBIDO copiar párrafos del PDF: transforma el contenido en herramientas visuales de estudio.
- La clave "summary" es OBLIGATORIA: síntesis fiel del documento (3-6 oraciones).
- Incluye "aiAnalysis" con conceptos detectados, relaciones, dificultad y recomendaciones basadas en el PDF.
- Prioriza precisión académica sobre creatividad.
- Todo el contenido en español claro.
`;

export function buildOrganizerUserPrompt(input: {
  sourceName: string;
  text: string;
  materialTitle: string;
}) {
  const officialCourses = getOfficialCourseNames().slice(0, 30).join("; ");

  return `
Documento: ${input.sourceName}
Título del material (referencia): ${input.materialTitle}

Cursos oficiales UNT (referencia, no inventar otros): ${officialCourses}...

Genera un organizador premium basado ÚNICAMENTE en el texto del PDF.

Requisitos por sección:
- summary (OBLIGATORIO): síntesis transformada, no copia literal.
- aiAnalysis: conceptos detectados, relaciones entre conceptos, nivel de dificultad, recomendaciones de estudio.
- visualSummary: diseño pedagógico tipo infografía universitaria (estilo atlas jurídico Ferrajoli).
  * conceptCards: 4-8 tarjetas con título corto + definición clara (colores distintos por concepto).
  * comparisons: 2-4 comparaciones con title + left + right (ej. mera legalidad vs estricta legalidad).
  * legalTables: tablas con headers y rows cuando el PDF lo permita.
- flowProcess: mapa de proceso con nodes (id, label, explanation, legalBasis, example, relatedConcepts) y edges conectados. Proceso REAL del documento.
- reviewBundle: keyConcepts + questions (respuestas de al menos 10 caracteres) + examQuestions.
- Si una sección opcional no puede completarse con calidad, envía null en esa sección (no inventes datos cortos).
- conceptMap, hierarchy, timeline, flashcards: solo si el PDF lo sustenta; si no, null.
- flashcards: mínimo 2 tarjetas con question/answer de al menos 5 caracteres.

Texto fuente del PDF:
${input.text}
`;
}

export function buildOrganizerProviderJsonPrompt(input: {
  sourceName: string;
  text: string;
  materialTitle: string;
}) {
  return `${SYSTEM_PROMPT_ORGANIZER}

Devuelve SOLO JSON válido con esta forma (summary siempre requerido; null en secciones no sustentadas):
${ORGANIZER_JSON_SHAPE}

${buildOrganizerUserPrompt(input)}`;
}
