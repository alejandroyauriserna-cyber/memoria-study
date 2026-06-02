import { analyzeAcademicRubric } from "@/lib/ai/analyze-academic-rubric";
import { extractInfographicTopics } from "@/lib/ai/build-academic-infographic-prompt";
import { env } from "@/lib/env";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import {
  ATLAS_ACADEMIC_MANDATE,
  ACADEMIC_LEVEL_CONFIG,
  MODE_PROMPT_CONFIG,
  UNIVERSAL_QUALITY_BLOCK,
  academicLevelLabel,
  buildFinalPrompt,
  creativityLabel,
  modeLabel,
} from "@/lib/organizers/visual-prompt-mode-config";
import type {
  DocumentVisualAnalysis,
  RubricAnalysis,
  VisualAcademicLevel,
  VisualCreativityLevel,
  VisualPremiumPrompt,
  VisualPromptMode,
} from "@/lib/organizers/visual-prompt-types";

function titleDirective(resolvedTitle: string, isStudentTitle: boolean): string {
  if (isStudentTitle) {
    return `TÍTULO PRINCIPAL OBLIGATORIO (DEFINIDO POR EL ESTUDIANTE — USAR EXACTAMENTE):
«${resolvedTitle}»
PROHIBIDO cambiar este título. PROHIBIDO inventar marcas editoriales (Harvard Law, Oxford Law, La Brújula Legal, Atlas Jurídico IA, etc.).`;
  }
  return `TÍTULO PRINCIPAL DEL ATLAS:
«${resolvedTitle}»
Usar como encabezado principal. NO inventar títulos alternativos de marca editorial.`;
}

function unique(values: Array<string | undefined | null>, limit = 12): string[] {
  return [...new Set(values.map((v) => v?.trim()).filter(Boolean) as string[])].slice(0, limit);
}

const SCENE_RULES: Record<
  VisualPromptMode,
  Array<{ match: RegExp; metaphor: string }>
