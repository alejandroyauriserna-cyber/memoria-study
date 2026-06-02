import { analyzeAcademicRubric } from "@/lib/ai/analyze-academic-rubric";
import { extractInfographicTopics } from "@/lib/ai/build-academic-infographic-prompt";
import { env } from "@/lib/env";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import {
  MODE_PROMPT_CONFIG,
  UNIVERSAL_QUALITY_BLOCK,
  buildFinalPrompt,
  creativityLabel,
  modeLabel,
} from "@/lib/organizers/visual-prompt-mode-config";
import type {
  DocumentVisualAnalysis,
  RubricAnalysis,
  VisualCreativityLevel,
  VisualPremiumPrompt,
  VisualPromptMode,
} from "@/lib/organizers/visual-prompt-types";

function unique(values: Array<string | undefined | null>, limit = 12): string[] {
  return [...new Set(values.map((v) => v?.trim()).filter(Boolean) as string[])].slice(0, limit);
}

const SCENE_RULES: Record<
  VisualPromptMode,
  Array<{ match: RegExp; metaphor: string }>
> = {
  infographic: [
    { match: /buena fe|honestidad/i, metaphor: "personas negociando con honestidad, apretón de manos cálido iluminado" },
    { match: /contrato|contratación|negocio jurídico/i, metaphor: "documento legal siendo firmado con pluma en escena ilustrada" },
    { match: /nulidad/i, metaphor: "contrato roto en pedazos sobre mesa judicial, escena dramática ilustrada" },
    { match: /juez|tribunal|magistrado/i, metaphor: "tribunal peruano con balanza de la justicia, ilustración premium" },
    { match: /código civil|código|civil/i, metaphor: "gran libro jurídico dorado con artículos visibles, estilo atlas" },
    { match: /interpretación|hermenéutica/i, metaphor: "juez con lupa analizando documentos legales en escena educativa" },
  ],
  memorization: [
    { match: /nulidad/i, metaphor: "CONTRATO ROTO EXPLOTANDO con chispas y humo — imposible de olvidar" },
    { match: /buena fe|honestidad/i, metaphor: "JUEZ o negociador con HALO DE LUZ dorada radiante" },
    { match: /interpretación|hermenéutica/i, metaphor: "DETECTIVE JURÍDICO con lupa GIGANTE investigando documentos" },
    { match: /obligación|obligacion/i, metaphor: "CADENA LUMINOSA imposible de romper conectando dos sujetos" },
    { match: /código civil|código|civil/i, metaphor: "LIBRO JURÍDICO GIGANTE flotando con páginas que brillan" },
    { match: /anulabilidad/i, metaphor: "contrato con GRIETAS NEÓN pulsantes y sello de advertencia gigante" },
    { match: /voluntad|consentimiento/i, metaphor: "personas con GESTOS EXAGERADOS expresando decisión con rayos de energía" },
    { match: /jurisprudencia|precedente|fallo|sentencia/i, metaphor: "TORRE de expedientes apilados hasta el cielo con sello oficial brillante" },
  ],
  exam: [
    { match: /nulidad/i, metaphor: "etiqueta roja «NULIDAD» + definición breve en texto grande" },
    { match: /buena fe|honestidad/i, metaphor: "badge «DEFINICIÓN» + texto legible de buena fe" },
    { match: /art\.|artículo|articulo/i, metaphor: "recuadro «Art.» con número de artículo destacado en rojo" },
    { match: /excepción|excepcion|salvo/i, metaphor: "fila «EXCEPCIÓN» resaltada en rojo con contraste máximo" },
    { match: /interpretación|hermenéutica/i, metaphor: "columna comparativa: interpretación literal vs sistemática" },
    { match: /contrato|contratación/i, metaphor: "definición + elementos esenciales en lista numerada" },
  ],
  legal_premium: [
    { match: /juez|tribunal|magistrado/i, metaphor: "juez con toga en tribunal majestuoso, iluminación sobria" },
    { match: /jurisprudencia|precedente|fallo|sentencia/i, metaphor: "expediente numerado con sello oficial sobre escritorio de madera" },
    { match: /código civil|código|civil/i, metaphor: "código jurídico encuadernado en cuero con tipografía serif" },
    { match: /contrato|contratación/i, metaphor: "documento legal formal con pluma estilográfica y sello notarial" },
    { match: /doctrina/i, metaphor: "libros de doctrina apilados en biblioteca jurídica clásica" },
  ],
  jurisprudence: [
    { match: /jurisprudencia|precedente|fallo|sentencia/i, metaphor: "nodo de línea de tiempo con nombre de sentencia, fecha y ratio decidendi" },
    { match: /nulidad|anulabilidad/i, metaphor: "precedente histórico con flecha de evolución doctrinal hacia fallo posterior" },
    { match: /interpretación|hermenéutica/i, metaphor: "cadena de precedentes conectados mostrando cambio interpretativo" },
    { match: /tribunal constitucional|corte suprema/i, metaphor: "nodo principal del tribunal con expediente emblemático" },
  ],
  professor: [
    { match: /./i, metaphor: "ilustración alineada a los criterios de la rúbrica del docente" },
  ],
};

