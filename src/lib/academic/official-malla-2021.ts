/**
 * Malla curricular oficial — Derecho UNT 2021.
 * Única fuente de verdad para ciclos, cursos e IDs en MemoriaStudy.
 */

export type OfficialCourse = {
  id: string;
  name: string;
};

export type OfficialCycle = {
  number: number;
  label: string;
  courses: OfficialCourse[];
};

export const OFFICIAL_MALLA_2021: OfficialCycle[] = [
  {
    number: 1,
    label: "Ciclo I",
    courses: [
      { id: "desarrollo-pensamiento-matematico", name: "Desarrollo del Pensamiento Matemático" },
      { id: "comunicacion-argumentacion", name: "Comunicación y Argumentación" },
      { id: "desarrollo-personal-social", name: "Desarrollo Personal y Social" },
      { id: "historia-general-derecho", name: "Historia General del Derecho" },
      { id: "fundamentos-filosofia", name: "Fundamentos de Filosofía" },
      { id: "introduccion-ciencias-juridicas", name: "Introducción a las Ciencias Jurídicas" },
      { id: "liderazgo-trabajo-equipo", name: "Liderazgo y Trabajo en Equipo" },
    ],
  },
  {
    number: 2,
    label: "Ciclo II",
    courses: [
      { id: "lectura-produccion-textos-academicos", name: "Lectura y Producción de Textos Académicos" },
      { id: "gestion-aprendizajes", name: "Gestión de los Aprendizajes" },
      { id: "analisis-critico-realidad", name: "Análisis Crítico de la Realidad" },
      { id: "civil-i-personas", name: "Derecho Civil I: Principios Generales y Derecho de Personas" },
      { id: "constitucional-i", name: "Derecho Constitucional I" },
      { id: "filosofia-derecho", name: "Filosofía del Derecho" },
      { id: "introduccion-uso-tic", name: "Introducción al Uso de TIC" },
    ],
  },
  {
    number: 3,
    label: "Ciclo III",
    courses: [
      { id: "introduccion-investigacion-cientifica", name: "Introducción a la Investigación Científica" },
      { id: "desarrollo-sostenible", name: "Desarrollo Sostenible" },
      { id: "civil-ii-acto-juridico", name: "Derecho Civil II: Acto Jurídico" },
      { id: "etica-profesional", name: "Ética Profesional" },
      { id: "constitucional-ii", name: "Derecho Constitucional II" },
      { id: "teoria-juridica-delito-i", name: "Teoría Jurídica del Delito I" },
    ],
  },
  {
    number: 4,
    label: "Ciclo IV",
    courses: [
      { id: "logica-desarrollo-conocimiento-cientifico", name: "Lógica y Desarrollo del Conocimiento Científico" },
      { id: "cultura-politica-problematica-nacional", name: "Cultura Política y Problemática de la Realidad Nacional" },
      { id: "civil-iii-derechos-reales", name: "Derecho Civil III: Derechos Reales" },
      { id: "procesal-civil-i", name: "Derecho Procesal Civil I" },
      { id: "teoria-juridica-delito-ii", name: "Teoría Jurídica del Delito II" },
    ],
  },
  {
    number: 5,
    label: "Ciclo V",
    courses: [
      { id: "identidad-cultural-regional-nacional", name: "Identidad Cultural Regional y Nacional" },
      { id: "economia-emprendedurismo", name: "Economía y Emprendedurismo" },
      { id: "civil-iv-obligaciones", name: "Derecho Civil IV: Las Obligaciones" },
      { id: "administrativo-i", name: "Derecho Administrativo I" },
      { id: "procesal-civil-ii", name: "Derecho Procesal Civil II" },
      { id: "penal-especial-i", name: "Derecho Penal Especial I" },
    ],
  },
  {
    number: 6,
    label: "Ciclo VI",
    courses: [
      { id: "etica-derechos-humanos", name: "Ética y Derechos Humanos" },
      { id: "argumentacion-juridica", name: "Argumentación Jurídica" },
      { id: "civil-v-contratos", name: "Derecho Civil V: Contratos" },
      { id: "administrativo-ii", name: "Derecho Administrativo II" },
      { id: "procesal-civil-iii", name: "Derecho Procesal Civil III" },
      { id: "penal-especial-ii", name: "Derecho Penal Especial II" },
    ],
  },
  {
    number: 7,
    label: "Ciclo VII",
    courses: [
      { id: "civil-vi-familia", name: "Derecho Civil VI: Derecho de Familia" },
      { id: "procesal-penal-i", name: "Derecho Procesal Penal I" },
      { id: "marcs", name: "MARCs" },
      { id: "derecho-trabajo-i", name: "Derecho del Trabajo I" },
      { id: "internacional-publico", name: "Derecho Internacional Público" },
      { id: "penal-especial-iii", name: "Derecho Penal Especial III" },
    ],
  },
  {
    number: 8,
    label: "Ciclo VIII",
    courses: [
      { id: "civil-vii-sucesiones", name: "Derecho Civil VII: Derecho de Sucesiones" },
      { id: "procesal-penal-ii", name: "Derecho Procesal Penal II" },
      { id: "contencioso-administrativo", name: "Contencioso Administrativo" },
      { id: "derecho-trabajo-ii", name: "Derecho del Trabajo II" },
      { id: "contratos-modernos", name: "Contratos Modernos" },
      { id: "derecho-ambiental", name: "Derecho Ambiental" },
    ],
  },
  {
    number: 9,
    label: "Ciclo IX",
    courses: [
      { id: "metodologia-investigacion-juridica-i", name: "Metodología de la Investigación Jurídica I" },
      { id: "procesal-trabajo", name: "Derecho Procesal del Trabajo" },
      { id: "tributario-i", name: "Derecho Tributario I" },
      { id: "practica-dirigida-ix", name: "Práctica Dirigida" },
      { id: "derecho-societario", name: "Derecho Societario" },
    ],
  },
  {
    number: 10,
    label: "Ciclo X",
    courses: [
      { id: "metodologia-investigacion-juridica-ii", name: "Metodología de la Investigación Jurídica II" },
      { id: "titulos-valores", name: "Títulos Valores" },
      { id: "tributario-ii", name: "Derecho Tributario II" },
      { id: "practica-dirigida-x", name: "Práctica Dirigida" },
      { id: "procesal-constitucional", name: "Derecho Procesal Constitucional" },
    ],
  },
  {
    number: 11,
    label: "Ciclo XI",
    courses: [
      { id: "practicas-preprofesionales-i", name: "Prácticas Preprofesionales I" },
      { id: "proyecto-tesis", name: "Proyecto de Tesis" },
      { id: "internacional-privado", name: "Derecho Internacional Privado" },
      { id: "teoria-general-derechos-humanos", name: "Teoría General de los Derechos Humanos" },
      { id: "notarial-registral", name: "Derecho Notarial y Registral" },
    ],
  },
  {
    number: 12,
    label: "Ciclo XII",
    courses: [
      { id: "practicas-preprofesionales-ii", name: "Prácticas Preprofesionales II" },
      { id: "desarrollo-tesis", name: "Desarrollo de Tesis" },
      { id: "derecho-integracion", name: "Derecho de Integración" },
      { id: "derecho-economico-analisis", name: "Derecho Económico y Análisis Económico del Derecho" },
    ],
  },
];

const courseIdSet = new Set<string>();

for (const cycle of OFFICIAL_MALLA_2021) {
  if (cycle.number < 1 || cycle.number > 12) {
    throw new Error(`Ciclo inválido en malla oficial: ${cycle.number}`);
  }
  for (const course of cycle.courses) {
    if (courseIdSet.has(course.id)) {
      throw new Error(`ID de curso duplicado en malla oficial: ${course.id}`);
    }
    courseIdSet.add(course.id);
  }
}

/** 12 ciclos · 68 cursos (malla UNT Derecho 2021). */
export const OFFICIAL_MALLA_STATS = {
  cycles: OFFICIAL_MALLA_2021.length,
  courses: OFFICIAL_MALLA_2021.reduce((sum, cycle) => sum + cycle.courses.length, 0),
} as const;
