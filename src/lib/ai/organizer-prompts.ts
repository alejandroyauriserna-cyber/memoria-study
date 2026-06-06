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
- flowProcess: OBLIGATORIO cuando el PDF describe un proceso, método o cadena de razonamiento (interpretación, procedimiento, etapas). nodes (id, label, explanation, legalBasis, example, relatedConcepts) + edges conectados en orden lógico (mínimo 4 nodos).
- hierarchy: OBLIGATORIO cuando hay varios temas. root = título central del material; branches = lista de 4-12 subtemas/conceptos del PDF (los mismos que conceptMap.nodes).
- reviewBundle: keyConcepts (mínimo 4-8 si el PDF lo permite) + questions (una por concepto clave, respuestas de al menos 10 caracteres) + examQuestions.
- conceptMap: OBLIGATORIO cuando el PDF tiene varios temas. nodes debe listar los mismos conceptos clave que keyConcepts, hierarchy.branches y conceptCards (mínimo 4, máximo 14).
- aiAnalysis.conceptsDetected: lista explícita de 4-8 temas/conceptos identificados en el PDF (mismos nombres que keyConcepts y conceptMap.nodes).
- keyConcepts, conceptMap.nodes, hierarchy.branches, visualSummary.conceptCards y aiAnalysis.conceptsDetected deben referir los MISMOS conceptos del PDF (sin duplicar con nombres distintos).
- flashcards: OBLIGATORIO cuando hay suficiente contenido. Mínimo 8 tarjetas con question/answer de al menos 10 caracteres, cubriendo los conceptos principales del PDF.
- timeline: solo si el PDF tiene fechas o cronología; si no, null.
- Si una sección opcional no puede completarse con calidad, envía null en esa sección (no inventes datos cortos).

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
