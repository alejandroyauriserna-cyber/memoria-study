import { generateGeminiText } from "@/lib/ai/gemini-text";
import { UNT_DERECHO_AUDIENCE } from "@/lib/ai/prompts";
import { env } from "@/lib/env";
import type { CuadernoDictionaryResponse } from "@/types/cuaderno";

const SECTION_IDS = [
  "definicion_simple",
  "definicion_juridica",
  "ejemplo_practico",
  "relacion_curso",
  "articulos",
  "jurisprudencia",
  "error_comun",
  "pregunta_examen",
] as const;

export async function generateCuadernoDictionaryEntry(input: {
  term: string;
  studyContext: string;
  courseName: string;
}): Promise<CuadernoDictionaryResponse> {
  const hasPdf = input.studyContext.includes("CONTENIDO DEL PDF VINCULADO");
  const hasNotes = input.studyContext.includes("APUNTES DEL ESTUDIANTE");

  const sourceRule = hasPdf
    ? "Prioriza el PDF vinculado y los apuntes. Cita artículos solo si aparecen en el contexto o son doctrina consolidada peruana."
    : hasNotes
      ? "Usa los apuntes del estudiante como contexto principal. Complementa con conocimiento jurídico general peruano (Código Civil, doctrina UNT)."
      : "Responde con conocimiento jurídico general peruano para estudiantes UNT. No bloquees la consulta por falta de PDF.";

  const prompt = `Eres un diccionario jurídico académico para ${UNT_DERECHO_AUDIENCE}.
Curso actual: ${input.courseName}.
Término consultado: «${input.term}».

${sourceRule}

CONTEXTO DE ESTUDIO:
${input.studyContext}

Responde SOLO en JSON con esta estructura exacta:
{
  "term": "${input.term}",
  "sections": [
    { "id": "definicion_simple", "title": "Definición simple", "content": "..." },
    { "id": "definicion_juridica", "title": "Definición jurídica", "content": "..." },
    { "id": "ejemplo_practico", "title": "Ejemplo práctico", "content": "..." },
    { "id": "relacion_curso", "title": "Relación con el curso", "content": "..." },
    { "id": "articulos", "title": "Artículos relacionados", "content": "..." },
    { "id": "jurisprudencia", "title": "Jurisprudencia relevante", "content": "Si no hay en el contexto, indica doctrina o jurisprudencia general aplicable en Perú." },
    { "id": "error_comun", "title": "Error común de estudiantes", "content": "..." },
    { "id": "pregunta_examen", "title": "Cómo podría preguntarlo un profesor", "content": "..." }
  ]
}

Reglas:
- Español jurídico peruano, tono universitario.
- Cada content: 2-4 oraciones claras.
- No uses emojis.`;

  if (!env.geminiApiKey) {
    return fallbackDictionary(input.term, input.courseName);
  }

  try {
    const raw = await generateGeminiText({
      prompt,
      temperature: 0.35,
      json: true,
    });

    const parsed = parseDictionaryJson(raw);
    return normalizeDictionary(parsed, input.term);
  } catch {
    return fallbackDictionary(input.term, input.courseName);
  }
}

function parseDictionaryJson(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON inválido");
  return JSON.parse(cleaned.slice(start, end + 1)) as CuadernoDictionaryResponse;
}

function normalizeDictionary(
  parsed: CuadernoDictionaryResponse,
  term: string,
): CuadernoDictionaryResponse {
  const byId = new Map(parsed.sections?.map((s) => [s.id, s]) ?? []);
  const titles: Record<string, string> = {
    definicion_simple: "Definición simple",
    definicion_juridica: "Definición jurídica",
    ejemplo_practico: "Ejemplo práctico",
    relacion_curso: "Relación con el curso",
    articulos: "Artículos relacionados",
    jurisprudencia: "Jurisprudencia relevante",
    error_comun: "Error común de estudiantes",
    pregunta_examen: "Cómo podría preguntarlo un profesor",
  };

  const sections = SECTION_IDS.map((id) => {
    const existing = byId.get(id);
    return {
      id,
      title: titles[id],
      content: existing?.content?.trim() || "Consulta tus apuntes o material del curso para profundizar este punto.",
    };
  });

  return { term: parsed.term?.trim() || term, sections };
}

function fallbackDictionary(term: string, courseName: string): CuadernoDictionaryResponse {
  return {
    term,
    sections: [
      {
        id: "definicion_simple",
        title: "Definición simple",
        content: `«${term}» es un concepto central en ${courseName}. Revisa tus apuntes de clase para la definición exacta según tu profesor.`,
      },
      {
        id: "definicion_juridica",
        title: "Definición jurídica",
        content: `En Derecho peruano, «${term}» se estudia en el marco de ${courseName}. Consulta el Código Civil y la doctrina nacional.`,
      },
      {
        id: "ejemplo_practico",
        title: "Ejemplo práctico",
        content: "Relaciona el concepto con un caso concreto visto en clase o en tu material de estudio.",
      },
      {
        id: "relacion_curso",
        title: "Relación con el curso",
        content: `Este término se vincula directamente con los temas de ${courseName}.`,
      },
      {
        id: "articulos",
        title: "Artículos relacionados",
        content: "Identifica los artículos del Código Civil o normas especiales mencionados en tus apuntes.",
      },
      {
        id: "jurisprudencia",
        title: "Jurisprudencia relevante",
        content: "Busca precedentes de la Corte Suprema o tribunales superiores relacionados con el tema.",
      },
      {
        id: "error_comun",
        title: "Error común de estudiantes",
        content: "Evita confundir definiciones similares; contrasta con conceptos vecinos del mismo bloque temático.",
      },
      {
        id: "pregunta_examen",
        title: "Cómo podría preguntarlo un profesor",
        content: `«Explique el concepto de ${term} y su importancia en ${courseName}.»`,
      },
    ],
  };
}
