import { OFFICIAL_MALLA_2021 } from "@/lib/academic/official-malla-2021";

export type ResolvedCourse = {
  courseId: string;
  courseName: string;
  cycleNumber: number;
  cycleLabel: string;
};

/** Mapeo ID antiguo → curso oficial (malla 2021). */
const LEGACY_ID_MAP: Record<string, string> = {
  "desarrollo-personal": "desarrollo-personal-social",
  "pensamiento-logico-matematico": "desarrollo-pensamiento-matematico",
  "lectura-critica-redaccion": "lectura-produccion-textos-academicos",
  "antropologia-general": "analisis-critico-realidad",
  "metodologia-investigacion-cientifica": "introduccion-investigacion-cientifica",
  "sociedad-cultura-ecologia": "analisis-critico-realidad",
  "cultura-investigativa": "introduccion-investigacion-cientifica",
  "etica-convivencia-ciudadania": "etica-profesional",
  "identidad-cultural": "identidad-cultural-regional-nacional",
  "historia-derecho-peru-latam": "historia-general-derecho",
  "derechos-humanos": "teoria-general-derechos-humanos",
  "derecho-romano": "historia-general-derecho",
  "penal-general-i": "teoria-juridica-delito-i",
  "penal-general-ii": "teoria-juridica-delito-ii",
  "teoria-general-proceso": "procesal-civil-i",
  "trabajo-i": "derecho-trabajo-i",
  "trabajo-ii": "derecho-trabajo-ii",
  "civil-iii-reales": "civil-iii-derechos-reales",
  "civil-iv-obligaciones": "civil-iv-obligaciones",
  "empresarial-i-societario": "derecho-societario",
  "empresarial-ii-titulos-valores": "titulos-valores",
  "empresarial-iii-concursal": "derecho-societario",
  "procesal-penal-iii": "procesal-penal-ii",
  "practica-dirigida-i": "practica-dirigida-ix",
  "practica-dirigida-ii": "practica-dirigida-x",
  "contrataciones-estado": "administrativo-ii",
  "derecho-economico": "derecho-economico-analisis",
  "medicina-legal": "teoria-juridica-delito-ii",
};

/** Nombres antiguos (normalizados) → ID oficial. */
const LEGACY_NAME_HINTS: Array<{ match: RegExp; courseId: string }> = [
  { match: /civil\s*ii|acto\s*jur[ií]dico/i, courseId: "civil-ii-acto-juridico" },
  { match: /civil\s*i[^i-v]|personas|principios\s*generales/i, courseId: "civil-i-personas" },
  { match: /civil\s*iii|derechos\s*reales|reales/i, courseId: "civil-iii-derechos-reales" },
  { match: /civil\s*iv|obligaciones/i, courseId: "civil-iv-obligaciones" },
  { match: /civil\s*v|contratos(?! modernos)/i, courseId: "civil-v-contratos" },
  { match: /civil\s*vi|familia/i, courseId: "civil-vi-familia" },
  { match: /civil\s*vii|sucesiones/i, courseId: "civil-vii-sucesiones" },
  { match: /constitucional\s*i/i, courseId: "constitucional-i" },
  { match: /constitucional\s*ii/i, courseId: "constitucional-ii" },
  { match: /procesal\s*constitucional/i, courseId: "procesal-constitucional" },
  { match: /penal\s*especial/i, courseId: "penal-especial-i" },
  { match: /penal\s*general|teor[ií]a.*delito/i, courseId: "teoria-juridica-delito-i" },
  { match: /procesal\s*civil\s*i/i, courseId: "procesal-civil-i" },
  { match: /procesal\s*civil\s*ii/i, courseId: "procesal-civil-ii" },
  { match: /procesal\s*penal\s*i/i, courseId: "procesal-penal-i" },
  { match: /procesal\s*penal\s*ii/i, courseId: "procesal-penal-ii" },
  { match: /administrativo\s*i/i, courseId: "administrativo-i" },
  { match: /administrativo\s*ii|contencioso/i, courseId: "administrativo-ii" },
  { match: /trabajo\s*i|laboral\s*i/i, courseId: "derecho-trabajo-i" },
  { match: /trabajo\s*ii|laboral\s*ii/i, courseId: "derecho-trabajo-ii" },
  { match: /tributario\s*i/i, courseId: "tributario-i" },
  { match: /tributario\s*ii/i, courseId: "tributario-ii" },
  { match: /investigaci[oó]n\s*jur[ií]dica\s*i/i, courseId: "metodologia-investigacion-juridica-i" },
  { match: /investigaci[oó]n\s*jur[ií]dica\s*ii/i, courseId: "metodologia-investigacion-juridica-ii" },
  { match: /introducci[oó]n.*ciencias\s*jur[ií]dicas/i, courseId: "introduccion-ciencias-juridicas" },
  { match: /filosof[ií]a\s*del\s*derecho/i, courseId: "filosofia-derecho" },
  { match: /marcs|mediaci[oó]n|arbitraje/i, courseId: "marcs" },
  { match: /notarial|registral/i, courseId: "notarial-registral" },
  { match: /societario|empresarial/i, courseId: "derecho-societario" },
  { match: /t[ií]tulos\s*valores/i, courseId: "titulos-valores" },
  { match: /pr[aá]ctica\s*dirigida/i, courseId: "practica-dirigida-ix" },
  { match: /tesis|proyecto/i, courseId: "proyecto-tesis" },
];

const officialById = new Map<string, ResolvedCourse>();

for (const cycle of OFFICIAL_MALLA_2021) {
  for (const course of cycle.courses) {
    officialById.set(course.id, {
      courseId: course.id,
      courseName: course.name,
      cycleNumber: cycle.number,
      cycleLabel: cycle.label,
    });
  }
}

export function getOfficialCourseById(courseId: string): ResolvedCourse | null {
  const direct = officialById.get(courseId);
  if (direct) return direct;

  const migratedId = LEGACY_ID_MAP[courseId];
  if (migratedId) return officialById.get(migratedId) ?? null;

  return null;
}

export function resolveLegacyCourse(
  courseId: string,
  courseName?: string | null,
  cycleNumber?: number | null,
): ResolvedCourse | null {
  const byId = getOfficialCourseById(courseId);
  if (byId) return byId;

  if (courseName) {
    for (const hint of LEGACY_NAME_HINTS) {
      if (hint.match.test(courseName)) {
        const resolved = officialById.get(hint.courseId);
        if (resolved) return resolved;
      }
    }

    const normalized = courseName.trim().toLowerCase();
    for (const cycle of OFFICIAL_MALLA_2021) {
      const match = cycle.courses.find(
        (c) => c.name.trim().toLowerCase() === normalized,
      );
      if (match) {
        return {
          courseId: match.id,
          courseName: match.name,
          cycleNumber: cycle.number,
          cycleLabel: cycle.label,
        };
      }
    }
  }

  if (cycleNumber && cycleNumber >= 1 && cycleNumber <= 12) {
    const cycle = OFFICIAL_MALLA_2021.find((c) => c.number === cycleNumber);
    const first = cycle?.courses[0];
    if (first) {
      return {
        courseId: first.id,
        courseName: first.name,
        cycleNumber: cycle.number,
        cycleLabel: cycle.label,
      };
    }
  }

  return officialById.get("introduccion-ciencias-juridicas") ?? null;
}

export function getLegacyIdMigrationMap(): Record<string, string> {
  return { ...LEGACY_ID_MAP };
}

export function getAllOfficialCourseIds(): string[] {
  return [...officialById.keys()];
}
