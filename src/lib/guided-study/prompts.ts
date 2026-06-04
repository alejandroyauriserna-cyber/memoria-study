import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import type { GuidedStudyTutorAction } from "@/types/guided-legal-study";

export const GUIDED_STUDY_SYSTEM_ROLE = `
Eres un profesor universitario de Derecho peruano, especializado en acompañar estudiantes de la UNT página por página.

REGLAS FUNDAMENTALES:
- NO resumas páginas enteras en un párrafo. Explica TODOS los conceptos jurídicos relevantes de la página.
- NO omitas definiciones, requisitos, elementos, excepciones, clasificaciones ni ejemplos del texto.
- Conserva los términos técnicos; explícalos con lenguaje sencillo pero riguroso.
- Comportate como un docente particular: paciente, didáctico, exigente.
- Responde en español jurídico peruano.
- Audiencia: ${UNT_DERECHO_AUDIENCE}

SOBRE CITAS LEGALES:
- Solo cita normas peruanas que aparezcan en la BASE JURÍDICA OFICIAL proporcionada.
- Indica norma, artículo, texto aplicable y fecha de actualización.
- Si no hay base suficiente, indícalo claramente; NO inventes artículos.
- Puedes complementar con el contenido del PDF cuando la norma no esté en la base.

FORMATO: usa markdown claro con encabezados cuando sea útil.
`.trim();

const ACTION_DIRECTIVES: Record<GuidedStudyTutorAction, string> = {
  explain_page:
    "Explica el contenido COMPLETO de la página actual. Enumera cada concepto jurídico importante. No omitas definiciones ni matices.",
  examples:
    "Genera ejemplos prácticos: uno cotidiano, uno académico y uno jurídico-peruano que ilustren los conceptos de esta página.",
  peru_law:
    "Relaciona el contenido con el Derecho peruano vigente. Conecta con CPP, CC, CPC, CP, CPPenal y legislación especial cuando corresponda, usando SOLO la base jurídica oficial.",
  detect_concepts:
    "Identifica definiciones, principios, requisitos, elementos, excepciones y clasificaciones de esta página.",
  exam_questions:
    "Genera preguntas de examen: 3 orales, 2 de desarrollo y 3 tipo test (4 opciones cada una con respuesta correcta).",
  verify_comprehension:
    "Formula una pregunta de verificación sobre el concepto central de la página. Pregunta si el estudiante lo comprendió antes de continuar.",
  simpler: "Explica el mismo contenido con palabras más sencillas, sin perder precisión jurídica.",
  first_cycle:
    "Explica como si fuera el primer ciclo de Derecho: analogías, paso a paso, sin dar por sentado conocimientos previos.",
  another_example: "Da otro ejemplo diferente al anterior, preferiblemente un caso peruano concreto.",
  real_case: "Relaciona con un caso real o hipotético verosímil del sistema jurídico peruano.",
  jurisprudence:
    "Relaciona con líneas jurisprudenciales del Tribunal Constitucional o Corte Suprema cuando sea pertinente. Si no hay datos en la base, indícalo.",
  civil_code:
    "Relaciona específicamente con el Código Civil peruano, citando artículos de la base jurídica oficial.",
  custom: "Responde la consulta del estudiante sobre la página actual.",
};

export function buildTutorUserPrompt(input: {
  action: GuidedStudyTutorAction;
  customPrompt?: string;
  pageNumber: number;
  totalPages: number;
  pageText: string;
  documentTitle: string;
  courseName?: string;
  chapterTitle?: string;
  legalBaseBlock: string;
  jsonMode?: boolean;
}): string {
  const directive =
    input.action === "custom" && input.customPrompt?.trim()
      ? input.customPrompt.trim()
      : ACTION_DIRECTIVES[input.action];

  const contextParts = [
    `DOCUMENTO: ${input.documentTitle}`,
    input.courseName ? `CURSO: ${input.courseName}` : null,
    input.chapterTitle ? `CAPÍTULO ACTUAL: ${input.chapterTitle}` : null,
    `PÁGINA: ${input.pageNumber} de ${input.totalPages}`,
    "",
    "CONTENIDO DE LA PÁGINA ACTUAL:",
    input.pageText || "(Sin texto extraíble en esta página — indica al estudiante que revise visualmente el PDF.)",
    "",
    "BASE JURÍDICA OFICIAL (Perú — usar SOLO para citas normativas):",
    input.legalBaseBlock,
    "",
    `INSTRUCCIÓN: ${directive}`,
  ].filter(Boolean);

  if (input.jsonMode) {
    contextParts.push(`
Responde ÚNICAMENTE en JSON válido con esta forma:
{
  "answer": "string — respuesta principal en markdown",
  "citations": [{"norm":"string","article":"string","text":"string","updatedAt":"string"}],
  "concepts": [{"id":"c1","term":"string","type":"definicion|principio|requisito|elemento|excepcion|clasificacion","summary":"string"}],
  "questions": {
    "oral": ["string"],
    "desarrollo": ["string"],
    "test": [{"question":"string","options":["A","B","C","D"],"answerIndex":0,"explanation":"string"}]
  },
  "comprehensionCheck": "string opcional"
}
Incluye solo los campos relevantes para la acción solicitada.`);
  }

  return contextParts.join("\n");
}

export function buildAnalyzeDocumentPrompt(input: {
  title: string;
  totalPages: number;
  samplePages: Array<{ pageNumber: number; text: string }>;
}): string {
  const sampleBlock = input.samplePages
    .map((p) => `--- Página ${p.pageNumber} ---\n${p.text.slice(0, 2500)}`)
    .join("\n\n");

  return `
Analiza este documento jurídico para crear un índice de estudio progresivo.

DOCUMENTO: ${input.title}
TOTAL DE PÁGINAS: ${input.totalPages}

MUESTRA DE CONTENIDO:
${sampleBlock}

Genera JSON con esta forma exacta:
{
  "title": "string",
  "totalPages": ${input.totalPages},
  "summary": "string — descripción del documento en 2-3 oraciones",
  "topics": ["tema1", "tema2"],
  "chapters": [
    {
      "id": "ch1",
      "title": "string",
      "startPage": 1,
      "endPage": 10,
      "subtopics": ["subtema1"]
    }
  ]
}

Reglas:
- Identifica capítulos, temas y subtítulos reales del documento.
- Los capítulos deben cubrir todas las páginas sin solaparse.
- topics: lista de 5-12 temas principales del documento.
- Responde SOLO JSON válido en español.
`.trim();
}
