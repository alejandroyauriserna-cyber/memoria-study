import { env } from "@/lib/env";
import type { RubricAnalysis } from "@/lib/organizers/visual-prompt-types";

function parseJson(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON inválido");
  return JSON.parse(cleaned.slice(start, end + 1)) as Partial<RubricAnalysis> & {
    requestedFormat?: string;
  };
}

function heuristicRubricAnalysis(text: string, fileName?: string): RubricAnalysis {
  const lower = text.toLowerCase();

  const formatPatterns: Array<{ re: RegExp; label: string }> = [
    { re: /mapa conceptual/i, label: "Mapa conceptual" },
    { re: /mapa mental/i, label: "Mapa mental" },
    { re: /infograf[ií]a/i, label: "Infografía" },
    { re: /l[ií]nea de tiempo|cronolog[ií]a/i, label: "Línea de tiempo" },
    { re: /cuadro comparativo|tabla comparativa/i, label: "Cuadro comparativo" },
    { re: /presentaci[oó]n|diapositivas|ppt/i, label: "Presentación" },
    { re: /organizador visual/i, label: "Organizador visual" },
  ];

  const requestedFormat = formatPatterns.find((p) => p.re.test(text))?.label;

  const criteria: string[] = [];
  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim();
    if (trimmed.length < 4 || trimmed.length > 120) continue;
    if (/criterio|rubrica|rúbrica|evaluaci[oó]n|indicador|puntaje|puntos|escala/i.test(trimmed)) {
      criteria.push(trimmed);
    }
  }

  const scoringLevels = text
    .split(/\n+/)
    .filter((line) => /\d+\s*puntos?|\d+\s*pts|excelente|logrado|en proceso|inicio/i.test(line))
    .slice(0, 8);

  return {
    fileName,
    requestedFormat,
    evaluationCriteria: criteria.slice(0, 10),
    scoringLevels,
    visualRequirements: [
      lower.includes("creatividad") ? "Creatividad visual" : "",
      lower.includes("claridad") ? "Claridad en la presentación" : "",
      lower.includes("jerarqu") ? "Jerarquía visual" : "",
      lower.includes("imagen") || lower.includes("ilustraci") ? "Uso de imágenes o ilustraciones" : "",
      lower.includes("color") ? "Uso de color" : "",
      lower.includes("organiz") ? "Organización del contenido" : "",
    ].filter(Boolean),
    structureRequirements: [
      requestedFormat ? `Formato solicitado: ${requestedFormat}` : "",
      lower.includes("introducci") ? "Incluir introducción" : "",
      lower.includes("conclusi") ? "Incluir conclusión" : "",
      lower.includes("ejemplo") ? "Incluir ejemplos" : "",
      lower.includes("referencia") ? "Incluir referencias" : "",
    ].filter(Boolean),
    conceptCountHint: /\d+\s*(conceptos|temas|elementos)/i.exec(text)?.[0],
    depthRequired: lower.includes("profund") ? "Profundidad conceptual requerida" : undefined,
    creativityRequired: /creatividad/i.test(text),
    examplesRequired: /ejemplo/i.test(text),
    imagesRequired: /imagen|ilustraci|icono/i.test(text),
    hierarchyRequired: /jerarqu/i.test(text),
    clarityRequired: /claridad/i.test(text),
    comparisonsRequired: /comparaci|versus|diferencia/i.test(text),
  };
}

async function analyzeWithGemini(text: string, fileName?: string): Promise<RubricAnalysis> {
  const prompt = `Analiza esta rúbrica académica de Derecho (Perú) y extrae requisitos para un trabajo visual.

RÚBRICA:
${text.slice(0, 6000)}

Identifica:
- requestedFormat: mapa conceptual | mapa mental | infografía | línea de tiempo | cuadro comparativo | presentación | organizador visual | otro
- evaluationCriteria: criterios de evaluación
- scoringLevels: niveles o puntajes
- visualRequirements: requisitos visuales (creatividad, claridad, jerarquía, imágenes, color...)
- structureRequirements: estructura solicitada
- conceptCountHint: cantidad de conceptos si se menciona
- depthRequired: profundidad exigida
- creativityRequired, examplesRequired, imagesRequired, hierarchyRequired, clarityRequired, comparisonsRequired: boolean

Devuelve SOLO JSON con esos campos.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    return heuristicRubricAnalysis(text, fileName);
  }

  const payload = await response.json();
  const raw = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof raw !== "string") {
    return heuristicRubricAnalysis(text, fileName);
  }

  try {
    const parsed = parseJson(raw);
    const base = heuristicRubricAnalysis(text, fileName);
    return {
      ...base,
      ...parsed,
      fileName,
      evaluationCriteria: parsed.evaluationCriteria?.length
        ? parsed.evaluationCriteria
        : base.evaluationCriteria,
      scoringLevels: parsed.scoringLevels?.length ? parsed.scoringLevels : base.scoringLevels,
      visualRequirements: parsed.visualRequirements?.length
        ? parsed.visualRequirements
        : base.visualRequirements,
      structureRequirements: parsed.structureRequirements?.length
        ? parsed.structureRequirements
        : base.structureRequirements,
      creativityRequired: parsed.creativityRequired ?? base.creativityRequired,
      examplesRequired: parsed.examplesRequired ?? base.examplesRequired,
      imagesRequired: parsed.imagesRequired ?? base.imagesRequired,
      hierarchyRequired: parsed.hierarchyRequired ?? base.hierarchyRequired,
      clarityRequired: parsed.clarityRequired ?? base.clarityRequired,
      comparisonsRequired: parsed.comparisonsRequired ?? base.comparisonsRequired,
    };
  } catch {
    return heuristicRubricAnalysis(text, fileName);
  }
}

export async function analyzeAcademicRubric(
  rubricText: string,
  fileName?: string,
): Promise<RubricAnalysis> {
  if (!rubricText.trim()) {
    throw new Error("La rúbrica está vacía.");
  }

  if (env.geminiApiKey) {
    return analyzeWithGemini(rubricText, fileName);
  }

  return heuristicRubricAnalysis(rubricText, fileName);
}
