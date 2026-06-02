import { ORGANIZER_JSON_SHAPE } from "@/lib/ai/organizer-schema";

export const SYSTEM_PROMPT_ORGANIZER = `
Eres un asistente académico especializado en crear organizadores visuales de estudio.

REGLAS ESTRICTAS:
- Usa EXCLUSIVAMENTE el texto fuente del PDF proporcionado.
- NO inventes conceptos, fechas, autores, definiciones ni ejemplos que no aparezcan en el documento.
- NO uses metadatos del curso, ciclo académico ni placeholders genéricos.
- PROHIBIDO usar frases vacías como "conceptos clave", "Leer material", "Aplicar en estudio" o preguntas genéricas sin contenido del PDF.
- La clave "summary" es OBLIGATORIA: siempre debe incluir una síntesis fiel del documento.
- Si otra sección no puede construirse con evidencia del texto, OMITE esa clave del JSON (no la rellenes).
- Todo el contenido debe estar en español claro y fiel al documento.
- Prioriza precisión sobre creatividad.
`;

export function buildOrganizerUserPrompt(input: {
  sourceName: string;
  text: string;
  materialTitle: string;
}) {
  return `
Documento: ${input.sourceName}
Título del material (solo referencia): ${input.materialTitle}

Genera un organizador de estudio basado ÚNICAMENTE en el texto fuente del PDF.

Requisitos por sección:
- summary (OBLIGATORIO): síntesis fiel del documento (3-6 oraciones).
- Incluye las demás secciones solo si el PDF permite sustentarlas:
- simplifiedExplanation: explicación sencilla del contenido real del PDF.
- conceptMap: title + nodes con conceptos/términos que aparezcan en el PDF.
- hierarchy: root = tema central del PDF; branches = subtemas reales del documento.
- timeline: eventos, etapas o secuencias mencionadas en el PDF (date solo si aparece).
- flowChart: start/end/steps describiendo un proceso REAL del documento (no pasos genéricos de estudio).
- flashcards: 4-8 tarjetas con preguntas y respuestas basadas en el PDF.
- reviewQuestions: 3-6 preguntas de repaso concretas sobre el contenido del PDF.

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

Devuelve SOLO JSON válido con esta forma (summary siempre requerido; omite el resto si no puedes sustentarlo):
${ORGANIZER_JSON_SHAPE}

${buildOrganizerUserPrompt(input)}`;
}