function inferVisualScenes(
  concepts: string[],
  mode: VisualPromptMode,
): DocumentVisualAnalysis["visualScenes"] {
  const rules = SCENE_RULES[mode];
  const scenes: DocumentVisualAnalysis["visualScenes"] = [];

  for (const concept of concepts) {
    const rule = rules.find((entry) => entry.match.test(concept));
    const fallbackByMode: Record<VisualPromptMode, string> = {
      infographic: `mini escena ilustrada premium de «${concept}» en contexto jurídico peruano`,
      memorization: `metáfora visual EXAGERADA e INOLVIDABLE para «${concept}» con colores neón`,
      exam: `ficha de repaso con definición legible de «${concept}» + artículo si aplica`,
      legal_premium: `representación formal y sobria de «${concept}» estilo manual jurídico`,
      jurisprudence: `nodo de precedente o sentencia relacionado con «${concept}» en línea de tiempo`,
      professor: `elemento visual que cumple criterio de rúbrica sobre «${concept}»`,
    };

    scenes.push({
      concept,
      visualMetaphor: rule?.metaphor ?? fallbackByMode[mode],
    });
    if (scenes.length >= 14) break;
  }

  return scenes;
}

export function extractDocumentVisualAnalysis(
  content: OrganizerContent,
  mode: VisualPromptMode = "infographic",
): DocumentVisualAnalysis {
  const { centralTopic, subtopics } = extractInfographicTopics(content);

  const concepts = unique([
    ...(content.conceptMap?.nodes ?? []),
    ...(content.hierarchy?.branches ?? []),
    ...(content.reviewBundle?.keyConcepts ?? []),
    ...(content.aiAnalysis?.conceptsDetected ?? []),
    ...(content.visualSummary?.conceptCards?.map((c) => c.title) ?? []),
    ...subtopics,
  ]);

  const definitions = unique(
    content.visualSummary?.conceptCards?.map((c) => `${c.title}: ${c.description}`) ?? [],
    10,
  );

  const principles = unique(
    concepts.filter((c) => /principio|buena fe|legalidad|igualdad|proporcionalidad/i.test(c)),
    8,
  );

  const norms = unique(
    concepts.filter((c) => /ley|código|decreto|norma|reglamento/i.test(c)),
    8,
  );

  const articles = unique(
    [
      ...(content.visualSummary?.legalTables?.flatMap((t) => t.rows.flat()) ?? []),
      ...(content.flowProcess?.nodes?.map((n) => n.legalBasis).filter(Boolean) ?? []),
      ...concepts.filter((c) => /art\.|artículo|articulo|inciso/i.test(c)),
    ],
    10,
  );

  const jurisprudence = unique(
    concepts.filter((c) => /jurisprudencia|precedente|fallo|sentencia|caso/i.test(c)),
    8,
  );

  const comparisons = unique(
    content.visualSummary?.comparisons?.map((c) => `${c.title}: ${c.left} vs ${c.right}`) ?? [],
    6,
  );

  const practicalCases = unique(
    [
      ...(content.reviewBundle?.examQuestions?.map((q) => q.question) ?? []),
      ...(content.reviewBundle?.questions?.filter((q) => q.type === "caso_practico").map((q) => q.question) ?? []),
      ...(content.flashcards?.slice(0, 4).map((f) => f.question) ?? []),
    ],
    8,
  );

  const examPriorities = unique(
    [
      ...(content.reviewBundle?.keyConcepts ?? []),
      ...(content.aiAnalysis?.studyFocus ? [content.aiAnalysis.studyFocus] : []),
      ...(content.reviewBundle?.questions?.slice(0, 6).map((q) => q.question) ?? []),
    ],
    10,
  );

  const conceptualRelations = unique(content.aiAnalysis?.relationsFound ?? [], 10);

  const authors = unique(
    [
      ...concepts.filter((c) =>
        /autor|doctrinador|tratadista|escrito por|según .* doctrina/i.test(c),
      ),
      ...(content.summary?.match(/(?:Dr\.|Dra\.|Prof\.)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*/g) ?? []),
    ],
    8,
  );

  return {
    centralTopic,
    subtopics,
    concepts,
    definitions,
    principles,
    norms,
    articles,
    jurisprudence,
    authors,
    doctrine: unique(content.aiAnalysis?.recommendations ?? [], 6),
    comparisons,
    exceptions: unique(
      concepts.filter((c) => /excepción|excepcion|salvo|excepto/i.test(c)),
      6,
    ),
    practicalCases,
    conceptualRelations,
    examPriorities,
    visualScenes: inferVisualScenes([centralTopic, ...concepts, ...subtopics], mode),
  };
}

