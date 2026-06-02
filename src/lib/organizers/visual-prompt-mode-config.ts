import type { VisualPromptMode, VisualCreativityLevel } from "@/lib/organizers/visual-prompt-types";

export const VISUAL_IMAGE_MODULE_TITLE = "Crear Imagen Educativa IA";
export const VISUAL_IMAGE_MODULE_SUBTITLE =
  "Convertimos tu PDF en un prompt listo para pegar en Gemini y obtener una imagen educativa profesional.";

export const HOW_IT_WORKS_STEPS = [
  "Analizamos tu PDF.",
  "Identificamos conceptos clave.",
  "Construimos un prompt profesional.",
  "Puedes personalizarlo.",
  "Copias el prompt.",
  "Lo pegas en Gemini.",
  "Obtienes una imagen educativa de alta calidad.",
] as const;

export const UNIVERSAL_QUALITY_BLOCK = `
Ultra detailed, 4K, educational infographic, professional illustration, visual learning, rich colors, high information density, modern design, university level, realistic illustrations, premium academic poster, cinematic lighting, professional composition.
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
    emoji: "📐",
    description: "Formal, académico, poco experimental.",
    directive:
      "Estilo conservador: formal, académico, sobrio, tipografía clara, composición ordenada, mínima experimentación visual.",
  },
  {
    id: "balanced",
    label: "Equilibrado",
    emoji: "⚖️",
    description: "Balance entre claridad y diseño atractivo.",
    directive:
      "Estilo equilibrado: balance entre claridad académica y diseño atractivo, ilustraciones moderadas, buena legibilidad.",
  },
  {
    id: "creative",
    label: "Creativo",
    emoji: "🎨",
    description: "Más ilustraciones y metáforas visuales.",
    directive:
      "Estilo creativo: más ilustraciones, metáforas visuales expresivas, paleta colorida, escenas narrativas educativas.",
  },
  {
    id: "extreme",
    label: "Extremo",
    emoji: "✨",
    description: "Máximo impacto visual y escenas memorables.",
    directive:
      "Estilo extremo: máximo impacto visual, escenas memorables e innovadoras, colores intensos, composición audaz, diseño imposible de olvidar.",
  },
];

export const PERSONALIZATION_QUICK_CHIPS: Array<{
  emoji: string;
  label: string;
  text: string;
}> = [
  { emoji: "🎨", label: "Más colores", text: "Quiero más colores vibrantes." },
  { emoji: "📚", label: "Más ejemplos", text: "Agrega más ejemplos concretos." },
  { emoji: "⚖️", label: "Más jurisprudencia", text: "Incluye más jurisprudencia y precedentes." },
  { emoji: "🧠", label: "Más memoria visual", text: "Prioriza técnicas de memoria visual y metáforas." },
  { emoji: "🎓", label: "Preparación examen", text: "Enfócate en preparación para examen." },
  { emoji: "🏛️", label: "Más artículos", text: "Prioriza artículos de ley visibles." },
  { emoji: "🖼️", label: "Estilo Canva", text: "Estilo moderno tipo Canva, limpio y colorido." },
  { emoji: "📖", label: "Libro ilustrado", text: "Estilo libro ilustrado educativo." },
  { emoji: "👨‍🏫", label: "Académico", text: "Estilo académico formal universitario." },
  { emoji: "✨", label: "Más creatividad", text: "Más creatividad e impacto visual." },
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
    label: "Infografía",
    geminiTemperature: 0.5,
    expectedResult: "Infografía educativa colorida, tipo enciclopedia visual moderna.",
    directive: `MODO INFOGRAFÍA — COMPORTAMIENTO EXCLUSIVO:
Crea una INFOGRAFÍA VISUAL MODERNA estilo atlas educativo / enciclopedia ilustrada.
PRIORIZA: colores vibrantes saturados, personajes educativos, escenas narrativas, mini ilustraciones por concepto, conexiones visuales curvas con profundidad, alta densidad informativa, composición tipo Gemini Canvas / National Geographic educativo.
El resultado debe ser ATRACTIVO, COLORIDO y EXPLORABLE — no un diagrama técnico.`,
    layout: `LAYOUT INFOGRAFÍA:
- Formato horizontal 16:9, póster panorámico
- Tema central grande con halo luminoso
- Subtemas en disposición radial orgánica alrededor del centro
- Cada subtema con mini escena ilustrada independiente
- Flechas curvas con glow conectando conceptos relacionados
- Texto integrado legible en español dentro de la imagen`,
    visualRules: `ESTILO VISUAL INFOGRAFÍA:
