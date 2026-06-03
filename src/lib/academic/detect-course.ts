import { buildSelection, findCourseById, getAllCycles } from "@/lib/academic/helpers";
import type { CourseDetectionResult } from "@/types/course-detection";

type CoursePattern = {
  courseId: string;
  keywords: string[];
  weight?: number;
};

const COURSE_PATTERNS: CoursePattern[] = [
  { courseId: "civil-ii-acto-juridico", keywords: ["acto jurídico", "acto juridico", "voluntad", "consentimiento", "incapacidad", "nulidad", "anulabilidad"], weight: 3 },
  { courseId: "civil-v-contratos", keywords: ["contrato", "contratos", "interpretación contractual", "interpretacion contractual", "obligación contractual", "resolución de contrato", "clausula", "cláusula"], weight: 3 },
  { courseId: "civil-iv-obligaciones", keywords: ["obligación", "obligacion", "obligaciones", "credito", "crédito", "deudor", "acreedor", "fuentes de las obligaciones", "modalidades de las obligaciones"], weight: 3 },
  { courseId: "civil-vi-familia", keywords: ["familia", "matrimonio", "patria potestad", "filiación", "regimen patrimonial", "régimen patrimonial", "union de hecho"], weight: 3 },
  { courseId: "civil-vii-sucesiones", keywords: ["sucesión", "sucesion", "sucesiones", "herencia", "testamento", "legado", "legítima", "legitima", "albacea"], weight: 3 },
  { courseId: "civil-i-personas", keywords: ["persona natural", "persona jurídica", "capacidad", "estado civil", "principios generales", "derecho de personas"], weight: 2 },
  { courseId: "civil-iii-derechos-reales", keywords: ["derechos reales", "propiedad", "posesión", "posicion", "usucapión", "usucapion", "hipoteca", "prenda"], weight: 3 },
  { courseId: "constitucional-i", keywords: ["constitución", "constitucion", "estado peruano", "derechos fundamentales", "organización del estado", "poderes del estado"], weight: 2 },
  { courseId: "constitucional-ii", keywords: ["control de constitucionalidad", "tribunal constitucional", "garantías constitucionales", "recurso de amparo constitucional"], weight: 2 },
  { courseId: "procesal-constitucional", keywords: ["proceso constitucional", "habeas corpus", "habeas data", "acción popular", "accion popular"], weight: 3 },
  { courseId: "teoria-general-derechos-humanos", keywords: ["derechos humanos", "derecho internacional de los derechos humanos", "convención americana", "convencion americana", "corte interamericana"], weight: 3 },
  { courseId: "teoria-juridica-delito-i", keywords: ["teoría del delito", "teoria del delito", "tipicidad", "antijuridicidad", "culpabilidad", "dolo", "imprudencia", "penal general"], weight: 2 },
  { courseId: "teoria-juridica-delito-ii", keywords: ["concurso de delitos", "penas", "consecuencias jurídicas", "reincidencia", "suspensión de pena"], weight: 2 },
  { courseId: "penal-especial-i", keywords: ["delitos contra la vida", "delitos contra el patrimonio", "hurto", "robo", "estafa", "penal especial"], weight: 2 },
  { courseId: "penal-especial-ii", keywords: ["delitos funcionarios", "corrupción", "corrupcion", "peculado", "cohecho"], weight: 2 },
  { courseId: "penal-especial-iii", keywords: ["delitos informáticos", "delitos informaticos", "lavado de activos", "terrorismo", "tráfico ilícito"], weight: 2 },
  { courseId: "procesal-civil-i", keywords: ["proceso civil", "demanda civil", "contestación", "contestacion", "sentencia civil", "proceso ordinario"], weight: 2 },
  { courseId: "procesal-civil-ii", keywords: ["apelación civil", "apelacion civil", "casación civil", "ejecución de sentencia", "proceso sumarísimo"], weight: 2 },
  { courseId: "procesal-civil-iii", keywords: ["proceso civil avanzado", "ejecución civil", "incidente procesal"], weight: 2 },
  { courseId: "procesal-penal-i", keywords: ["proceso penal", "investigación preparatoria", "investigacion preparatoria", "prisión preventiva", "prision preventiva"], weight: 2 },
  { courseId: "procesal-penal-ii", keywords: ["juicio oral", "etapa intermedia", "recursos penales", "apelación penal"], weight: 2 },
  { courseId: "administrativo-i", keywords: ["acto administrativo", "administración pública", "administracion publica", "procedimiento administrativo", "silencio administrativo"], weight: 2 },
  { courseId: "administrativo-ii", keywords: ["servicio civil", "función pública", "funcion publica", "responsabilidad administrativa"], weight: 2 },
  { courseId: "contencioso-administrativo", keywords: ["contencioso administrativo", "nulidad de acto administrativo", "acción contenciosa"], weight: 3 },
  { courseId: "derecho-trabajo-i", keywords: ["contrato de trabajo", "relación laboral", "relacion laboral", "derecho del trabajo", "jornada laboral"], weight: 2 },
  { courseId: "derecho-trabajo-ii", keywords: ["despido", "sindicato", "negociación colectiva", "negociacion colectiva", "seguridad social"], weight: 2 },
  { courseId: "procesal-trabajo", keywords: ["proceso laboral", "demanda laboral", "reinstalación", "reinstalacion laboral"], weight: 3 },
  { courseId: "derecho-societario", keywords: ["sociedad", "societario", "sociedad anónima", "sociedad anonima", "junta general", "accionista", "concurso de acreedores"], weight: 3 },
  { courseId: "titulos-valores", keywords: ["título valor", "titulo valor", "letra de cambio", "pagare", "pagaré", "cheque"], weight: 3 },
  { courseId: "contratos-modernos", keywords: ["contrato moderno", "contratos modernos", "arrendamiento financiero", "franquicia"], weight: 2 },
  { courseId: "tributario-i", keywords: ["tributo", "tributación", "tributacion", "impuesto", "sunat", "obligación tributaria", "igv", "renta"], weight: 2 },
  { courseId: "tributario-ii", keywords: ["fiscalización tributaria", "fiscalizacion tributaria", "determinación de la deuda", "devolución tributaria"], weight: 2 },
  { courseId: "internacional-publico", keywords: ["derecho internacional público", "derecho internacional publico", "tratado internacional", "soberanía", "soberania"], weight: 2 },
  { courseId: "internacional-privado", keywords: ["derecho internacional privado", "ley aplicable", "conflicto de leyes", "extranjería"], weight: 2 },
  { courseId: "historia-general-derecho", keywords: ["historia del derecho", "derecho peruano", "derecho latinoamericano", "codificación", "codificacion", "derecho romano"], weight: 2 },
  { courseId: "filosofia-derecho", keywords: ["filosofía del derecho", "filosofia del derecho", "justicia", "positivismo jurídico", "iusnaturalismo"], weight: 2 },
  { courseId: "argumentacion-juridica", keywords: ["argumentación jurídica", "argumentacion juridica", "silogismo jurídico", "interpretación jurídica"], weight: 3 },
  { courseId: "marcs", keywords: ["mediación", "arbitraje", "conciliación", "conciliacion", "marcs", "resolución alternativa"], weight: 3 },
  { courseId: "notarial-registral", keywords: ["notaría", "notaria", "registro público", "registro publico", "inscripción registral"], weight: 3 },
  { courseId: "derecho-economico-analisis", keywords: ["derecho económico", "derecho economico", "libre competencia", "indecopi", "defensa de la competencia", "análisis económico del derecho"], weight: 3 },
  { courseId: "derecho-ambiental", keywords: ["derecho ambiental", "medio ambiente", "impacto ambiental", "recursos naturales"], weight: 2 },
  { courseId: "etica-profesional", keywords: ["ética profesional", "etica profesional", "deontología", "deontologia"], weight: 2 },
  { courseId: "derecho-integracion", keywords: ["integración andina", "integracion andina", "comunidad andina", "unión aduanera"], weight: 3 },
  { courseId: "proyecto-tesis", keywords: ["tesis", "proyecto de tesis", "metodología de tesis", "planteamiento del problema"], weight: 2 },
  { courseId: "metodologia-investigacion-juridica-i", keywords: ["investigación jurídica", "investigacion juridica", "metodología jurídica", "planteamiento jurídico"], weight: 2 },
  { courseId: "metodologia-investigacion-juridica-ii", keywords: ["marco teórico jurídico", "marco teorico juridico", "hipótesis jurídica", "metodología cuantitativa jurídica"], weight: 2 },
  { courseId: "introduccion-ciencias-juridicas", keywords: ["ciencias jurídicas", "ciencias juridicas", "introducción al derecho", "introduccion al derecho", "norma jurídica"], weight: 2 },
];