export function buildPromptExplanation(
  analysis: DocumentVisualAnalysis,
  mode: VisualPromptMode,
  rubric?: RubricAnalysis | null,
  creativityLevel?: VisualCreativityLevel,
  studentPersonalization?: string | null,
): string[] {
  const lines: string[] = [];

  lines.push(`Se detectaron ${analysis.concepts.length} conceptos principales.`);

  if (analysis.subtopics.length) {
    lines.push(
      `Se organizaron ${analysis.subtopics.length} subtemas alrededor de «${analysis.centralTopic}».`,
    );
  }

  if (analysis.articles.length) {
    lines.push(`Se identificaron ${analysis.articles.length} artículos relevantes.`);
  }

  if (analysis.comparisons.length) {
    lines.push(
      `Se detectaron ${analysis.comparisons.length} ${analysis.comparisons.length === 1 ? "comparación doctrinal" : "comparaciones doctrinales"}.`,
    );
  }

  if (analysis.jurisprudence.length) {
    lines.push("Se encontró jurisprudencia en el material.");
  }

  if (analysis.authors.length) {
    lines.push(`Se identificaron ${analysis.authors.length} referencias doctrinales o autores.`);
  }

  if (analysis.exceptions.length && mode === "exam") {
    lines.push(`Se resaltaron ${analysis.exceptions.length} excepciones clave para repaso de examen.`);
  }

  lines.push(`Se aplicó el modo ${modeLabel(mode)}.`);

  if (creativityLevel) {
    lines.push(`Se aplicó nivel de creatividad ${creativityLabel(creativityLevel)}.`);
  }

  if (studentPersonalization?.trim()) {
    lines.push("Se incorporaron instrucciones personalizadas.");
  }

  if (rubric) {
    if (rubric.requestedFormat) {
      lines.push(`La rúbrica solicita formato: ${rubric.requestedFormat}.`);
    }
    if (rubric.creativityRequired) {
      lines.push("La rúbrica exige creatividad.");
    }
    if (rubric.clarityRequired) {
      lines.push("La rúbrica exige claridad en la presentación.");
    }
    if (rubric.hierarchyRequired) {
      lines.push("La rúbrica exige jerarquía visual clara.");
    }
    if (rubric.examplesRequired) {
      lines.push("La rúbrica exige ejemplos.");
    }
    if (rubric.imagesRequired) {
      lines.push("La rúbrica exige uso de imágenes o ilustraciones.");
    }
    if (rubric.comparisonsRequired) {
      lines.push("La rúbrica prioriza comparaciones visuales.");
    }
    if (rubric.evaluationCriteria.length) {
      lines.push(
        `Se alinearon ${rubric.evaluationCriteria.length} criterios de evaluación del docente.`,
      );
    }
    if (rubric.conceptCountHint) {
      lines.push(`La rúbrica indica: ${rubric.conceptCountHint}.`);
    }
    if (rubric.depthRequired) {
      lines.push(`Profundidad requerida: ${rubric.depthRequired}.`);
    }
    lines.push("Se consideró la rúbrica del docente.");
  } else if (mode === "professor") {
    lines.push("Adjunta la rúbrica del docente para personalizar el prompt según sus criterios.");
  }

  return lines;
}

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
  return JSON.parse(cleaned.slice(start, end + 1)) as {
    title?: string;
    mode?: VisualPromptMode;
    prompt?: string;
    explanation?: string[];
  };
}

