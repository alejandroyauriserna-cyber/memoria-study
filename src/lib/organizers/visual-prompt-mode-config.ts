import type { VisualPromptMode, VisualCreativityLevel, VisualAcademicLevel } from "@/lib/organizers/visual-prompt-types";

export const ATLAS_JURIDICO_MODULE_TITLE = "Atlas Jurídico IA";
/** @deprecated Use ATLAS_JURIDICO_MODULE_TITLE */
export const VISUAL_IMAGE_MODULE_TITLE = ATLAS_JURIDICO_MODULE_TITLE;

export const ATLAS_JURIDICO_MODULE_SUBTITLE =
  "Transformamos tu PDF en un prompt para generar atlas visuales jurídicos universitarios de alta gama en Gemini.";
/** @deprecated Use ATLAS_JURIDICO_MODULE_SUBTITLE */
export const VISUAL_IMAGE_MODULE_SUBTITLE = ATLAS_JURIDICO_MODULE_SUBTITLE;

export const WHAT_MEMORIASTUDY_DOES = {
  title: "¿Qué hace MemoriaStudy?",
  steps: [
    "Analiza el PDF de tu material.",
    "Extrae conceptos clave y relaciones académicas.",
    "Detecta doctrina, artículos y jurisprudencia.",
    "Construye un prompt avanzado para Gemini.",
    "Tú copias el prompt.",
    "Lo pegas en Gemini Image.",
    "Gemini genera el atlas visual.",
  ],
  note: "MemoriaStudy NO genera la imagen. Genera el mejor prompt posible para que Gemini cree material visual universitario profesional.",
} as const;

export const PERSONALIZATION_PLACEHOLDER =
  "Ej.: Usa colores rojo petróleo y dorado. Incluye más jurisprudencia. Prioriza artículos del Código Civil…";

export const HOW_IT_WORKS_STEPS = [
  "Analizamos tu PDF jurídico.",
  "Identificamos conceptos, doctrina y jurisprudencia.",
  "Construimos un prompt de atlas académico.",
  "Puedes personalizarlo.",
  "Copias el prompt.",
  "Lo pegas en Gemini.",
  "Obtienes un atlas visual de nivel posgrado.",
] as const;

export const ATLAS_ACADEMIC_MANDATE = `
MANDATO ACADÉMICO UNIVERSAL — VISUALIZACIÓN JURÍDICA DE ALTO NIVEL:
Público: estudiantes universitarios de Derecho, posgrado, tesis, sustentaciones y práctica profesional.
Inspiración editorial: Harvard Law School, Yale Law School, Oxford Law, Stanford Law, Bloomberg Graphics, Visual Capitalist, National Geographic Atlas, The Economist.

PRINCIPIO FUNDAMENTAL: la imagen debe ENSEÑAR, no decorar. Cada elemento transmite conocimiento jurídico.

PROHIBIDO ABSOLUTAMENTE:
infografía escolar, mapa conceptual escolar, lámina de secundaria, estilo Canva básico, estilo PowerPoint, caricaturas, dibujos infantiles, emojis, personajes genéricos repetidos, lupas repetidas, pergaminos repetidos, iconos clonados, decoración sin significado doctrinal.
Si un mismo objeto aparece más de una vez, debe tener justificación académica.

ESTRUCTURA JERÁRQUICA (8 NIVELES):
Nivel 1 — Tema principal.
Nivel 2 — Conceptos doctrinales principales.
Nivel 3 — Principios.
Nivel 4 — Artículos.
Nivel 5 — Jurisprudencia.
Nivel 6 — Casos prácticos.
Nivel 7 — Excepciones.
Nivel 8 — Comparaciones.

DENSIDAD ACADÉMICA — cada bloque debe contener: concepto + explicación resumida + utilidad jurídica + relación con otros conceptos.
La imagen debe funcionar incluso sin leer el PDF.

RELACIONES VISUALES — las conexiones representan: dependencia, subordinación, excepción, consecuencia, comparación, oposición, integración.
Usar flechas diferentes, colores diferentes y jerarquías visuales. No conectar nodos al azar.

REPRESENTACIÓN METAFÓRICA ÚNICA POR CONCEPTO (no reutilizar el mismo símbolo):
Buena fe → brújula ética / balanza equilibrada.
Voluntad → firma jurídica / consentimiento.
Interpretación → capas de texto revelándose.
Jurisprudencia → red de sentencias vinculadas.
Normas imperativas → pilares estructurales.
Contratación en masa → ecosistema contractual conectado.

MEMORIZACIÓN COGNITIVA: chunking, asociación visual, agrupación temática, colores por categoría, diferenciación semántica.

PALETA: azul petróleo, dorado, marfil, gris grafito. Iluminación cinematográfica. Contraste alto. Aspecto premium editorial.
FORMATO: póster panorámico 16:9, resolución ultra alta.
Debe parecer una página de atlas jurídico moderno — material universitario premium, NO escolar.
`.trim();