const LEGAL_CONCEPT_PATTERNS = [
  "acto jurídico",
  "contrato",
  "obligación",
  "proceso",
  "amparo",
  "delito",
  "tributo",
  "sociedad",
  "herencia",
  "familia",
  "constitución",
  "derechos humanos",
  "jurisdicción",
  "competencia",
  "nulidad",
  "responsabilidad",
  "interpretación",
  "fundamento legal",
  "jurisprudencia",
  "doctrina",
];

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function scoreCourse(text: string, pattern: CoursePattern) {
  const normalized = normalizeText(text);
  const matched: string[] = [];
  let score = 0;

  for (const keyword of pattern.keywords) {
    const normalizedKeyword = normalizeText(keyword);
    if (normalized.includes(normalizedKeyword)) {
      matched.push(keyword);
      score += pattern.weight ?? 1;
    }
  }

  return { score, matched };
}

function detectConcepts(text: string): string[] {
  const normalized = normalizeText(text);
  return LEGAL_CONCEPT_PATTERNS.filter((concept) =>
    normalized.includes(normalizeText(concept)),
  ).slice(0, 8);
}

function estimateDifficulty(text: string, conceptCount: number): CourseDetectionResult["difficulty"] {
  const normalized = normalizeText(text);
  const advancedSignals = [
    "jurisprudencia",
    "doctrina",
    "casación",
    "casacion",
    "interpretación sistemática",
    "control difuso",
    "concurso ideal",
    "teoría de la imputación",
  ];
  const basicSignals = ["definición", "definicion", "concepto", "introducción", "introduccion", "elementos"];

  const advancedHits = advancedSignals.filter((s) => normalized.includes(normalizeText(s))).length;
  const basicHits = basicSignals.filter((s) => normalized.includes(normalizeText(s))).length;

  if (advancedHits >= 2 || conceptCount >= 6) return "avanzado";
  if (basicHits >= 2 && advancedHits === 0) return "basico";
  return "intermedio";
}