> = {
  infographic: [
    { match: /buena fe|honestidad/i, metaphor: "brújula ética sobre balanza equilibrada — definición + utilidad jurídica + conexión doctrinal" },
    { match: /voluntad|consentimiento/i, metaphor: "firma jurídica sobre documento con sello de consentimiento" },
    { match: /contrato|contratación|negocio jurídico/i, metaphor: "ecosistema contractual conectado — manuscrito firmado, pluma estilográfica, sello notarial" },
    { match: /contratación en masa|contratos de adhesión/i, metaphor: "red de contratos interconectados formando ecosistema contractual masivo" },
    { match: /nulidad/i, metaphor: "documento anulado con sello institucional rojo, artículo correlativo visible" },
    { match: /norma imperativa|normas imperativas|orden público/i, metaphor: "pilares estructurales jurídicos que sostienen el edificio normativo" },
    { match: /juez|tribunal|magistrado/i, metaphor: "iconografía de tribunal clásico, columnas, balanza — sin personajes caricaturescos" },
    { match: /código civil|código|civil/i, metaphor: "tomo del Código Civil encuadernado en cuero, artículos numerados en tipografía serif" },
    { match: /interpretación|hermenéutica/i, metaphor: "capas de texto manuscrito revelándose progresivamente — interpretación literal, sistemática, teleológica" },
    { match: /jurisprudencia|precedente|fallo|sentencia|casación/i, metaphor: "red de sentencias vinculadas con ratio decidendi en recuadros dorados" },
    { match: /error|consentimiento defectuoso/i, metaphor: "documento con cláusula tachada señalando vicio del consentimiento" },
  ],
  memorization: [
    { match: /nulidad/i, metaphor: "símbolo mnemotécnico: documento anulado con sello rojo institucional (formal, memorable)" },
    { match: /buena fe|honestidad/i, metaphor: "símbolo: brújula ética sobre balanza dorada equilibrada" },
    { match: /voluntad|consentimiento/i, metaphor: "símbolo: firma jurídica con pluma estilográfica" },
    { match: /interpretación|hermenéutica/i, metaphor: "símbolo: capas de pergamino con texto revelándose" },
    { match: /obligación|obligacion/i, metaphor: "símbolo: cadena estilizada dorada conectando sujetos jurídicos" },
    { match: /código civil|código|civil/i, metaphor: "símbolo: tomo jurídico monumental en cuero con lomo dorado" },
    { match: /jurisprudencia|precedente|fallo|sentencia/i, metaphor: "símbolo: red de expedientes vinculados con sello judicial" },
    { match: /norma imperativa|orden público/i, metaphor: "símbolo: pilares estructurales jurídicos" },
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
      infographic: `nodo de atlas jurídico: «${concept}» con título, definición breve y conexión doctrinal`,
      memorization: `símbolo mnemotécnico formal para «${concept}» — iconografía jurídica elegante`,
      exam: `recuadro académico: definición de «${concept}» + artículo correlativo si aplica`,
      legal_premium: `elemento de manual jurídico premium sobre «${concept}»`,
      jurisprudence: `nodo jurisprudencial con precedente relacionado a «${concept}»`,
      professor: `elemento visual alineado a rúbrica sobre «${concept}»`,
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
  academicLevel?: VisualAcademicLevel,
): string[] {
  const lines: string[] = [];

  if (academicLevel) {
    lines.push(`Se aplicó nivel académico ${academicLevelLabel(academicLevel)}.`);
  }

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

  if (academicLevel === "litigant" && analysis.practicalCases.length) {
    lines.push(
      `Se estructuraron ${analysis.practicalCases.length} situaciones prácticas para análisis litigante.`,
    );
  }

  if (academicLevel === "thesis" && analysis.conceptualRelations.length) {
    lines.push("Se incluyeron relaciones causales y conflictos doctrinales para nivel tesis.");
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

function buildAcademicLevelBlock(
  analysis: DocumentVisualAnalysis,
  academicLevel: VisualAcademicLevel,
): string {
  const config = ACADEMIC_LEVEL_CONFIG[academicLevel];

  if (academicLevel === "litigant") {
    return `
${config.directive}

PROBLEMA JURÍDICO DETECTADO:
${analysis.centralTopic}

NORMATIVA APLICABLE:
${[...analysis.norms, ...analysis.articles].map((n) => `- ${n}`).join("\n") || "- Del material analizado"}

ARGUMENTOS POSIBLES (PARTE ACTORA):
${analysis.concepts.slice(0, 6).map((c) => `- ${c}`).join("\n")}

CONTRAARGUMENTOS / DEFENSAS:
${analysis.exceptions.map((e) => `- Excepción/defensa: ${e}`).join("\n") || "- Excepciones del material"}

JURISPRUDENCIA CENTRAL (POSICIÓN PRINCIPAL, NO EN RINCÓN):
${analysis.jurisprudence.map((j) => `- ${j}`).join("\n") || "- Precedentes del material"}

CASOS PRÁCTICOS:
${analysis.practicalCases.map((c) => `- ${c}`).join("\n") || "- Situaciones del material"}

CRITERIOS DE DECISIÓN:
${analysis.comparisons.map((c) => `- ${c}`).join("\n") || "- Comparaciones doctrinales relevantes"}`.trim();
  }

  if (academicLevel === "thesis") {
    return `
${config.directive}

PROBLEMA / PREGUNTA DE INVESTIGACIÓN:
${analysis.centralTopic}

HIPÓTESIS Y VARIABLES (DEL MATERIAL):
${analysis.conceptualRelations.map((r) => `- ${r}`).join("\n") || "- Relaciones conceptuales detectadas"}

CONFLICTOS DOCTRINALES:
${analysis.comparisons.map((c) => `- ${c}`).join("\n") || "- Comparaciones doctrinales"}

LÍNEAS JURISPRUDENCIALES:
${analysis.jurisprudence.map((j) => `- ${j}`).join("\n") || "- Precedentes identificados"}

DOCTRINA Y AUTORES:
${[...analysis.authors, ...analysis.doctrine].map((a) => `- ${a}`).join("\n") || "- Referencias doctrinales"}`.trim();
  }

  if (academicLevel === "basic") {
    return `
${config.directive}

CONCEPTOS ESENCIALES (MÁXIMO 7):
${analysis.concepts.slice(0, 7).map((c) => `- ${c}`).join("\n")}

DEFINICIONES BREVES:
${analysis.definitions.slice(0, 5).map((d) => `- ${d}`).join("\n") || analysis.concepts.slice(0, 5).map((c) => `- ${c}`).join("\n")}`.trim();
  }

  return `
${config.directive}

${config.structure}
${config.density}`.trim();
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
  academicLevel: VisualAcademicLevel = "undergraduate",
): VisualPremiumPrompt {
  const finalPrompt = buildFinalPrompt(base.basePrompt, {
    creativityLevel,
    academicLevel,
    studentPersonalization,
  });

  return {
    ...base,
    academicLevel,
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
          academicLevel,
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
  academicLevel: VisualAcademicLevel = "undergraduate",
  resolvedTitle?: string,
  isStudentTitle = false,
): Omit<VisualPremiumPrompt, "prompt"> & { basePrompt: string } {
  const config = MODE_PROMPT_CONFIG[mode];
  const academic = ACADEMIC_LEVEL_CONFIG[academicLevel];
  const title = resolvedTitle?.trim() || analysis.centralTopic;
  const rubricSection = rubric
    ? mode === "professor"
      ? `\n\n${rubricBlock(rubric)}`
      : `\n\n${rubricBlock(rubric)}\nNota: La rúbrica complementa el modo ${config.label}; no reemplaza su estilo visual.`
    : "";

  const prompt = ensureQualityBlock(
    `Genera un atlas visual jurídico ultra detallado (NO infografía escolar).

${titleDirective(title, isStudentTitle)}
MODO EXCLUSIVO: ${config.label.toUpperCase()} — NO mezclar con otros estilos.
NIVEL ACADÉMICO: ${academic.label.toUpperCase()} — modifica densidad y estructura según directivas.

${ATLAS_ACADEMIC_MANDATE}

${academic.directive}

${academic.structure}

${config.directive}

${config.layout}

${config.visualRules}

${buildAcademicLevelBlock(analysis, academicLevel)}

${buildModeContentBlock(analysis, mode)}
${rubricSection}

CONTEXTO DEL MATERIAL:
${content.summary?.slice(0, 900) ?? ""}

PROHIBIDO EN ESTE MODO:
${config.forbidden}

CALIDAD:
${config.qualityTail}
${academic.qualityHint}`,
    config.qualityTail,
  );

  return {
    title,
    mode,
    academicLevel,
    basePrompt: prompt,
    analysis,
    rubricAnalysis: rubric ?? undefined,
    explanation: [],
    hasRubric: Boolean(rubric),
    generatedAt: new Date().toISOString(),
    creativityLevel,
    studentTitle: isStudentTitle ? title : undefined,
  };
}

async function enrichPromptWithGemini(
  analysis: DocumentVisualAnalysis,
  content: OrganizerContent,
  mode: VisualPromptMode,
  rubric?: RubricAnalysis | null,
  creativityLevel: VisualCreativityLevel = "balanced",
  academicLevel: VisualAcademicLevel = "undergraduate",
  resolvedTitle?: string,
  isStudentTitle = false,
): Promise<Omit<VisualPremiumPrompt, "prompt"> & { basePrompt: string }> {
  const title = resolvedTitle?.trim() || analysis.centralTopic;

  if (!env.geminiApiKey) {
    return buildFallbackPrompt(
      analysis,
      mode,
      content,
      rubric,
      creativityLevel,
      academicLevel,
      title,
      isStudentTitle,
    );
  }

  const config = MODE_PROMPT_CONFIG[mode];
  const academic = ACADEMIC_LEVEL_CONFIG[academicLevel];
  const creativityDirective =
    creativityLevel !== "balanced"
      ? `\nNivel de creatividad solicitado: ${creativityLabel(creativityLevel)} — ajusta el estilo visual en consecuencia.`
      : "";

  const systemPrompt = `Eres un director de arte editorial especializado en visualización jurídica de posgrado (UNT, Harvard, Oxford).
Tu trabajo es crear UN PROMPT BASE para Gemini Image que genere un ATLAS VISUAL JURÍDICO UNIVERSITARIO — NO una infografía escolar.
NO generes la imagen. Solo el prompt base listo para personalización posterior.

${ATLAS_ACADEMIC_MANDATE}
${creativityDirective}

=== NIVEL ACADÉMICO OBLIGATORIO: ${academic.label.toUpperCase()} ===
${academic.directive}

${academic.structure}

DENSIDAD: ${academic.density}

=== MODO ACTIVO: ${config.label.toUpperCase()} ===
${titleDirective(title, isStudentTitle)}

${config.directive}

${config.layout}

${config.visualRules}

PROHIBIDO EN ESTE MODO:
${config.forbidden}

${buildAcademicLevelBlock(analysis, academicLevel)}

${mode === "professor" && rubric ? rubricBlock(rubric) : rubric ? `${rubricBlock(rubric)}\nLa rúbrica COMPLEMENTA el modo ${config.label}; el estilo visual principal sigue siendo el del modo.` : ""}

CONTENIDO DEL MATERIAL PARA ESTE MODO:
${buildModeContentBlock(analysis, mode)}

Análisis estructurado:
${JSON.stringify(analysis, null, 2)}

Resumen del material:
${content.summary?.slice(0, 2000) ?? ""}

REGLAS CRÍTICAS:
- Generar ATLAS JURÍDICO UNIVERSITARIO, nunca infografía escolar ni material infantil.
- El prompt debe ser RADICALMENTE DIFERENTE según el NIVEL ACADÉMICO (${academic.label}) y el MODO (${config.label}).
- NO caricaturas, NO emojis, NO personajes sonrientes, NO estilo Canva juvenil.
- NO reutilizar el mismo símbolo para conceptos distintos — metáforas únicas por concepto.
- NO mezcles estilos de otros modos ni niveles académicos.
${academicLevel === "basic" ? "- MÁXIMO 7 conceptos. Claridad sobre densidad." : ""}
${academicLevel === "litigant" ? "- PRIORIZA conflicto jurídico, argumentos/contraargumentos, jurisprudencia central." : ""}
${academicLevel === "thesis" ? "- PRIORIZA problemas jurídicos, hipótesis, conflictos doctrinales, líneas jurisprudenciales." : ""}
${mode === "exam" ? "- MINIMIZA decoración. MAXIMIZA definiciones, artículos y excepciones legibles." : ""}
${mode === "memorization" ? "- Símbolos mnemotécnicos formales y elegantes, paleta petróleo/dorado/marfil." : ""}
${mode === "jurisprudence" ? "- Incluye línea de tiempo, precedentes y evolución doctrinal con nombres de fallos." : ""}
${mode === "professor" && rubric ? "- PRIORIZA criterios de la rúbrica sobre cualquier estilo genérico." : ""}

El prompt debe ser una sola instrucción larga en español.
Terminar con calidad: ${config.qualityTail}, ${academic.qualityHint} y ${UNIVERSAL_QUALITY_BLOCK}

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
    return buildFallbackPrompt(
      analysis,
      mode,
      content,
      rubric,
      creativityLevel,
      academicLevel,
      title,
      isStudentTitle,
    );
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    return buildFallbackPrompt(
      analysis,
      mode,
      content,
      rubric,
      creativityLevel,
      academicLevel,
      title,
      isStudentTitle,
    );
  }

  try {
    const parsed = parseJson(text);
    const prompt = parsed.prompt?.trim();
    if (!prompt) {
      return buildFallbackPrompt(
        analysis,
        mode,
        content,
        rubric,
        creativityLevel,
        academicLevel,
        title,
        isStudentTitle,
      );
    }

    const basePrompt = ensureQualityBlock(prompt, config.qualityTail);

    return {
      title: isStudentTitle ? title : parsed.title?.trim() || title,
      mode,
      academicLevel,
      basePrompt,
      analysis,
      rubricAnalysis: rubric ?? undefined,
      explanation: [],
      hasRubric: Boolean(rubric),
      generatedAt: new Date().toISOString(),
      creativityLevel,
      studentTitle: isStudentTitle ? title : undefined,
    };
  } catch {
    return buildFallbackPrompt(
      analysis,
      mode,
      content,
      rubric,
      creativityLevel,
      academicLevel,
      title,
      isStudentTitle,
    );
  }
}

export async function generateVisualPremiumPrompt(
  content: OrganizerContent,
  mode: VisualPromptMode,
  rubricText?: string | null,
  rubricFileName?: string,
  studentPersonalization?: string | null,
  creativityLevel: VisualCreativityLevel = "balanced",
  customTitle?: string | null,
  academicLevel: VisualAcademicLevel = "undergraduate",
): Promise<VisualPremiumPrompt> {
  const analysis = extractDocumentVisualAnalysis(content, mode);
  const isStudentTitle = Boolean(customTitle?.trim());
  const resolvedTitle = customTitle?.trim() || analysis.centralTopic;

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
    academicLevel,
    resolvedTitle,
    isStudentTitle,
  );

  const merged = assembleVisualPremiumPrompt(
    base,
    studentPersonalization,
    creativityLevel,
    academicLevel,
  );
  return {
    ...merged,
    studentTitle: isStudentTitle ? resolvedTitle : undefined,
    title: isStudentTitle ? resolvedTitle : merged.title,
  };
}