export const UNIVERSAL_QUALITY_BLOCK = `
Ultra detailed, 8K ready, legal atlas visualization, university postgraduate law faculty, maestría level, Harvard Law Review editorial style, National Geographic Atlas composition, Bloomberg Graphics visualization, premium academic poster 16:9 panoramic, cinematic lighting, petrol blue gold ivory white graphite gray palette, high information density, professional legal diagram, advanced conceptual map, no cartoon no school infographic no emoji no caricature.
`.trim();

export const CREATIVITY_LEVELS: Array<{
  id: VisualCreativityLevel;
  label: string;
  emoji: string;
  description: string;
  directive: string;
}> = [
  {
    id: "conservative",
    label: "Conservador",
    emoji: "",
    description: "Formal, sobrio, estilo revista jurídica clásica.",
    directive:
      "Estilo conservador: formal académico, tipografía serif editorial, composición simétrica, mínima ornamentación, tono Harvard Law Review.",
  },
  {
    id: "balanced",
    label: "Equilibrado",
    emoji: "",
    description: "Balance entre rigor doctrinal y diseño editorial.",
    directive:
      "Estilo equilibrado: balance entre claridad doctrinal y diseño editorial premium, diagramas elegantes, legibilidad universitaria.",
  },
  {
    id: "creative",
    label: "Creativo",
    emoji: "",
    description: "Visualizaciones editoriales sofisticadas sin perder rigor.",
    directive:
      "Estilo creativo: visualizaciones editoriales sofisticadas, composición dinámica tipo National Geographic Atlas, sin caricaturas ni estilo escolar.",
  },
  {
    id: "extreme",
    label: "Extremo",
    emoji: "",
    description: "Máximo impacto editorial manteniendo formalidad jurídica.",
    directive:
      "Estilo extremo: máximo impacto visual editorial, composición audaz tipo Bloomberg Graphics, densidad informativa alta, siempre formal y universitario — nunca infantil.",
  },
];

export const PERSONALIZATION_QUICK_CHIPS: Array<{
  emoji: string;
  label: string;
  text: string;
}> = [
  { emoji: "", label: "Paleta petróleo y oro", text: "Usa paleta azul petróleo, dorado, marfil y grafito." },
  { emoji: "", label: "Más doctrina", text: "Incluye más referencias doctrinales y autores." },
  { emoji: "", label: "Más jurisprudencia", text: "Incluye más jurisprudencia, precedentes y sentencias." },
  { emoji: "", label: "Línea de tiempo", text: "Incorpora línea de tiempo jurídica con hitos doctrinales." },
  { emoji: "", label: "Más artículos", text: "Prioriza artículos del Código Civil y normativa visible." },
  { emoji: "", label: "Mapa conceptual", text: "Estructura como mapa conceptual avanzado con jerarquías." },
  { emoji: "", label: "Estilo Harvard", text: "Estilo editorial Harvard Law Review, sobrio y premium." },
  { emoji: "", label: "Estilo NatGeo", text: "Estilo National Geographic Atlas, composición editorial." },
  { emoji: "", label: "Comparaciones", text: "Resalta comparaciones doctrinales en columnas paralelas." },
  { emoji: "", label: "Alta densidad", text: "Máxima densidad informativa sin perder elegancia." },
];