- Paleta rica: azul conceptos, verde principios, naranja casos, morado ejemplos, amarillo comparaciones, rojo artículos
- Iluminación cinematográfica, fondo oscuro elegante con gradientes
- Personajes y objetos con volumen 3D suave
- Iconografía temática jurídica peruana`,
    qualityTail:
      "Ultra detailed, 4K, vibrant educational infographic, visual encyclopedia, rich colors, high information density, modern illustrated atlas, professional composition, university level.",
    forbidden:
      "NO flowchart boxes. NO wireframes. NO empty circles. NO boring node graphs. NO minimalist exam sheet.",
  },
  memorization: {
    id: "memorization",
    label: "Memorización",
    geminiTemperature: 0.65,
    expectedResult: "Mapa visual exagerado diseñado para memorizar a largo plazo.",
    directive: `MODO MEMORIZACIÓN — COMPORTAMIENTO EXCLUSIVO:
Diseña una imagen para MEMORIA DE LARGO PLAZO usando metáforas visuales EXAGERADAS e INOLVIDABLES.
PRIORIZA: asociaciones absurdas pero memorables, símbolos gigantes, personajes caricaturescos, colores neón intensos, escenas dramáticas, contraste extremo.
Cada concepto debe convertirse en una imagen mental imposible de olvidar.
Ejemplos OBLIGATORIOS de estilo:
- Nulidad → contrato roto EXPLOTANDO con chispas
- Buena fe → juez o negociador con HALO DE LUZ dorada
- Interpretación → DETECTIVE JURÍDICO con lupa gigante
- Obligación → cadena luminosa imposible de romper
- Código Civil → libro jurídico GIGANTE flotante`,
    layout: `LAYOUT MEMORIZACIÓN:
- Composición tipo "mapa mental ilustrado" con escenas independientes grandes
- Cada concepto ocupa un bloque visual dominante (no texto pequeño)
- Metáforas visuales ocupan más espacio que las etiquetas
- Fondo dinámico con energía visual (no formal ni sobrio)`,
    visualRules: `ESTILO VISUAL MEMORIZACIÓN:
- Colores neón: magenta, cian, amarillo eléctrico, naranja intenso
- Estilo semi-realista caricaturesco (no corporativo)
- Emociones exageradas en personajes
- Símbolos oversized que dominan la escena`,
    qualityTail:
      "Ultra detailed, 4K, memorable visual mnemonics, exaggerated metaphors, bold symbols, vivid neon colors, unforgettable educational illustration, mnemonic device poster.",
    forbidden:
      "NO formal legal manual style. NO minimalist layout. NO small text blocks. NO sober corporate design. NO timeline charts.",
  },
  exam: {
    id: "exam",
    label: "Examen",
    geminiTemperature: 0.25,
    expectedResult: "Lámina de repaso clara y directa para evaluación.",
    directive: `MODO EXAMEN — COMPORTAMIENTO EXCLUSIVO:
Crea una LÁMINA DE REPASO PARA EXAMEN — funcional, clara, orientada a evaluación.
PRIORIZA: definiciones exactas visibles, artículos de ley numerados, excepciones destacadas en rojo, comparaciones en columnas, preguntas frecuentes de examen, jerarquía tipográfica estricta.
ELIMINA: decoración innecesaria, personajes caricaturescos, escenas narrativas largas, efectos dramáticos, colores saturados decorativos.
El estudiante debe poder REPASAR para un examen solo mirando la imagen.`,
    layout: `LAYOUT EXAMEN:
- Formato tipo ficha de repaso / cheat sheet académico
- Secciones claramente delimitadas: Definiciones | Artículos | Excepciones | Comparaciones | Preguntas clave
- Tipografía grande y legible, máximo contraste
- Listas numeradas, tablas comparativas simples
- Fondo claro o oscuro neutro sin distracciones`,
    visualRules: `ESTILO VISUAL EXAMEN:
- Paleta limitada: blanco/negro/gris + acentos rojo (excepciones) y azul (definiciones)
- Iconos mínimos funcionales (no ilustraciones elaboradas)
- Densidad de TEXTO ÚTIL alta, densidad de decoración baja
- Badges para "Examen", "Art.", "Excepción"`,
    qualityTail:
      "Ultra detailed, 4K, exam review sheet, study cheat sheet, clear typography, high readability, academic revision poster, minimal decoration, test preparation layout.",
    forbidden:
      "NO cartoon characters. NO neon colors. NO cinematic scenes. NO encyclopedia atlas style. NO narrative illustrations. NO decorative glow effects.",
  },
  legal_premium: {
    id: "legal_premium",
    label: "Jurídico Premium",
    geminiTemperature: 0.35,
    expectedResult: "Representación jurídica formal estilo manual premium.",
    directive: `MODO JURÍDICO PREMIUM — COMPORTAMIENTO EXCLUSIVO:
Crea una representación FORMAL Y PROFESIONAL estilo MANUAL JURÍDICO PREMIUM.
PRIORIZA: tribunales majestuosos, jueces con toga, expedientes numerados, códigos y libros jurídicos, sello oficial, tipografía serif elegante, tono académico universitario peruano, doctrina y jurisprudencia citada visualmente.
Sensación: biblioteca jurídica de élite, despacho de abogado premium, tratado universitario ilustrado.`,
    layout: `LAYOUT JURÍDICO PREMIUM:
