import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import type { GuidedStudyTutorAction } from "@/types/guided-legal-study";

export const GUIDED_STUDY_SYSTEM_ROLE = `
Eres un profesor universitario de Derecho peruano de la UNT. Enseñas página por página como en cátedra, NO como un chatbot que resume.

PRIORIDAD ABSOLUTA — ENSEÑAR DERECHO:
- Conceptos jurídicos, teorías, principios, definiciones, clasificaciones, diferencias doctrinales.
- Aplicaciones prácticas y posibles preguntas de examen.
- Relación con el ordenamiento peruano cuando corresponda.

IGNORAR O MINIMIZAR (salvo que sea indispensable para entender un concepto):
- Datos biográficos extensos de autores.
- Contexto histórico general no vinculado a un instituto jurídico.
- Referencias editoriales, agradecimientos, notas al pie irrelevantes.
- Cualquier dato secundario que no aporte al aprendizaje jurídico.

REGLA SOBRE AUTORES Y PERSONAS:
- Si aparece un autor (ej. "Juan Espinoza Espinoza"), NO dediques párrafos a su biografía.
- Máximo una línea: "Autor doctrinario peruano citado en el texto."
- Luego pasa de inmediato al contenido jurídico relevante.

PROHIBIDO:
- Resumir la página en un párrafo genérico.
- Usar markdown (**negritas**, ### títulos, listas con guiones).
- Explicar elementos secundarios con la misma profundidad que conceptos jurídicos.
- Inventar artículos de ley no presentes en la base jurídica oficial.

Audiencia: ${UNT_DERECHO_AUDIENCE}
`.trim();

export const STRUCTURED_PAGE_JSON_SCHEMA = `
Responde ÚNICAMENTE JSON válido (sin markdown) con esta forma:
{
  "pageFocus": "Una oración: qué debe aprender el estudiante en esta página",
  "secondaryMentions": [
    {"mention": "Nombre o dato secundario", "briefNote": "Una línea máximo, ej: Autor doctrinario peruano citado."}
  ],
  "keyLearning": [
    {"id": "kl1", "label": "Interpretación objetiva", "highlightId": "h1", "essential": true}
  ],
  "highlights": [
    {"id": "h1", "phrase": "fragmento exacto o casi exacto del texto de la página", "category": "concepto|definicion|teoria|principio|clasificacion|excepcion|examen|norma", "essential": true}
  ],
  "conceptCards": [
    {
      "id": "cc1",
      "concept": "Nombre del concepto jurídico",
      "explanation": "Explicación sencilla y rigurosa",
      "example": "Caso práctico peruano",
      "examImportance": "Por qué podría caer en examen",
      "peruLaw": "Relación con CC, CPP u otra norma peruana",
      "highlightId": "h1",
      "essential": true
    }
  ],
  "examMode": {
    "oral": ["pregunta oral probable"],
    "desarrollo": ["pregunta de desarrollo"],
    "test": [{"question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "..."}],
    "memorableConcepts": ["frase corta para memorizar"],
    "commonErrors": ["error frecuente del estudiante"]
  },
  "citations": [{"norm":"...","article":"...","text":"...","updatedAt":"...","sourceId":"...","sourceTitle":"...","page":"...","author":"...","fragment":"..."}],
  "comprehensionQuestion": "¿Entendiste X?"
}

Reglas del JSON:
- highlights.phrase debe ser un fragmento recuperable del texto de la página.
- Marca essential:true solo en el ~20% más importante para examen (regla 80/20).
- conceptCards: uno por idea jurídica principal (máximo 6 por página).
- secondaryMentions: solo lo secundario detectado; máximo 3 entradas breves.
- citations: SOLO fuentes autorizadas y PDF en estudio. Incluye sourceTitle, article, page, author, fragment.
`.trim();

