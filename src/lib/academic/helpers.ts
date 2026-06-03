import { resolveLegacyCourse, getOfficialCourseById } from "@/lib/academic/course-migration";
import {
  normalizeAcademicFieldsForRead,
  normalizeAcademicForWrite,
  type AcademicCourseFields,
} from "@/lib/academic/normalize-academic";
import { OFFICIAL_MALLA_2021 } from "@/lib/academic/official-malla-2021";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import type { AcademicCourse, AcademicCycle, AcademicSelection, AcademicYear } from "@/types/academic";

export {
  normalizeAcademicForWrite,
  normalizeAcademicFieldsForRead,
  normalizeAcademicFromRecord,
  isLegacyCourseId,
  type AcademicCourseFields,
} from "@/lib/academic/normalize-academic";

export type FlatCycle = {
  yearNumber: number;
  yearLabel: string;
  cycleNumber: number;
  cycleLabel: string;
  courses: AcademicCourse[];
};

export function getAllCycles(): FlatCycle[] {
  return UNT_DERECHO.years.flatMap((year) =>
    year.cycles.map((cycle) => ({
      yearNumber: year.number,
      yearLabel: year.label,
      cycleNumber: cycle.number,
      cycleLabel: cycle.label,
      courses: cycle.courses,
    })),
  );
}

export function getYearByNumber(yearNumber: number): AcademicYear | undefined {
  return UNT_DERECHO.years.find((year) => year.number === yearNumber);
}

export function getCycleByNumber(cycleNumber: number): FlatCycle | undefined {
  return getAllCycles().find((cycle) => cycle.cycleNumber === cycleNumber);
}

export function getCoursesForCycle(cycleNumber: number): AcademicCourse[] {
  return getCycleByNumber(cycleNumber)?.courses ?? [];
}

export function findCourseById(courseId: string): {
  course: AcademicCourse;
  cycle: FlatCycle;
} | null {
  const resolved = getOfficialCourseById(courseId) ?? resolveLegacyCourse(courseId);
  if (!resolved) return null;

  const cycle = getCycleByNumber(resolved.cycleNumber);
  if (!cycle) return null;

  const course = cycle.courses.find((item) => item.id === resolved.courseId);
  if (!course) return null;

  return { course, cycle };
}

export function buildSelection(input: {
  cycleNumber: number;
  courseId: string;
  weekNumber?: number;
}): AcademicSelection | null {
  const resolved = getOfficialCourseById(input.courseId) ?? resolveLegacyCourse(input.courseId);
  if (!resolved) return null;

  if (resolved.cycleNumber !== input.cycleNumber) {
    return buildSelection({
      cycleNumber: resolved.cycleNumber,
      courseId: resolved.courseId,
      weekNumber: input.weekNumber,
    });
  }

  const cycle = getCycleByNumber(resolved.cycleNumber);
  if (!cycle) return null;

  const course = cycle.courses.find((item) => item.id === resolved.courseId);
  if (!course) return null;

  const week =
    course.weeks.find((item) => item.number === (input.weekNumber ?? 1)) ?? course.weeks[0];
  if (!week) return null;

  return {
    yearNumber: cycle.yearNumber,
    yearLabel: cycle.yearLabel,
    cycleNumber: cycle.cycleNumber,
    cycleLabel: cycle.cycleLabel,
    courseId: course.id,
    courseName: course.name,
    weekNumber: week.number,
    weekTitle: week.title,
  };
}

/** Corrige selecciones guardadas con IDs o ciclos de la malla antigua. */
export function sanitizeAcademicSelection(
  saved: AcademicSelection | null,
): AcademicSelection | null {
  if (!saved) return null;

  const resolved = resolveLegacyCourse(saved.courseId, saved.courseName, saved.cycleNumber);
  if (!resolved) return null;

  return buildSelection({
    cycleNumber: resolved.cycleNumber,
    courseId: resolved.courseId,
    weekNumber: saved.weekNumber,
  });
}

export function getOfficialCourseNames(): string[] {
  return OFFICIAL_MALLA_2021.flatMap((cycle) => cycle.courses.map((course) => course.name));
}

export function isValidCourseForCycle(cycleNumber: number, courseId: string): boolean {
  const resolved = getOfficialCourseById(courseId) ?? resolveLegacyCourse(courseId);
  return resolved?.cycleNumber === cycleNumber;
}

export function getCycleForCourse(courseId: string): AcademicCycle | undefined {
  const located = findCourseById(courseId);
  if (!located) return undefined;
  const year = getYearByNumber(located.cycle.yearNumber);
  return year?.cycles.find((cycle) => cycle.number === located.cycle.cycleNumber);
}

/** Lectura/UI y mappers: convierte legacy cuando es posible sin rechazar filas huérfanas. */
export function normalizeMaterialAcademicFields(
  input: AcademicCourseFields,
): AcademicCourseFields {
  return normalizeAcademicFieldsForRead(input);
}

/** Sanitiza academic_context antes de persistir (perfil, metadata). */
export function sanitizeAcademicSelectionForWrite(
  selection: AcademicSelection,
): AcademicSelection | null {
  const sanitized = sanitizeAcademicSelection(selection);
  if (!sanitized) {
    return null;
  }

  const fields = normalizeAcademicForWrite({
    courseId: sanitized.courseId,
    courseName: sanitized.courseName,
    cycleNumber: sanitized.cycleNumber,
    cycleLabel: sanitized.cycleLabel,
  });

  if (!fields) {
    return null;
  }

  return {
    ...sanitized,
    courseId: fields.courseId,
    courseName: fields.courseName,
    cycleNumber: fields.cycleNumber,
    cycleLabel: fields.cycleLabel,
  };
}
