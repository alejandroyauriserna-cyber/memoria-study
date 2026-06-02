export type VisualPromptMode =
  | "infographic"
  | "memorization"
  | "exam"
  | "legal_premium"
  | "jurisprudence"
  | "professor";

export type DocumentVisualAnalysis = {
  centralTopic: string;
  subtopics: string[];
  concepts: string[];
  definitions: string[];
  principles: string[];
  norms: string[];
  articles: string[];
  jurisprudence: string[];
  authors: string[];
  doctrine: string[];
  comparisons: string[];
  exceptions: string[];
  practicalCases: string[];
  conceptualRelations: string[];
  examPriorities: string[];
  visualScenes: Array<{ concept: string; visualMetaphor: string }>;
};

export type RubricAnalysis = {
  fileName?: string;
  requestedFormat?: string;
  evaluationCriteria: string[];
  scoringLevels: string[];
  visualRequirements: string[];
  structureRequirements: string[];
  conceptCountHint?: string;
  depthRequired?: string;
  creativityRequired: boolean;
  examplesRequired: boolean;
  imagesRequired: boolean;
  hierarchyRequired: boolean;
  clarityRequired: boolean;
  comparisonsRequired: boolean;
};

export type VisualCreativityLevel = "conservative" | "balanced" | "creative" | "extreme";

/** Nivel académico que modifica radicalmente densidad, estructura y profundidad del prompt. */
export type VisualAcademicLevel =
  | "basic"
  | "undergraduate"
  | "postgraduate"
  | "thesis"
  | "litigant";

export type VisualPremiumPrompt = {
  title: string;
  /** Título opcional definido por el estudiante */
  studentTitle?: string;
  mode: VisualPromptMode;
  /** Nivel académico seleccionado por el estudiante */
  academicLevel?: VisualAcademicLevel;
  /** Prompt generado por IA a partir del PDF, modo y rúbrica */
  basePrompt: string;
  /** Instrucciones opcionales del estudiante */
  studentPersonalization?: string;
  creativityLevel?: VisualCreativityLevel;
  /** Prompt final listo para Gemini (base + creatividad + personalización) */
  prompt: string;
  analysis?: DocumentVisualAnalysis;
  rubricAnalysis?: RubricAnalysis;
  explanation: string[];
  hasRubric: boolean;
  generatedAt: string;
};

export const VISUAL_IMAGE_FEATURE_NAME = "Atlas Jurídico IA";
export const ATLAS_JURIDICO_FEATURE_NAME = VISUAL_IMAGE_FEATURE_NAME;

export const VISUAL_PROMPT_MODES: Array<{
  id: VisualPromptMode;
  label: string;
  emoji: string;
  description: string;
  expectedResult: string;
  expectedHighlights: string[];
}> = [
  {
    id: "infographic",
    label: "Atlas Jurídico",
    emoji: "",
    description: "Atlas visual universitario estilo Harvard / National Geographic.",
    expectedResult: "Atlas jurídico de posgrado, editorial premium.",
    expectedHighlights: [
      "Diagramas doctrinales profesionales",
      "Tema central con nodos periféricos",
      "Alta densidad informativa",
      "Paleta petróleo, dorado y marfil",
      "Estilo revista jurídica premium",
    ],
  },
  {
    id: "memorization",
    label: "Mapa Mnemotécnico",
    emoji: "",
    description: "Símbolos jurídicos elegantes para memoria de largo plazo.",
    expectedResult: "Mapa mnemotécnico doctrinal con rigor académico.",
    expectedHighlights: [
      "Símbolos jurídicos memorables",
      "Asociaciones mentales formales",
      "Anclajes visuales por concepto",
      "Recordación rápida en examen",
      "Sin estilo caricaturesco",
    ],
  },
  {
    id: "exam",
    label: "Lámina de Examen",
    emoji: "",
    description: "Repaso universitario: definiciones, artículos y excepciones.",
    expectedResult: "Lámina de repaso académica para evaluación.",
    expectedHighlights: [
      "Definiciones exactas visibles",
      "Artículos numerados",
      "Excepciones resaltadas",
      "Comparaciones en columnas",
      "Diseño funcional sin decoración",
    ],
  },
  {
    id: "legal_premium",
    label: "Manual Jurídico",
    emoji: "",
    description: "Tratado ilustrado: tribunales, códigos, expedientes, doctrina.",
    expectedResult: "Manual jurídico ilustrado de élite.",
    expectedHighlights: [
      "Expedientes y códigos",
      "Tribunales y salas formales",
      "Jurisprudencia citada",
      "Diseño sobrio y académico",
      "Tipografía editorial serif",
    ],
  },
  {
    id: "jurisprudence",
    label: "Atlas Jurisprudencial",
    emoji: "",
    description: "Líneas de tiempo, precedentes y evolución doctrinal.",
    expectedResult: "Mapa jurisprudencial de posgrado.",
    expectedHighlights: [
      "Línea de tiempo jurídica",
      "Precedentes y sentencias",
      "Evolución doctrinal",
      "Ratios decidendi visibles",
      "Conexiones entre fallos",
    ],
  },
  {
    id: "professor",
    label: "Rúbrica Docente",
    emoji: "",
    description: "Atlas alineado a criterios, puntajes y formato del docente.",
    expectedResult: "Entrega visual alineada a la evaluación.",
    expectedHighlights: [
      "Adaptado a la rúbrica",
      "Criterios de evaluación",
      "Formato solicitado por el docente",
      "Puntajes y profundidad exigida",
      "Requisitos visuales del profesor",
    ],
  },
];

