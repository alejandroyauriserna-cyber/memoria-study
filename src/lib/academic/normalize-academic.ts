import {
  getLegacyIdMigrationMap,
  getOfficialCourseById,
  resolveLegacyCourse,
} from "@/lib/academic/course-migration";

/** IDs de la malla antigua que no deben persistirse en escrituras. */
const LEGACY_COURSE_IDS = new Set(Object.keys(getLegacyIdMigrationMap()));

export type AcademicCourseFields = {
  courseId: string;
  courseName: string;
  cycleNumber: number;
  cycleLabel: string;
};

/**
 * Normalización estricta para escrituras en backend (materials, organizers, cuaderno, etc.).
 * - Convierte legacy vía LEGACY_ID_MAP / resolveLegacyCourse
 * - Valida contra OFFICIAL_MALLA_2021
 * - Verifica curso ↔ ciclo
 * - Devuelve solo IDs oficiales o null si no es válido
 */
export function normalizeAcademicForWrite(
  input: AcademicCourseFields,
): AcademicCourseFields | null {
  const resolved = resolveLegacyCourse(
    input.courseId,
    input.courseName,
    input.cycleNumber,
  );

  if (!resolved) {
    return null;
  }

  if (LEGACY_COURSE_IDS.has(resolved.courseId)) {
    return null;
  }

  const official = getOfficialCourseById(resolved.courseId);
  if (!official) {
    return null;
  }

  if (official.cycleNumber !== resolved.cycleNumber) {
    return null;
  }

  return {
    courseId: official.courseId,
    courseName: official.courseName,
    cycleNumber: official.cycleNumber,
    cycleLabel: official.cycleLabel,
  };
}

/** Normalización permisiva para lectura/UI (mantiene filas huérfanas legibles). */
export function normalizeAcademicFieldsForRead(
  input: AcademicCourseFields,
): AcademicCourseFields {
  const strict = normalizeAcademicForWrite(input);
  if (strict) {
    return strict;
  }

  const resolved = resolveLegacyCourse(
    input.courseId,
    input.courseName,
    input.cycleNumber,
  );

  if (!resolved || LEGACY_COURSE_IDS.has(resolved.courseId)) {
    return input;
  }

  return {
    courseId: resolved.courseId,
    courseName: resolved.courseName,
    cycleNumber: resolved.cycleNumber,
    cycleLabel: resolved.cycleLabel,
  };
}

export function isLegacyCourseId(courseId: string): boolean {
  return LEGACY_COURSE_IDS.has(courseId);
}

/** Campos de curso/ciclo desde una fila materials u organizers. */
export function normalizeAcademicFromRecord(record: {
  course_id: string;
  course_name: string;
  cycle_number: number;
  cycle_label: string;
}): AcademicCourseFields | null {
  return normalizeAcademicForWrite({
    courseId: record.course_id,
    courseName: record.course_name,
    cycleNumber: record.cycle_number,
    cycleLabel: record.cycle_label,
  });
}