function rubricBlock(rubric: RubricAnalysis) {
  return `
RÚBRICA DEL DOCENTE (CAPA ADICIONAL — CUMPLIR SI APLICA AL MODO):
Formato solicitado: ${rubric.requestedFormat ?? "Según rúbrica adjunta"}
Criterios de evaluación:
${rubric.evaluationCriteria.map((c) => `- ${c}`).join("\n") || "- Ver rúbrica"}
Puntajes / niveles:
${rubric.scoringLevels.map((s) => `- ${s}`).join("\n") || "- Según escala de la rúbrica"}
Requisitos visuales:
${rubric.visualRequirements.map((r) => `- ${r}`).join("\n") || "- Creatividad, claridad y diseño profesional"}
Estructura solicitada:
${rubric.structureRequirements.map((s) => `- ${s}`).join("\n") || "- Estructura académica clara"}
${rubric.conceptCountHint ? `Cantidad de conceptos: ${rubric.conceptCountHint}` : ""}
${rubric.depthRequired ? `Profundidad: ${rubric.depthRequired}` : ""}
`.trim();
}

function buildModeContentBlock(analysis: DocumentVisualAnalysis, mode: VisualPromptMode): string {
  const sceneList = analysis.visualScenes
    .map((s) => `• ${s.concept} → ${s.visualMetaphor}`)
    .join("\n");

  switch (mode) {
    case "exam":
      return `
DEFINICIONES PARA REPASO:
${analysis.definitions.slice(0, 8).map((d) => `- ${d}`).join("\n") || analysis.concepts.slice(0, 8).map((c) => `- ${c}`).join("\n")}

ARTÍCULOS Y NORMAS:
${[...analysis.norms, ...analysis.articles].map((n) => `- ${n}`).join("\n") || "- Normativa del tema"}

EXCEPCIONES (RESALTAR EN ROJO):
${analysis.exceptions.map((e) => `- ${e}`).join("\n") || "- Excepciones del material"}

COMPARACIONES FRECUENTES EN EXAMEN:
${analysis.comparisons.map((c) => `- ${c}`).join("\n") || "- Comparaciones clave"}

PREGUNTAS / PRIORIDAD EXAMEN:
${analysis.examPriorities.map((e) => `- ${e}`).join("\n")}

ELEMENTOS VISUALES MÍNIMOS:
${sceneList}`.trim();

    case "memorization":
      return `
CONCEPTOS A MEMORIZAR CON METÁFORAS EXAGERADAS:
${analysis.concepts.map((c) => `- ${c}`).join("\n")}

METÁFORAS VISUALES OBLIGATORIAS (EXAGERADAS):
${sceneList}

ASOCIACIONES MEMORABLES:
${analysis.conceptualRelations.map((r) => `- ${r}`).join("\n") || "- Relaciones clave del tema"}`.trim();

    case "jurisprudence":
      return `
PRECEDENTES Y SENTENCIAS:
${[...analysis.jurisprudence, ...analysis.practicalCases].map((j) => `- ${j}`).join("\n") || "- Casos del material"}

EVOLUCIÓN DOCTRINAL:
${analysis.conceptualRelations.map((r) => `- ${r}`).join("\n") || "- Relaciones entre fallos"}

NODOS DE LÍNEA DE TIEMPO:
${sceneList}

COMPARACIONES JURISPRUDENCIALES:
${analysis.comparisons.map((c) => `- ${c}`).join("\n") || "- Comparaciones relevantes"}`.trim();

    case "legal_premium":
      return `
TEMA Y SUBTEMAS FORMALES:
${analysis.subtopics.map((s) => `- ${s}`).join("\n")}

CONCEPTOS JURÍDICOS:
${analysis.concepts.map((c) => `- ${c}`).join("\n")}

NORMAS, CÓDIGOS Y DOCTRINA:
${[...analysis.norms, ...analysis.articles, ...analysis.doctrine].map((n) => `- ${n}`).join("\n")}

JURISPRUDENCIA Y EXPEDIENTES:
${analysis.jurisprudence.map((j) => `- ${j}`).join("\n") || "- Referencias jurisprudenciales"}

ELEMENTOS VISUALES FORMALES:
${sceneList}`.trim();

    case "professor":
      return `
CONCEPTOS DEL MATERIAL:
${analysis.concepts.map((c) => `- ${c}`).join("\n")}

SUBTEMAS:
${analysis.subtopics.map((s) => `- ${s}`).join("\n")}

DEFINICIONES:
${analysis.definitions.slice(0, 6).map((d) => `- ${d}`).join("\n") || "- Del material de estudio"}

ESCENAS SEGÚN CRITERIOS DE RÚBRICA:
${sceneList}`.trim();

    default:
      return `
SUBTEMAS A ILUSTRAR:
${analysis.subtopics.map((s) => `- ${s}`).join("\n")}

CONCEPTOS JURÍDICOS CLAVE:
${analysis.concepts.map((c) => `- ${c}`).join("\n")}

DEFINICIONES:
${analysis.definitions.slice(0, 6).map((d) => `- ${d}`).join("\n") || "- Del material"}

PRINCIPIOS:
${analysis.principles.map((p) => `- ${p}`).join("\n") || "- Principios del tema"}

NORMAS Y ARTÍCULOS:
${[...analysis.norms, ...analysis.articles].map((n) => `- ${n}`).join("\n") || "- Normativa aplicable"}

COMPARACIONES:
${analysis.comparisons.map((c) => `- ${c}`).join("\n") || "- Comparaciones clave"}

ESCENAS VISUALES OBLIGATORIAS:
${sceneList}`.trim();
  }
}

