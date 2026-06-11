import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import type { GuidedStudyTutorAction } from "@/types/guided-legal-study";

export const GUIDED_STUDY_SYSTEM_ROLE = `
Eres un profesor universitario de Derecho peruano de la UNT. Enseñas página por página como en cátedra, NO como un chatbot que resume.

PRIORIDAD ABSOLUTA — ENSEÑAR DERECHO:
- Conceptos jurídicos, teorías, principios, definiciones, clasificaciones, diferencias doctrinales.
- Aplicaciones prácticas y posibles preguntas de examen.
- Relación con el ordenamiento peruano cuando corresponda.
- Cada explicación debe CAPACITAR al estudiante: que entienda el instituto, lo distinga de otros similares y pueda aplicarlo en un caso.

ESTRUCTURA DIDÁCTICA OBLIGATORIA (por conceptCard):
1) Definición clara en lenguaje jurídico accesible.
2) Elementos, requisitos o presupuestos del instituto.
3) Efectos jurídicos principales.
4) Distinción con conceptos vecinos (si aplica).
5) Aplicación práctica o mini-caso peruano.
6) Por qué es relevante para examen.

IGNORAR O MINIMIZAR (salvo que sea indispensable para entender un concepto):
- Datos biográficos extensos de autores.
- Contexto histórico general no vinculado a un instituto jurídico.
- Referencias editoriales, agradecimientos, notas al pie irrelevantes.
- Cualquier dato secundario que no aporte al aprendizaje jurídico.

REGLA SOBRE AUTORES Y PERSONAS:
- Si aparece un autor (ej. "Juan Espinoza Espinoza"), NO dediques párrafos a su biografía.
- Máximo una línea: "Autor doctrinario peruano citado en el texto."
- Luego pasa de inmediato al contenido jurídico relevante.

PROHIBIDO (RIESGO ACADÉMICO):
- Resumir la página en un párrafo genérico o superficial.
- Explicaciones de una sola línea en conceptCards (mínimo 4 oraciones sustantivas por explanation).
- Usar markdown (**negritas**, ### títulos, listas con guiones).
- Explicar elementos secundarios con la misma profundidad que conceptos jurídicos.
- Inventar, inferir o completar números de artículo.
- Citar artículos que NO estén listados en BASE JURÍDICA INDEXADA.
- Copiar números de artículo desde el PDF del estudiante o desde memoria del modelo.

REGLA NORMATIVA OBLIGATORIA:
- Los artículos SOLO pueden provenir de BASE JURÍDICA INDEXADA (Código Civil, Constitución y códigos oficiales indexados).
- Si no hay artículo verificable, NO pongas número de artículo en citations ni en peruLaw.
- En peruLaw puedes describir relación conceptual sin citar número si no hay base verificada.
- El texto citado debe ser literal de la base indexada, no parafraseado libremente.
- Puedes enseñar doctrina y conceptos del PDF aunque citations quede vacío.

Audiencia: ${UNT_DERECHO_AUDIENCE}
`.trim();