export function detectCourseFromText(text: string): CourseDetectionResult | null {
  const sample = text.slice(0, 120_000);
  if (!sample.trim()) return null;

  const scores = COURSE_PATTERNS.map((pattern) => {
    const { score, matched } = scoreCourse(sample, pattern);
    return { pattern, score, matched };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scores.length) {
    const cycle3 = getAllCycles().find((c) => c.cycleNumber === 3);
    const fallback =
      cycle3?.courses.find((c) => c.id === "civil-ii-acto-juridico") ?? cycle3?.courses[0];
    if (!fallback) return null;
    const selection = buildSelection({ cycleNumber: 3, courseId: fallback.id });
    if (!selection) return null;

    return {
      courseId: selection.courseId,
      courseName: selection.courseName,
      cycleNumber: selection.cycleNumber,
      cycleLabel: selection.cycleLabel,
      yearNumber: selection.yearNumber,
      yearLabel: selection.yearLabel,
      confidence: 0.15,
      matchedKeywords: [],
      alternatives: [],
      conceptsDetected: detectConcepts(sample),
      difficulty: estimateDifficulty(sample, 0),
    };
  }

  const best = scores[0];
  const located = findCourseById(best.pattern.courseId);
  if (!located) return null;

  const selection = buildSelection({
    cycleNumber: located.cycle.cycleNumber,
    courseId: located.course.id,
  });
  if (!selection) return null;

  const maxScore = Math.max(...scores.map((item) => item.score), 1);
  const conceptsDetected = detectConcepts(sample);

  return {
    courseId: selection.courseId,
    courseName: selection.courseName,
    cycleNumber: selection.cycleNumber,
    cycleLabel: selection.cycleLabel,
    yearNumber: selection.yearNumber,
    yearLabel: selection.yearLabel,
    confidence: Math.min(0.98, Math.max(0.25, best.score / maxScore)),
    matchedKeywords: best.matched.slice(0, 6),
    alternatives: scores.slice(1, 4).flatMap((item) => {
      const alt = findCourseById(item.pattern.courseId);
      if (!alt) return [];
      return [
        {
          courseId: alt.course.id,
          courseName: alt.course.name,
          cycleNumber: alt.cycle.cycleNumber,
          confidence: Math.min(0.9, item.score / maxScore),
        },
      ];
    }),
    conceptsDetected,
    difficulty: estimateDifficulty(sample, conceptsDetected.length),
  };
}

export function detectionToSelection(
  detection: CourseDetectionResult,
  weekNumber = 1,
) {
  return buildSelection({
    cycleNumber: detection.cycleNumber,
    courseId: detection.courseId,
    weekNumber,
  });
}