export function creativityLabel(level: VisualCreativityLevel): string {
  return CREATIVITY_LEVELS.find((item) => item.id === level)?.label ?? "Equilibrado";
}

export const ACADEMIC_LEVEL_CONFIG: Record<
  VisualAcademicLevel,
  {
    label: string;
    directive: string;
    structure: string;
    density: string;
    qualityHint: string;
  }
> = {
  basic: {
    label: "Básico",
    directive: `NIVEL ACADÉMICO — BÁSICO (INTRODUCTORIO):
Objetivo: comprensión rápida del tema. Ideal para primeros ciclos y primer contacto.
PRIORIZA: pocos conceptos (máximo 5-7), mucha claridad visual, poco texto por bloque, relaciones simples, colores distintivos por categoría.
EVITA: densidad extrema, jurisprudencia extensa, conflictos doctrinales, texto ilegible.
Resultado: visualización simple pero elegante — nunca escolar ni infantil.`,
    structure: `ESTRUCTURA BÁSICA:
- Tema central dominante
- 4-6 conceptos periféricos con definición de una línea
- Conexiones simples (flecha sólida = dependencia; línea punteada = relación)
- Sin más de 2 niveles jerárquicos visibles`,
    density: "Baja densidad textual. Máximo 1-2 frases por concepto. Legibilidad prioritaria.",
    qualityHint: "introductory university law visualization, clear and elegant, low density, premium editorial",
  },
  undergraduate: {
    label: "Universitario",
    directive: `NIVEL ACADÉMICO — UNIVERSITARIO (EXÁMENES):
Objetivo: preparación de parciales y finales universitarios.
PRIORIZA: densidad conceptual media-alta, principios jurídicos, artículos relevantes, comparaciones doctrinales, casos prácticos, jerarquía de 8 niveles.
Inspiración: manuales universitarios, material de preparación para exámenes de Derecho.
Resultado: mapa visual académico completo para evaluación.`,
    structure: `ESTRUCTURA UNIVERSITARIA (8 NIVELES):
Tema → conceptos → principios → artículos → jurisprudencia → casos → excepciones → comparaciones.
Cada bloque: concepto + explicación + utilidad jurídica + relación visual.`,
    density: "Densidad media-alta. Cada nodo incluye definición breve y utilidad jurídica.",
    qualityHint: "university law exam preparation atlas, full doctrinal hierarchy, articles and cases visible",
  },
  postgraduate: {
    label: "Posgrado",
    directive: `NIVEL ACADÉMICO — POSGRADO (ANÁLISIS PROFUNDO):
Objetivo: análisis doctrinal avanzado para maestrías y sustentaciones.
PRIORIZA: doctrina avanzada, autores, jurisprudencia central, corrientes interpretativas, comparaciones complejas, relación entre normas.
Inspiración: Harvard Law School, Yale Law School, Oxford Law — atlas jurídico profesional.
Resultado: atlas jurídico de posgrado con máxima rigurosidad editorial.`,
    structure: `ESTRUCTURA POSGRADO:
- Tema con marco doctrinal
- Nodos con doctrina, autores y corrientes interpretativas
- Jurisprudencia con ratios decidendi visibles
- Comparaciones en columnas paralelas
- Flechas codificadas: dependencia, subordinación, excepción, integración, oposición`,
    density: "Alta densidad informativa. Integrar autores, doctrina y precedentes sin ocultarlos.",
    qualityHint: "postgraduate legal atlas, advanced doctrine, jurisprudence lines, Harvard Yale Oxford editorial",
  },
  thesis: {
    label: "Tesis",
    directive: `NIVEL ACADÉMICO — TESIS (INVESTIGACIÓN):
Objetivo: visualización de investigación jurídica académica.
PRIORIZA: máxima profundidad, relaciones causales complejas, conflictos doctrinales, desarrollo argumentativo, problemas jurídicos, hipótesis, variables, líneas jurisprudenciales.
Inspiración: papers científicos, revistas indexadas, investigaciones jurídicas.
Resultado: visualización de investigación — NO infografía, sino síntesis argumentativa visual.`,
    structure: `ESTRUCTURA TESIS:
Nivel 1 — Problema jurídico / pregunta de investigación.
Nivel 2 — Marco normativo y doctrinal.
Nivel 3 — Hipótesis y variables.
Nivel 4 — Corrientes doctrinales enfrentadas.
Nivel 5 — Líneas jurisprudenciales.
Nivel 6 — Argumentos y contraargumentos.
Nivel 7 — Conclusiones parciales.
Nivel 8 — Implicaciones y vacíos normativos.`,
    density: "Máxima densidad académica. Conflictos doctrinales visibles. Relaciones causales explícitas.",
    qualityHint: "legal research visualization, thesis-level depth, doctrinal conflicts, hypothesis variables, indexed journal style",
  },
  litigant: {
    label: "Litigante",
    directive: `NIVEL ACADÉMICO — LITIGANTE / PRÁCTICA PROFESIONAL:
Objetivo: pensar y razonar como abogado — NO solo memorizar definiciones.
PRIORIZA: conflicto jurídico, posiciones enfrentadas, argumentos de ambas partes, contraargumentos, jurisprudencia aplicable central, normas relevantes, criterios de decisión, riesgos legales, excepciones procesales, posibles defensas, consecuencias prácticas.
La imagen debe responder: «¿Qué haría un abogado frente a este problema?»
Inspiración: despachos jurídicos internacionales, tribunales superiores, informes legales premium, litigación estratégica.`,
    structure: `ESTRUCTURA LITIGANTE:
Nivel 1 — Problema jurídico principal.
Nivel 2 — Normativa aplicable.
Nivel 3 — Argumentos posibles (parte demandante / actor).
Nivel 4 — Contraargumentos (parte demandada / defensa).
Nivel 5 — Jurisprudencia relevante (casaciones, sentencias, acuerdos plenarios — posición central).
Nivel 6 — Posible decisión judicial / criterio de decisión.
Nivel 7 — Consecuencias prácticas y riesgos.
Conexiones: estrategia, ataque, defensa, excepción, contradicción, riesgo, oportunidad.`,
    density: "Enfoque estratégico. Convertir conceptos abstractos en situaciones reales. Precedentes en posición central, no en rincón.",
    qualityHint: "legal litigation strategy map, law firm premium report, case analysis, arguments counterarguments, practical consequences",
  },
};