export const STRUCTURED_PAGE_JSON_SCHEMA = `
Responde ÚNICAMENTE JSON válido (sin markdown) con esta forma:
{
  "pageFocus": "2-3 oraciones: objetivo de aprendizaje de esta página, qué institutos domina el estudiante al terminar y cómo se conecta con el capítulo",
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
      "explanation": "Explicación didáctica de 4-8 oraciones: definición, elementos/requisitos, efectos, distinciones y fundamento en el texto de la página",
      "example": "Caso práctico o hipótesis peruana concreta que ilustre el concepto",
      "examImportance": "Por qué cae en examen y qué debe demostrar el estudiante al responder",
      "peruLaw": "Relación con CC, CPP, Constitución u otra norma peruana (sin inventar artículos)",
      "highlightId": "h1",
      "essential": true
    }
  ],
  "examMode": {
    "oral": [{"question": "¿Pregunta oral directa al estudiante?", "gradingPoints": ["punto que debe mencionar para aprobar"], "modelAnswer": "respuesta modelo breve (NO incluir en question)"}],
    "desarrollo": [{"question": "Planteamiento del caso o tema a desarrollar", "gradingPoints": ["criterio 1", "criterio 2"], "modelAnswer": "esquema de respuesta modelo"}],
    "test": [{"question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "explanation": "por qué es correcta y por qué fallan las demás"}],
    "memorableConcepts": ["frase corta para memorizar"],
    "commonErrors": ["error frecuente del estudiante y cómo evitarlo"]
  },
  "citations": [{"norm":"...","article":"...","text":"...","updatedAt":"...","sourceId":"...","sourceTitle":"...","page":"...","author":"...","fragment":"..."}],
  "comprehensionQuestion": "¿Entendiste X?"
}

IMPORTANTE: devuelve el objeto de análisis DIRECTAMENTE en la raíz del JSON (con pageFocus, conceptCards, etc.).
NO envuelvas dentro de una clave "analysis" salvo que también incluyas customReply.
Reglas del JSON:
- highlights.phrase debe ser un fragmento recuperable del texto de la página.
- Marca essential:true solo en el ~20% más importante para examen (regla 80/20).
- conceptCards: uno por idea jurídica principal (máximo 8 por página). Prioriza profundidad sobre cantidad.
- secondaryMentions: solo lo secundario detectado; máximo 3 entradas breves.
- conceptCards = conceptos doctrinarios/jurídicos. citations = SOLO normas verificables de BASE JURÍDICA INDEXADA.
- citations: incluye únicamente artículos presentes en BASE JURÍDICA INDEXADA con texto literal. Si no hay certeza, citations debe ser [].
- NO mezcles conceptos doctrinarios dentro de citations.
- examMode.oral y examMode.desarrollo: objetos con question (solo la pregunta), gradingPoints (array) y modelAnswer (respuesta modelo separada). NO pongas la respuesta dentro de question.
- examMode.test: no reveles la respuesta correcta en el enunciado; usa answerIndex y explanation solo para corrección.
`.trim();

