import type { VisualPromptMode, VisualCreativityLevel } from "@/lib/organizers/visual-prompt-types";

export const ATLAS_JURIDICO_MODULE_TITLE = "Atlas Jurídico IA";
/** @deprecated Use ATLAS_JURIDICO_MODULE_TITLE */
export const VISUAL_IMAGE_MODULE_TITLE = ATLAS_JURIDICO_MODULE_TITLE;

export const ATLAS_JURIDICO_MODULE_SUBTITLE =
  "Transformamos tu PDF en un prompt para generar atlas visuales jurídicos universitarios de alta gama en Gemini.";
/** @deprecated Use ATLAS_JURIDICO_MODULE_SUBTITLE */
export const VISUAL_IMAGE_MODULE_SUBTITLE = ATLAS_JURIDICO_MODULE_SUBTITLE;

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
MANDATO ACADÉMICO — ATLAS JURÍDICO UNIVERSITARIO DE ALTA GAMA:
Nivel: Facultad de Derecho, Posgrado, Maestría.
Inspiración editorial: Harvard Law Review, National Geographic Atlas, The Economist Visual Essays, Bloomberg Graphics, Yale Law School, Oxford Law, Visual Capitalist (legal edition).
NO crear infografía escolar. NO material de primaria ni secundaria.

PROHIBIDO ABSOLUTAMENTE:
caricaturas, estilo infantil, dibujos escolares, emojis, personajes sonrientes, personajes repetidos, ilustraciones tipo primaria, estilo Canva juvenil, colores saturados infantiles, iconos clipart.

OBLIGATORIO:
diagramas profesionales, esquemas doctrinales, iconografía jurídica elegante, manuscritos, libros históricos, códigos civiles, sentencias, expedientes, tribunales, líneas doctrinales, mapas conceptuales avanzados, flechas académicas, relaciones de causalidad, jerarquías conceptuales, comparaciones doctrinales.

COMPOSICIÓN:
Tema principal en el centro. Alrededor: conceptos, principios, artículos, jurisprudencia, excepciones, doctrina.
Cada elemento: título + explicación breve + conexión visual lógica.

PALETA: azul petróleo, dorado, blanco marfil, gris grafito.
FORMATO: póster panorámico 16:9, resolución ultra alta, iluminación cinematográfica, aspecto editorial premium, alta densidad informativa.
Debe parecer una página extraída de un atlas jurídico moderno — material de maestría, no escolar.
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

export function buildFinalPrompt(
  basePrompt: string,
  options: {
    creativityLevel?: VisualCreativityLevel;
    studentPersonalization?: string | null;
  },
): string {
  const level = options.creativityLevel ?? "balanced";
  const creativity = CREATIVITY_LEVELS.find((item) => item.id === level) ?? CREATIVITY_LEVELS[1];

  const sections = [basePrompt.trim()];

  sections.push(`\nNIVEL DE CREATIVIDAD — ${creativity.label.toUpperCase()}:\n${creativity.directive}`);

  const personalization = options.studentPersonalization?.trim();
  if (personalization) {
    sections.push(
      `\nPERSONALIZACIÓN DEL ESTUDIANTE (INCORPORAR OBLIGATORIAMENTE):\n${personalization}`,
    );
  }

  let merged = sections.join("\n");

  if (!merged.includes("Harvard Law Review")) {
    merged = `${merged}\n\n${ATLAS_ACADEMIC_MANDATE}`;
  }

  const qualitySnippet = UNIVERSAL_QUALITY_BLOCK.slice(0, 30);
  if (!merged.includes("4K") && !merged.includes(qualitySnippet)) {
    merged = `${merged}\n\n${UNIVERSAL_QUALITY_BLOCK}`;
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