export function academicLevelLabel(level: VisualAcademicLevel): string {
  return ACADEMIC_LEVEL_CONFIG[level]?.label ?? "Universitario";
}

export function buildFinalPrompt(
  basePrompt: string,
  options: {
    creativityLevel?: VisualCreativityLevel;
    academicLevel?: VisualAcademicLevel;
    studentPersonalization?: string | null;
  },
): string {
  const level = options.creativityLevel ?? "balanced";
  const creativity = CREATIVITY_LEVELS.find((item) => item.id === level) ?? CREATIVITY_LEVELS[1];
  const academicLevel = options.academicLevel ?? "undergraduate";
  const academic = ACADEMIC_LEVEL_CONFIG[academicLevel];

  const sections = [basePrompt.trim()];

  sections.push(
    `\nNIVEL ACADÉMICO DE LA IMAGEN — ${academic.label.toUpperCase()}:\n${academic.directive}\n\n${academic.structure}\n\nDENSIDAD: ${academic.density}`,
  );

  sections.push(`\nNIVEL DE CREATIVIDAD — ${creativity.label.toUpperCase()}:\n${creativity.directive}`);

  const personalization = options.studentPersonalization?.trim();
  if (personalization) {
    sections.push(
      `\nPERSONALIZACIÓN DEL ESTUDIANTE (INCORPORAR OBLIGATORIAMENTE):\n${personalization}`,
    );
  }

  let merged = sections.join("\n");

  if (!merged.includes("PRINCIPIO FUNDAMENTAL")) {
    merged = `${merged}\n\n${ATLAS_ACADEMIC_MANDATE}`;
  }

  const qualitySnippet = UNIVERSAL_QUALITY_BLOCK.slice(0, 30);
  if (!merged.includes("4K") && !merged.includes(qualitySnippet)) {
    merged = `${merged}\n\n${UNIVERSAL_QUALITY_BLOCK}\n${academic.qualityHint}`;
  }

  return merged;
}