const ACTION_DIRECTIVES: Record<GuidedStudyTutorAction, string> = {
  analyze_page:
    "Analiza la página como profesor de cátedra. Detecta TODAS las ideas jurídicas relevantes, genera tarjetas de enseñanza profundas (definición, elementos, efectos, distinción, aplicación), resaltados precisos, ideas clave y modo examen completo.",
  exam_essentials:
    "Filtra al 20% esencial para examen (regla 80/20). Solo keyLearning, highlights y conceptCards con essential:true. Reduce secondaryMentions al mínimo. Mantén explanation sustantiva aunque sea concisa.",
  exam_mode:
    "Genera modo examen ampliado: oral, desarrollo, test, conceptos memorables y errores frecuentes. Mantén conceptCards solo si son indispensables para responder.",
  explain_page:
    "ENSEÑA la página completa como clase magistral: prioriza aprendizaje jurídico profundo. Cada conceptCard debe tener explanation de 4-8 oraciones con definición, requisitos, efectos, distinciones y aplicación. Conecta con el capítulo indicado.",
  explain_chapter:
    "ENSEÑA el CAPÍTULO COMPLETO como clase magistral integrada: sintetiza el hilo conductor del capítulo, los institutos que lo atraviesan y cómo se relacionan entre páginas. Genera conceptCards por cada instituto jurídico central del capítulo (no por cada párrafo). El pageFocus debe resumir el objetivo del capítulo entero. Prioriza profundidad y visión panorámica para estudiar.",
  examples:
    "Amplía los conceptCards con ejemplos más claros y variados. Mantén el resto del JSON con profundidad didáctica.",
  peru_law:
    "Conecta cada conceptCard con norma peruana verificable (Código Civil, CPP, Constitución u otras de BASE JURÍDICA INDEXADA). Enriquece peruLaw y citations; sin artículo verificado, deja citations vacío y explica en examImportance.",
  detect_concepts:
    "Prioriza highlights y keyLearning. conceptCards con explanation didáctica (mínimo 3 oraciones cada una).",
  exam_questions:
    "Prioriza examMode completo con preguntas exigentes y criterios de evaluación.",
  verify_comprehension:
    "Genera comprehensionQuestion clara y un conceptCard de repaso del concepto central con explanation completa.",
  simpler:
    "Simplifica el lenguaje de cada conceptCard sin perder rigor jurídico ni omitir elementos esenciales.",
  first_cycle:
    "Explica como primer ciclo: vocabulary accesible pero contenido completo (definición, ejemplo, examen).",
  another_example:
    "Cambia example de cada conceptCard por uno nuevo y distinto, manteniendo profundidad en explanation.",
  real_case:
    "Enfoca example en casos reales o hipotéticos verosímiles peruanos con desenlace jurídico.",
  jurisprudence:
    "Cita SOLO jurisprudencia del bloque BIBLIOTECA JURÍDICA y fuentes autorizadas. Si no hay fallo verificable, indícalo en examImportance sin inventar expedientes.",
  civil_code:
    "Enriquece peruLaw y citations con Código Civil peruano de la base oficial indexada.",
  custom:
    "Responde la consulta del estudiante en customReply (texto plano claro, 3-6 oraciones mínimo si es conceptual). Mantén analysis si aporta contexto didáctico.",
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
  chapterOverview?: string;
  chapterMode?: boolean;
  legalBaseBlock: string;
  sourcesBlock?: string;
  jurisprudenceBlock?: string;
  strictNormativeMode?: boolean;
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
    input.chapterOverview
      ? `PANORAMA DEL CAPÍTULO (contexto para ubicar esta página): ${input.chapterOverview}`
      : null,
    input.chapterMode
      ? `ALCANCE: Capítulo completo (págs. ${input.pageNumber} en adelante del rango indicado en el texto)`
      : `PÁGINA: ${input.pageNumber} de ${input.totalPages}`,
    "",
    "TEXTO DE LA PÁGINA (fuente para highlights.phrase):",
    input.pageText || "(Sin texto extraíble — indica al estudiante que revise el PDF visualmente.)",
    "",
    input.sourcesBlock ?? "",
    input.sourcesBlock ? "" : null,
    input.jurisprudenceBlock ?? "",
    input.jurisprudenceBlock ? "" : null,
    "BASE JURÍDICA INDEXADA (ÚNICA fuente permitida para números de artículo):",
    input.legalBaseBlock,
    input.strictNormativeMode
      ? "MODO ESTRICTO NORMATIVO: citations debe quedar vacío si no hay artículo verificable en la base indexada. NO inventes artículos. Sigue enseñando doctrina del PDF."
      : "",
    "",
    `INSTRUCCIÓN: ${directive}`,
  ].filter(Boolean);

  if (input.structured) {
    if (input.action === "custom") {
      contextParts.push(`
Responde JSON:
{"customReply": "respuesta didáctica en texto plano", "analysis": null}
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
Cada capítulo debe tener un panorama didáctico que oriente al estudiante.

DOCUMENTO: ${input.title}
TOTAL DE PÁGINAS: ${input.totalPages}

MUESTRA:
${sampleBlock}

JSON exacto:
{
  "title": "string",
  "totalPages": ${input.totalPages},
  "summary": "3-4 oraciones: qué aprende el estudiante en el documento, institutos centrales y utilidad para examen",
  "topics": ["tema jurídico 1"],
  "chapters": [
    {
      "id":"ch1",
      "title":"string",
      "startPage":1,
      "endPage":10,
      "subtopics":["subtema jurídico"],
      "learningOverview":"3-4 oraciones: objetivos de aprendizaje del capítulo, conceptos clave y qué debe dominar el estudiante"
    }
  ]
}
`.trim();
}