function ensureQualityBlock(text: string, modeQuality: string): string {
  const trimmed = text.trim();
  if (trimmed.includes("4K") || trimmed.includes(UNIVERSAL_QUALITY_BLOCK.slice(0, 24))) {
    return trimmed;
  }
  return `${trimmed}\n\n${modeQuality}\n${UNIVERSAL_QUALITY_BLOCK}`;
}

function assembleVisualPremiumPrompt(
  base: Omit<VisualPremiumPrompt, "prompt"> & { basePrompt: string },
  studentPersonalization?: string | null,
  creativityLevel: VisualCreativityLevel = "balanced",
): VisualPremiumPrompt {
  const finalPrompt = buildFinalPrompt(base.basePrompt, {
    creativityLevel,
    studentPersonalization,
  });

  return {
    ...base,
    studentPersonalization: studentPersonalization?.trim() || undefined,
    creativityLevel,
    prompt: finalPrompt,
    explanation: base.analysis
      ? buildPromptExplanation(
          base.analysis,
          base.mode,
          base.rubricAnalysis,
          creativityLevel,
          studentPersonalization,
        )
      : base.explanation,
  };
}

function buildFallbackPrompt(
  analysis: DocumentVisualAnalysis,
  mode: VisualPromptMode,
  content: OrganizerContent,
  rubric?: RubricAnalysis | null,
  creativityLevel: VisualCreativityLevel = "balanced",
): Omit<VisualPremiumPrompt, "prompt"> & { basePrompt: string } {
  const config = MODE_PROMPT_CONFIG[mode];
  const rubricSection = rubric
    ? mode === "professor"
      ? `\n\n${rubricBlock(rubric)}`
      : `\n\n${rubricBlock(rubric)}\nNota: La rúbrica complementa el modo ${config.label}; no reemplaza su estilo visual.`
    : "";

  const prompt = ensureQualityBlock(
    `Genera una imagen ultra detallada en 4K.

TÍTULO: ${analysis.centralTopic}
MODO EXCLUSIVO: ${config.label.toUpperCase()} — NO mezclar con otros estilos.

${config.directive}

${config.layout}

${config.visualRules}

${buildModeContentBlock(analysis, mode)}
${rubricSection}

CONTEXTO DEL MATERIAL:
${content.summary?.slice(0, 900) ?? ""}

PROHIBIDO EN ESTE MODO:
${config.forbidden}

CALIDAD:
${config.qualityTail}`,
    config.qualityTail,
  );

  return {
    title: analysis.centralTopic,
    mode,
    basePrompt: prompt,
    analysis,
    rubricAnalysis: rubric ?? undefined,
    explanation: [],
    hasRubric: Boolean(rubric),
    generatedAt: new Date().toISOString(),
    creativityLevel,
  };
}