const ACTION_DIRECTIVES: Record<GuidedStudyTutorAction, string> = {
  analyze_page:
    "Analiza la página como profesor. Detecta ideas jurídicas principales, genera tarjetas de enseñanza, resaltados, ideas clave y modo examen completo.",
  exam_essentials:
    "Filtra al 20% esencial para examen (regla 80/20). Solo keyLearning, highlights y conceptCards con essential:true. Reduce secondaryMentions al mínimo.",
  exam_mode:
    "Genera modo examen ampliado: oral, desarrollo, test, conceptos memorables y errores frecuentes. Mantén conceptCards solo si son indispensables para responder.",
  explain_page:
    "Enseña la página completa priorizando aprendizaje jurídico. Mismo formato estructurado que analyze_page.",
  examples:
    "Amplía los conceptCards con ejemplos más claros. Mantén el resto del JSON.",
  peru_law:
    "Enfatiza peruLaw en cada conceptCard y citations del ordenamiento peruano.",
  detect_concepts:
    "Prioriza highlights y keyLearning. conceptCards breves.",
  exam_questions:
    "Prioriza examMode completo.",
  verify_comprehension:
    "Genera comprehensionQuestion clara y un conceptCard de repaso del concepto central.",
  simpler:
    "Simplifica explanation de cada conceptCard sin perder rigor jurídico.",
  first_cycle:
    "Explica como primer ciclo: explanation y example más didácticos.",
  another_example:
    "Cambia example de cada conceptCard por uno nuevo y distinto.",
  real_case:
    "Enfoca example en casos reales o hipotéticos verosímiles peruanos.",
  jurisprudence:
    "Enriquece peruLaw con líneas jurisprudenciales cuando proceda; si no hay base, indícalo en examImportance.",
  civil_code:
    "Enriquece peruLaw y citations con Código Civil peruano de la base oficial.",
  custom: "Responde la consulta del estudiante en customReply (texto plano breve, sin markdown). Mantén analysis si aporta contexto.",
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
  sourcesBlock?: string;
  structured?: boolean;
}): string {
  const directive =
    input.action === "custom" && input.customPrompt?.trim()
      ? input.customPrompt.trim()
      : ACTION_DIRECTIVES[input.action];

  const contextParts = [
    `DOCUMENTO: ${input.documentTitle}`,
    input.courseName ? `CURSO: ${input.courseName}` : null,
    input.chapterTitle ? `CAPÍTULO: ${input.chapterTitle}` : null,
    `PÁGINA: ${input.pageNumber} de ${input.totalPages}`,
    "",
    "TEXTO DE LA PÁGINA (fuente para highlights.phrase):",
    input.pageText || "(Sin texto extraíble — indica al estudiante que revise el PDF visualmente.)",
    "",
    input.sourcesBlock ?? "",
    input.sourcesBlock ? "" : "BASE JURÍDICA OFICIAL (citas normativas):",
    input.sourcesBlock ? "" : input.legalBaseBlock,
    "",
    `INSTRUCCIÓN: ${directive}`,
  ].filter(Boolean);

  if (input.structured) {
    if (input.action === "custom") {
      contextParts.push(`
Responde JSON:
{"customReply": "respuesta breve en texto plano", "analysis": null}
O si conviene enseñar con tarjetas: incluye analysis con el schema completo y customReply vacío.
${STRUCTURED_PAGE_JSON_SCHEMA}`);
    } else {
      contextParts.push(STRUCTURED_PAGE_JSON_SCHEMA);
    }
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
Prioriza temas jurídicos sobre datos biográficos o contexto editorial.

DOCUMENTO: ${input.title}
TOTAL DE PÁGINAS: ${input.totalPages}

MUESTRA:
${sampleBlock}

JSON exacto:
{
  "title": "string",
  "totalPages": ${input.totalPages},
  "summary": "2 oraciones sobre el contenido jurídico del documento",
  "topics": ["tema jurídico 1"],
  "chapters": [{"id":"ch1","title":"string","startPage":1,"endPage":10,"subtopics":["subtema"]}]
}
`.trim();
}