export const VISUAL_ACADEMIC_LEVELS: Array<{
  id: VisualAcademicLevel;
  label: string;
  description: string;
  idealFor: string;
  expectedResult: string;
  expectedHighlights: string[];
}> = [
  {
    id: "basic",
    label: "Básico",
    description: "Comprensión rápida con pocos conceptos y relaciones simples.",
    idealFor: "Primeros ciclos · primer contacto con el tema · repaso rápido",
    expectedResult: "Visualización simple pero elegante, introductoria.",
    expectedHighlights: [
      "Pocos conceptos centrales",
      "Mucha claridad visual",
      "Poco texto por bloque",
      "Relaciones simples",
      "Colores distintivos por categoría",
    ],
  },
  {
    id: "undergraduate",
    label: "Universitario",
    description: "Preparación de parciales y finales con densidad doctrinal completa.",
    idealFor: "Exámenes parciales · finales · repaso universitario",
    expectedResult: "Mapa visual académico completo para evaluación.",
    expectedHighlights: [
      "Principios jurídicos",
      "Artículos relevantes",
      "Comparaciones doctrinales",
      "Casos prácticos",
      "Jerarquía de 8 niveles",
    ],
  },
  {
    id: "postgraduate",
    label: "Posgrado",
    description: "Análisis profundo con doctrina avanzada y jurisprudencia.",
    idealFor: "Maestrías · especializaciones · sustentaciones",
    expectedResult: "Atlas jurídico profesional de posgrado.",
    expectedHighlights: [
      "Doctrina avanzada y autores",
      "Jurisprudencia central",
      "Corrientes interpretativas",
      "Comparaciones complejas",
      "Estilo Harvard / Yale / Oxford",
    ],
  },
  {
    id: "thesis",
    label: "Tesis",
    description: "Investigación con máxima profundidad y conflictos doctrinales.",
    idealFor: "Tesis · investigación jurídica · papers indexados",
    expectedResult: "Visualización de investigación académica.",
    expectedHighlights: [
      "Problemas jurídicos e hipótesis",
      "Conflictos doctrinales",
      "Variables y relaciones causales",
      "Líneas jurisprudenciales",
      "Desarrollo argumentativo",
    ],
  },
  {
    id: "litigant",
    label: "Litigante",
    description: "Pensar como abogado: conflictos, argumentos y estrategia procesal.",
    idealFor: "Práctica preprofesional · litigación · consultoría · audiencias",
    expectedResult: "Material de estrategia jurídica aplicada al caso.",
    expectedHighlights: [
      "Problema jurídico principal",
      "Argumentos y contraargumentos",
      "Precedentes aplicables",
      "Riesgos y defensas",
      "Consecuencias prácticas",
    ],
  },
];

export const RUBRIC_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/jpg";

export const GEMINI_APP_URL = "https://gemini.google.com/app";

const RUBRIC_MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

function rubricMimeForFile(fileName: string, declared?: string) {
  if (declared && declared !== "application/octet-stream") return declared;
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  return RUBRIC_MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export function isSupportedRubricFile(file: File) {
  const mime = rubricMimeForFile(file.name, file.type);
  return (
    mime === "application/pdf" ||
    mime.startsWith("image/") ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  );
}