export type ModePromptConfig = {
  id: VisualPromptMode;
  label: string;
  geminiTemperature: number;
  expectedResult: string;
  directive: string;
  layout: string;
  visualRules: string;
  qualityTail: string;
  forbidden: string;
};

export const MODE_PROMPT_CONFIG: Record<VisualPromptMode, ModePromptConfig> = {
  infographic: {
    id: "infographic",
    label: "Atlas Jurídico",
    geminiTemperature: 0.4,
    expectedResult: "Atlas visual jurídico universitario, estilo editorial premium de posgrado.",
    directive: `MODO ATLAS JURÍDICO — COMPORTAMIENTO EXCLUSIVO:
Diseña un ATLAS VISUAL JURÍDICO UNIVERSITARIO DE ALTA GAMA. NO es infografía escolar.
Inspiración: Harvard Law Review, National Geographic Atlas, The Economist Visual Essays, Bloomberg Graphics, Enciclopedia Jurídica Premium.
PRIORIZA: diagramas profesionales, esquemas doctrinales, iconografía jurídica elegante, manuscritos, libros históricos, códigos civiles, sentencias, expedientes, tribunales, líneas doctrinales, mapas conceptuales avanzados.
Sensación: página de atlas jurídico moderno para maestría en Derecho — rigor académico, elegancia editorial.`,
    layout: `LAYOUT ATLAS JURÍDICO:
- Póster panorámico 16:9, resolución ultra alta
- Tema principal en el centro con marco editorial dorado
- Alrededor en disposición radial académica: conceptos, principios, artículos, jurisprudencia, excepciones, doctrina
- Cada nodo: título + explicación breve + flecha de conexión lógica
- Flechas académicas, relaciones de causalidad, jerarquías conceptuales, comparaciones doctrinales en columnas`,
    visualRules: `ESTILO VISUAL ATLAS:
- Paleta estricta: azul petróleo, dorado, blanco marfil, gris grafito
- Iluminación cinematográfica, texturas de papel premium y pergamino
- Tipografía editorial serif y sans-serif académica
- Iconografía jurídica elegante: balanza, columna, expediente, código, sello — sin clipart`,
    qualityTail:
      "Ultra detailed, 8K ready, legal university atlas, postgraduate law visualization, Harvard Law Review editorial, National Geographic Atlas layout, premium legal encyclopedia page, petrol blue gold ivory graphite, cinematic lighting, high information density.",
    forbidden:
      "NO infografía escolar. NO caricaturas. NO emojis. NO personajes sonriendo. NO dibujos infantiles. NO colores neón. NO estilo Canva juvenil. NO clipart. NO personajes repetidos.",
  },
  memorization: {
    id: "memorization",
    label: "Mapa Mnemotécnico",
    geminiTemperature: 0.45,
    expectedResult: "Mapa mnemotécnico doctrinal con símbolos jurídicos memorables y rigor académico.",
    directive: `MODO MAPA MNEMOTÉCNICO — COMPORTAMIENTO EXCLUSIVO:
Crea un mapa visual para MEMORIA DE LARGO PLAZO con rigor universitario.
PRIORIZA: símbolos jurídicos distintivos, asociaciones visuales sobrias pero memorables, iconografía legal elegante, contrastes tipográficos, anclajes visuales por concepto.
Usar metáforas visuales SOFISTICADAS (no caricaturas):
- Nulidad → documento legal anulado con sello rojo institucional
- Buena fe → balanza equilibrada con luz dorada sobria
- Interpretación → lupa sobre texto manuscrito histórico
- Código Civil → tomo encuadernado en cuero con artículos visibles`,
    layout: `LAYOUT MNEMOTÉCNICO:
- Mapa conceptual avanzado con nodos grandes por concepto clave
- Cada nodo: símbolo jurídico dominante + título + definición breve
- Conexiones con flechas académicas y codificación cromática sobria
- Fondo azul petróleo con acentos dorados`,
    visualRules: `ESTILO MNEMOTÉCNICO:
- Paleta: azul petróleo, dorado, marfil, grafito — sin neón
- Símbolos oversized pero formales (no cartoon)
- Tipografía clara, estilo atlas académico`,
    qualityTail:
      "Ultra detailed, 8K ready, legal mnemonic atlas map, sophisticated visual memory aid, postgraduate law study, elegant legal symbols, no cartoon.",
    forbidden:
      "NO caricaturas. NO neón. NO personajes exagerados. NO estilo escolar. NO emojis. NO detective cartoon.",
  },
  exam: {
    id: "exam",
    label: "Lámina de Examen",
    geminiTemperature: 0.25,
    expectedResult: "Lámina de repaso académica para evaluación universitaria.",
    directive: `MODO LÁMINA DE EXAMEN — COMPORTAMIENTO EXCLUSIVO:
Crea una LÁMINA DE REPASO PARA EXAMEN UNIVERSITARIO — funcional, clara, rigurosa.
PRIORIZA: definiciones exactas, artículos numerados, excepciones destacadas, comparaciones doctrinales, conceptos preguntables.
Estilo: ficha académica premium (Harvard/Yale study sheet), NO ficha escolar.`,
    layout: `LAYOUT EXAMEN:
- Póster 16:9 tipo lámina académica
- Secciones: Definiciones | Artículos | Excepciones | Comparaciones | Preguntas clave
- Tipografía editorial, máximo contraste, fondo marfil o grafito`,
    visualRules: `ESTILO EXAMEN:
- Paleta: grafito, marfil, azul petróleo, acentos dorado y rojo institucional para excepciones
- Iconografía mínima y elegante
- Alta densidad de texto útil, cero decoración escolar`,
    qualityTail:
      "Ultra detailed, 8K ready, university law exam review sheet, academic revision poster, clear typography, postgraduate level, minimal decoration.",
    forbidden:
      "NO caricaturas. NO colores infantiles. NO infografía escolar. NO emojis. NO ilustraciones narrativas.",
  },
  legal_premium: {
    id: "legal_premium",
    label: "Manual Jurídico",
    geminiTemperature: 0.3,
    expectedResult: "Manual jurídico ilustrado de élite, estilo biblioteca de posgrado.",
    directive: `MODO MANUAL JURÍDICO — COMPORTAMIENTO EXCLUSIVO:
Representación FORMAL estilo MANUAL JURÍDICO PREMIUM / tratado universitario ilustrado.
PRIORIZA: tribunales, jueces en composición sobria (sin caricatura), expedientes, códigos, doctrina, jurisprudencia, sello oficial, tipografía serif.
Sensación: biblioteca Yale/Oxford, despacho de élite, tratado de maestría.`,
    layout: `LAYOUT MANUAL:
- Composición simétrica formal con marco dorado
- Elementos: columnas clásicas, balanza, códigos encuadernados, expedientes apilados
- Banners con nombre del tema en tipografía serif`,
    visualRules: `ESTILO MANUAL:
- Iluminación sobria cinematográfica, texturas madera y pergamino
- Paleta: petróleo, dorado, marfil, grafito
- Iconografía clásica jurídica peruana`,
    qualityTail:
      "Ultra detailed, 8K ready, premium legal manual atlas page, formal law textbook illustration, postgraduate level, serif typography.",
    forbidden:
      "NO caricaturas. NO estilo escolar. NO emojis. NO neón. NO infografía colorida juvenil.",
  },
  jurisprudence: {
    id: "jurisprudence",
    label: "Atlas Jurisprudencial",
    geminiTemperature: 0.35,
    expectedResult: "Mapa jurisprudencial con precedentes, sentencias y evolución doctrinal.",
    directive: `MODO ATLAS JURISPRUDENCIAL — COMPORTAMIENTO EXCLUSIVO:
Crea un MAPA JURISPRUDENCIAL VISUAL de nivel posgrado.
PRIORIZA: líneas de tiempo jurídicas, precedentes, sentencias emblemáticas, ratios decidendi, evolución doctrinal, expedientes numerados.
Estilo: Bloomberg legal timeline / Harvard case law map.`,
    layout: `LAYOUT JURISPRUDENCIA:
- Línea de tiempo principal atravesando el póster 16:9
- Nodos hexagonales por sentencia (nombre, fecha, ratio)
- Flechas de evolución doctrinal entre precedentes
- Código cromático por era o tribunal`,
    visualRules: `ESTILO JURISPRUDENCIAL:
- Azul petróleo, grafito, dorado para precedentes clave
- Iconos: expediente, sello judicial, tomo de jurisprudencia
- Timeline editorial profesional`,
    qualityTail:
      "Ultra detailed, 8K ready, jurisprudential legal atlas, case law evolution map, precedent visualization, postgraduate law.",
    forbidden:
      "NO caricaturas. NO infografía escolar. NO emojis. NO nodos genéricos sin nombres de fallos.",
  },
  professor: {
    id: "professor",
    label: "Rúbrica Docente",
    geminiTemperature: 0.35,
    expectedResult: "Atlas visual alineado a la rúbrica y criterios del docente.",
    directive: `MODO RÚBRICA DOCENTE — COMPORTAMIENTO EXCLUSIVO:
Adapta el prompt a la RÚBRICA DEL DOCENTE manteniendo estándar ATLAS JURÍDICO UNIVERSITARIO.
Si la rúbrica pide mapa conceptual, atlas, línea de tiempo, etc. — cumplir ese formato con rigor de posgrado.
Nunca degradar a estilo escolar aunque la rúbrica pida creatividad.`,
    layout: `LAYOUT RÚBRICA:
- Seguir estructura exacta de la rúbrica
- Si no especifica: atlas jurídico con tema central y nodos periféricos
- Incluir secciones que la rúbrica evalúa`,
    visualRules: `ESTILO RÚBRICA:
- Formalidad de maestría por defecto
- Paleta petróleo/dorado/marfil/grafito salvo que la rúbrica indique otra
- Criterios de evaluación reflejados visualmente`,
    qualityTail:
      "Ultra detailed, 8K ready, rubric-aligned legal atlas, postgraduate academic deliverable, premium law visualization.",
    forbidden:
      "NO ignorar rúbrica. NO estilo escolar. NO caricaturas. NO emojis.",
  },
};

export function modeLabel(mode: VisualPromptMode): string {
  return MODE_PROMPT_CONFIG[mode].label;
}

export function expectedResultForMode(mode: VisualPromptMode): string {
  return MODE_PROMPT_CONFIG[mode].expectedResult;
}