async function enrichPromptWithGemini(
  analysis: DocumentVisualAnalysis,
  content: OrganizerContent,
  mode: VisualPromptMode,
  rubric?: RubricAnalysis | null,
  creativityLevel: VisualCreativityLevel = "balanced",
): Promise<Omit<VisualPremiumPrompt, "prompt"> & { basePrompt: string }> {
  if (!env.geminiApiKey) {
    return buildFallbackPrompt(analysis, mode, content, rubric, creativityLevel);
  }

  const config = MODE_PROMPT_CONFIG[mode];
  const creativityDirective =
    creativityLevel !== "balanced"
      ? `\nNivel de creatividad solicitado: ${creativityLabel(creativityLevel)} — ajusta el estilo visual en consecuencia.`
      : "";

  const systemPrompt = `Eres un director de arte educativo especializado en Derecho peruano (UNT).
Tu trabajo es crear UN PROMPT BASE HIPERDETALLADO para Gemini Image según UN SOLO MODO visual.
NO generes la imagen. Solo el prompt base listo para personalización posterior.
NO incluyas instrucciones del estudiante — eso se fusionará después.
${creativityDirective}

=== MODO ACTIVO: ${config.label.toUpperCase()} ===
${config.directive}

${config.layout}

${config.visualRules}

PROHIBIDO EN ESTE MODO:
${config.forbidden}

${mode === "professor" && rubric ? rubricBlock(rubric) : rubric ? `${rubricBlock(rubric)}\nLa rúbrica COMPLEMENTA el modo ${config.label}; el estilo visual principal sigue siendo el del modo.` : ""}

CONTENIDO DEL MATERIAL PARA ESTE MODO:
${buildModeContentBlock(analysis, mode)}

Análisis estructurado:
${JSON.stringify(analysis, null, 2)}

Resumen del material:
${content.summary?.slice(0, 2000) ?? ""}

REGLAS CRÍTICAS:
- El prompt debe ser RADICALMENTE DIFERENTE al de otros modos (infografía ≠ examen ≠ memorización).
- NO mezcles estilos de otros modos.
- NO uses diagramas de cajas conectadas ni wireframes.
${mode === "exam" ? "- MINIMIZA decoración. MAXIMIZA definiciones, artículos y excepciones legibles." : ""}
${mode === "memorization" ? "- EXAGERA metáforas visuales. Colores neón. Escenas imposibles de olvidar." : ""}
${mode === "jurisprudence" ? "- Incluye línea de tiempo, precedentes y evolución doctrinal." : ""}
${mode === "professor" && rubric ? "- PRIORIZA criterios de la rúbrica sobre cualquier estilo genérico." : ""}

El prompt debe ser una sola instrucción larga en español.
Terminar con calidad: ${config.qualityTail} y ${UNIVERSAL_QUALITY_BLOCK}

Devuelve SOLO JSON:
{
  "title": "Título del póster visual",
  "mode": "${mode}",
  "prompt": "Prompt base hiperdetallado completo en español...",
  "explanation": ["Se detectaron X conceptos..."]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: config.geminiTemperature,
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    return buildFallbackPrompt(analysis, mode, content, rubric, creativityLevel);
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    return buildFallbackPrompt(analysis, mode, content, rubric, creativityLevel);
  }

  try {
    const parsed = parseJson(text);
    const prompt = parsed.prompt?.trim();
    if (!prompt) return buildFallbackPrompt(analysis, mode, content, rubric, creativityLevel);

    const basePrompt = ensureQualityBlock(prompt, config.qualityTail);

    return {
      title: parsed.title?.trim() || analysis.centralTopic,
      mode,
      basePrompt,
      analysis,
      rubricAnalysis: rubric ?? undefined,
      explanation: [],
      hasRubric: Boolean(rubric),
      generatedAt: new Date().toISOString(),
      creativityLevel,
    };
  } catch {
    return buildFallbackPrompt(analysis, mode, content, rubric, creativityLevel);
  }
}

export async function generateVisualPremiumPrompt(
  content: OrganizerContent,
  mode: VisualPromptMode,
  rubricText?: string | null,
  rubricFileName?: string,
  studentPersonalization?: string | null,
  creativityLevel: VisualCreativityLevel = "balanced",
): Promise<VisualPremiumPrompt> {
  const analysis = extractDocumentVisualAnalysis(content, mode);

  let rubricAnalysis: RubricAnalysis | null = null;
  if (rubricText?.trim()) {
    rubricAnalysis = await analyzeAcademicRubric(rubricText, rubricFileName);
  }

  const base = await enrichPromptWithGemini(
    analysis,
    content,
    mode,
    rubricAnalysis,
    creativityLevel,
  );

  return assembleVisualPremiumPrompt(base, studentPersonalization, creativityLevel);
}
