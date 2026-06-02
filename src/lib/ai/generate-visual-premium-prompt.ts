import { env } from "@/lib/env";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import type {
  DocumentVisualAnalysis,
  VisualPremiumPrompt,
  VisualPromptMode,
} from "@/lib/organizers/visual-prompt-types";
import { extractInfographicTopics } from "@/lib/ai/build-academic-infographic-prompt";

const VISUAL_METAPHOR_GUIDE = `
Traduce conceptos jurídicos a escenas visuales concretas (NO cajas ni nodos):
- Buena Fe → personas negociando honestamente, apretón de manos
- Contrato → firma de documentos, pluma sobre contrato
- Nulidad → contrato roto en pedazos
- Anulabilidad → contrato parcialmente dañado con grietas
- Juez → tribunal con balanza
- Principio jurídico → pilar de piedra sólido
- Código Civil → gran libro jurídico dorado
- Jurisprudencia → expedientes judiciales apilados
- Derechos → escudos protectores
- Obligaciones → cadenas de responsabilidad entre personas
- Interpretación → juez analizando documentos con lupa
- Calificación → clasificación de expedientes en estantería
- Manifestación de voluntad → personas expresando decisiones con gestos claros
- Normas imperativas → columnas sólidas imposibles de mover
- Derecho peruano → Palacio de Justicia de Lima, bandera peruana sutil
- Contratación en masa → múltiples contratos y personas en fila
`.trim();

const QUALITY_BLOCK = `
Ultra detailed, 4K, educational infographic, visual learning, premium academic poster, professional illustration, rich colors, high information density, modern design, interactive feeling, realistic illustrations, cinematic lighting, depth, professional composition, university level.
NO flowchart boxes. NO boring node diagrams. NO wireframes. NO empty circles. NO technical graphs.
`.trim();

const MODE_STYLE: Record<VisualPromptMode, string> = {
  infographic: `Modo INFOGRAFÍA: enciclopedia visual moderna, atlas educativo colorido, póster académico premium, storyboard ilustrado, composición tipo Gemini Canvas.`,
  memorization: `Modo MEMORIZACIÓN: metáforas visuales extremadamente memorables, personajes caricaturescos educativos, colores intensos, asociaciones visuales impactantes, elementos que faciliten recordar en examen.`,
  exam: `Modo EXAMEN: resaltar definiciones exactas, artículos clave, comparaciones preguntables, excepciones, conceptos repetidos por el docente, jerarquía visual por relevancia examen.`,
  legal_premium: `Modo JURÍDICO PREMIUM: diseño formal elegante, tribunales, jueces, expedientes, códigos, documentos legales, iconografía jurídica clásica peruana, tono académico universitario.`,
  jurisprudence: `Modo JURISPRUDENCIA: casos emblemáticos, precedentes, sentencias, expedientes numerados, líneas jurisprudenciales conectadas visualmente, énfasis en fallos y ratios decidendi.`,
};

function unique(values: Array<string | undefined | null>, limit = 12): string[] {
  return [...new Set(values.map((v) => v?.trim()).filter(Boolean) as string[])].slice(0, limit);
}

function inferVisualScenes(concepts: string[]): DocumentVisualAnalysis["visualScenes"] {
  const rules: Array<{ match: RegExp; metaphor: string }> = [
    { match: /buena fe|honestidad/i, metaphor: "personas negociando con honestidad, apretón de manos cálido" },
    { match: /contrato|contratación|negocio jurídico/i, metaphor: "documento legal siendo firmado con pluma" },
    { match: /nulidad/i, metaphor: "contrato roto en pedazos sobre mesa judicial" },
    { match: /anulabilidad/i, metaphor: "contrato con grietas y sello de advertencia" },
    { match: /juez|tribunal|magistrado/i, metaphor: "tribunal peruano con balanza de la justicia" },
    { match: /código civil|código|civil/i, metaphor: "gran libro jurídico dorado con artículos visibles" },
    { match: /jurisprudencia|precedente|fallo|sentencia/i, metaphor: "expedientes judiciales apilados con sello oficial" },
    { match: /interpretación|hermenéutica/i, metaphor: "juez con lupa analizando documentos legales" },
    { match: /obligación|obligacion/i, metaphor: "cadena de responsabilidad conectando a dos sujetos" },
    { match: /derecho|garantía|garantia/i, metaphor: "escudo protector sobre ciudadano" },
    { match: /voluntad|consentimiento/i, metaphor: "personas expresando decisión con gestos claros" },
    { match: /empresa|sociedad|persona jurídica/i, metaphor: "edificio corporativo con documentos legales" },
    { match: /masa|adhesión|estándar/i, metaphor: "múltiples contratos idénticos y filas de firmantes" },
    { match: /peru|peruano/i, metaphor: "Palacio de Justicia de Lima con elementos patrios sutiles" },
  ];

  const scenes: DocumentVisualAnalysis["visualScenes"] = [];

  for (const concept of concepts) {
    const rule = rules.find((entry) => entry.match.test(concept));
    scenes.push({
      concept,
      visualMetaphor: rule?.metaphor ?? `ilustración educativa premium de "${concept}" en contexto jurídico peruano`,
    });
    if (scenes.length >= 14) break;
  }

  return scenes;
}