- Composición simétrica, formal, con marco elegante
- Columnas clásicas, balanza de la justicia como elemento central secundario
- Expedientes, códigos y documentos legales apilados con precisión
- Escalas de grises + dorado + burdeos como acentos
- Tipografía serif, banners con nombre del tema`,
    visualRules: `ESTILO VISUAL JURÍDICO PREMIUM:
- Iluminación sobria, sombras suaves, texturas de papel y madera
- Iconografía clásica: balanza, columna, martillo, pergamino
- Sin colores infantiles ni metáforas exageradas
- Referencias visuales a derecho peruano (Palacio de Justicia)`,
    qualityTail:
      "Ultra detailed, 4K, premium legal manual illustration, formal law textbook cover, professional legal document aesthetic, serif typography, dignified composition.",
    forbidden:
      "NO neon colors. NO cartoon style. NO mnemonic exaggerations. NO exam cheat sheet layout. NO playful characters.",
  },
  jurisprudence: {
    id: "jurisprudence",
    label: "Jurisprudencia",
    geminiTemperature: 0.4,
    expectedResult: "Mapa jurisprudencial con precedentes y evolución doctrinal.",
    directive: `MODO JURISPRUDENCIA — COMPORTAMIENTO EXCLUSIVO:
Crea un MAPA JURISPRUDENCIAL VISUAL que explique evolución de precedentes.
PRIORIZA: líneas de tiempo horizontales o verticales, sentencias emblemáticas como nodos, flechas de evolución doctrinal, expedientes numerados, ratios decidendi destacados, conexiones entre fallos relacionados, evolución histórica de la interpretación.
Sensación: mapa de precedentes del Tribunal Constitucional / Corte Suprema, línea jurisprudencial conectada.`,
    layout: `LAYOUT JURISPRUDENCIA:
- Línea de tiempo principal atravesando la composición
- Nodos circulares o hexagonales por sentencia/precedente (con nombre del fallo)
- Flechas de evolución entre precedentes
- Código de colores por era o tribunal
- Sección de "Ratio decidendi" y "Precedente vinculante"`,
    visualRules: `ESTILO VISUAL JURISPRUDENCIA:
- Colores: azul marino, gris pizarra, dorado para precedentes clave, rojo para sentencias revocatorias
- Iconos: expediente, sello judicial, martillo, libro de jurisprudencia
- Estilo infográfico timeline profesional (no caricatura)`,
    qualityTail:
      "Ultra detailed, 4K, jurisprudential timeline map, legal precedent visualization, case law evolution chart, court decision flow diagram, professional legal infographic.",
    forbidden:
      "NO mnemonic exaggerations. NO exam cheat sheet. NO cartoon encyclopedia. NO generic concept map without case names and dates.",
  },
  professor: {
    id: "professor",
    label: "Profesor",
    geminiTemperature: 0.4,
    expectedResult: "Trabajo visual alineado a la rúbrica y criterios del docente.",
    directive: `MODO PROFESOR — COMPORTAMIENTO EXCLUSIVO:
Adapta el prompt ESTRICTAMENTE a la RÚBRICA DEL DOCENTE adjunta.
PRIORIZA sobre cualquier estilo genérico:
1. Formato exacto solicitado en la rúbrica (mapa conceptual, infografía, línea de tiempo, etc.)
2. Criterios de evaluación y puntajes
3. Requisitos de creatividad, claridad, jerarquía, ejemplos e imágenes según la rúbrica
4. Cantidad de conceptos y profundidad exigida
Si la rúbrica pide un formato específico, el prompt debe describir ESE formato, no otro.
Si no hay rúbrica adjunta, genera un prompt equilibrado pidiendo al estudiante adjuntar la rúbrica.`,
    layout: `LAYOUT PROFESOR:
- Seguir EXACTAMENTE la estructura indicada en la rúbrica
- Si la rúbrica no especifica layout, usar organizador visual con jerarquía clara
- Incluir secciones que la rúbrica evalúa explícitamente`,
    visualRules: `ESTILO VISUAL PROFESOR:
- Ajustar creatividad, color y formalidad según criterios de la rúbrica
- Si la rúbrica valora creatividad → colores e ilustraciones
- Si la rúbrica valora formalidad → estilo jurídico premium
- Mencionar explícitamente cómo cada criterio de la rúbrica se refleja visualmente`,
    qualityTail:
      "Ultra detailed, 4K, rubric-aligned academic visual, teacher evaluation criteria met, customized educational deliverable, professional student assignment quality.",
    forbidden:
      "NO ignorar criterios de la rúbrica. NO usar estilo genérico si la rúbrica especifica otro formato.",
  },
};

export function modeLabel(mode: VisualPromptMode): string {
  return MODE_PROMPT_CONFIG[mode].label;
}

export function expectedResultForMode(mode: VisualPromptMode): string {
  return MODE_PROMPT_CONFIG[mode].expectedResult;
}
