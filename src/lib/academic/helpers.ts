import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import type { AcademicCourse, AcademicCycle, AcademicSelection, AcademicYear } from "@/types/academic";

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

export function findCourseById(courseId: string): {
  course: AcademicCourse;
  cycle: FlatCycle;
} | null {
  for (const cycle of getAllCycles()) {
    const course = cycle.courses.find((item) => item.id === courseId);
    if (course) {
      return { course, cycle };
    }
  }
  return null;
}

export function buildSelection(input: {
  cycleNumber: number;
  courseId: string;
  weekNumber?: number;
}): AcademicSelection | null {
  const cycle = getCycleByNumber(input.cycleNumber);
  if (!cycle) return null;

  const course = cycle.courses.find((item) => item.id === input.courseId);
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

/** Corrige selecciones guardadas con IDs de la malla antigua. */
export function sanitizeAcademicSelection(
  saved: AcademicSelection | null,
): AcademicSelection | null {
  if (!saved) return null;

  const located = findCourseById(saved.courseId);
  if (located) {
    return buildSelection({
      cycleNumber: located.cycle.cycleNumber,
      courseId: located.course.id,
      weekNumber: saved.weekNumber,
    });
  }

  const cycle = getCycleByNumber(saved.cycleNumber);
  if (!cycle) {
    return buildSelection({ cycleNumber: 1, courseId: getAllCycles()[0]?.courses[0]?.id ?? "" });
  }

  const firstCourse = cycle.courses[0];
  if (!firstCourse) return null;

  return buildSelection({
    cycleNumber: cycle.cycleNumber,
    courseId: firstCourse.id,
    weekNumber: saved.weekNumber,
  });
}

export function getOfficialCourseNames(): string[] {
  return getAllCycles().flatMap((cycle) => cycle.courses.map((course) => course.name));
}

export function isValidCourseForCycle(cycleNumber: number, courseId: string): boolean {
  const cycle = getCycleByNumber(cycleNumber);
  return Boolean(cycle?.courses.some((course) => course.id === courseId));
}

export function getCycleForCourse(courseId: string): AcademicCycle | undefined {
  const located = findCourseById(courseId);
  if (!located) return undefined;
  const year = getYearByNumber(located.cycle.yearNumber);
  return year?.cycles.find((cycle) => cycle.number === located.cycle.cycleNumber);
}