export function extractDocumentVisualAnalysis(content: OrganizerContent): DocumentVisualAnalysis {
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

  return {
    centralTopic,
    subtopics,
    concepts,
    definitions,
    principles,
    norms,
    articles,
    jurisprudence,
    authors: [],
    doctrine: unique(content.aiAnalysis?.recommendations ?? [], 6),
    comparisons,
    exceptions: unique(
      concepts.filter((c) => /excepción|excepcion|salvo|excepto/i.test(c)),
      6,
    ),
    practicalCases,
    conceptualRelations,
    examPriorities,
    visualScenes: inferVisualScenes([centralTopic, ...concepts, ...subtopics]),
  };
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
  };
}

function buildFallbackPrompt(
  analysis: DocumentVisualAnalysis,
  mode: VisualPromptMode,
  content: OrganizerContent,
): VisualPremiumPrompt {
  const sceneList = analysis.visualScenes
    .map((s) => `• ${s.concept} → ${s.visualMetaphor}`)
    .join("\n");

  const prompt = `Genera una imagen ultra detallada en 4K.

TÍTULO PRINCIPAL: ${analysis.centralTopic}
TEMA CENTRAL: ${analysis.centralTopic}
MODO: ${mode.toUpperCase()}
${MODE_STYLE[mode]}

SUBTEMAS A ILUSTRAR:
${analysis.subtopics.map((s) => `- ${s}`).join("\n")}

CONCEPTOS JURÍDICOS CLAVE:
${analysis.concepts.map((c) => `- ${c}`).join("\n")}

DEFINICIONES IMPORTANTES:
${analysis.definitions.slice(0, 6).map((d) => `- ${d}`).join("\n") || "- Extraer del material"}

PRINCIPIOS:
${analysis.principles.map((p) => `- ${p}`).join("\n") || "- Principios del tema"}

NORMAS Y ARTÍCULOS:
${[...analysis.norms, ...analysis.articles].map((n) => `- ${n}`).join("\n") || "- Normativa aplicable"}

JURISPRUDENCIA Y CASOS:
${[...analysis.jurisprudence, ...analysis.practicalCases].map((j) => `- ${j}`).join("\n") || "- Casos relevantes"}

COMPARACIONES:
${analysis.comparisons.map((c) => `- ${c}`).join("\n") || "- Comparaciones clave del tema"}

PRIORIDAD EXAMEN:
${analysis.examPriorities.map((e) => `- ${e}`).join("\n")}

ESCENAS VISUALES OBLIGATORIAS:
${sceneList}

${VISUAL_METAPHOR_GUIDE}

DISTRIBUCIÓN VISUAL:
- Composición horizontal 16:9 tipo póster académico premium
- Tema central dominante con glow elegante
- Subtemas distribuidos orgánicamente (NO diagrama de cajas)
- Mini ilustraciones realistas por concepto
- Flechas y conexiones curvas con profundidad
- Iconografía jurídica peruana
- Texto legible en español integrado en la infografía

PALETA:
- Azul conceptos · Verde principios · Naranja casos · Morado ejemplos · Amarillo comparaciones · Rojo artículos
- Fondo oscuro elegante con iluminación cinematográfica

CONTEXTO DEL MATERIAL:
${content.summary?.slice(0, 900) ?? ""}

${QUALITY_BLOCK}`;

  return {
    title: analysis.centralTopic,
    mode,
    prompt,
    analysis,
    generatedAt: new Date().toISOString(),
  };
}

async function enrichPromptWithGemini(
  analysis: DocumentVisualAnalysis,
  content: OrganizerContent,
  mode: VisualPromptMode,
): Promise<VisualPremiumPrompt> {
  if (!env.geminiApiKey) {
    return buildFallbackPrompt(analysis, mode, content);
  }

  const systemPrompt = `Eres un director de arte educativo especializado en Derecho peruano (UNT).
Tu trabajo es crear PROMPTS HIPERDETALLADOS para Gemini Image (Nano Banana).
NO generes la imagen. Solo el prompt final listo para copiar y pegar.

${MODE_STYLE[mode]}

${VISUAL_METAPHOR_GUIDE}

Análisis estructurado del documento:
${JSON.stringify(analysis, null, 2)}

Resumen del material:
${content.summary?.slice(0, 2000) ?? ""}

Explicación simplificada:
${content.simplifiedExplanation?.slice(0, 800) ?? ""}

El prompt debe ser una sola instrucción larga en español, lista para pegar en Gemini Image.
Debe describir: título, tema central, subtemas, escenas visuales, iconografía, estilo gráfico, distribución, paleta, relaciones conceptuales y nivel académico universitario.
Incluir siempre: ${QUALITY_BLOCK}

Devuelve SOLO JSON:
{
  "title": "Título del póster visual",
  "mode": "${mode}",
  "prompt": "Prompt hiperdetallado completo en español..."
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.45 },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    return buildFallbackPrompt(analysis, mode, content);
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    return buildFallbackPrompt(analysis, mode, content);
  }

  try {
    const parsed = parseJson(text);
    const prompt = parsed.prompt?.trim();
    if (!prompt) return buildFallbackPrompt(analysis, mode, content);

    const withQuality = prompt.includes("4K")
      ? prompt
      : `${prompt.trim()}\n\n${QUALITY_BLOCK}`;

    return {
      title: parsed.title?.trim() || analysis.centralTopic,
      mode: parsed.mode ?? mode,
      prompt: withQuality,
      analysis,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return buildFallbackPrompt(analysis, mode, content);
  }
}

export async function generateVisualPremiumPrompt(
  content: OrganizerContent,
  mode: VisualPromptMode,
): Promise<VisualPremiumPrompt> {
  const analysis = extractDocumentVisualAnalysis(content);
  return enrichPromptWithGemini(analysis, content, mode);
}
