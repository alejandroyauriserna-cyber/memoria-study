import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import type { CuadernoClass } from "@/types/cuaderno";
import type { CuadernoTreeCourse, CuadernoTreeCycle } from "@/types/cuaderno";

export function buildCuadernoTree(classes: CuadernoClass[]): CuadernoTreeCycle[] {
  const byCycle = new Map<number, Map<string, CuadernoClass[]>>();

  for (const item of classes) {
    if (!byCycle.has(item.cycleNumber)) {
      byCycle.set(item.cycleNumber, new Map());
    }
    const courseMap = byCycle.get(item.cycleNumber)!;
    if (!courseMap.has(item.courseId)) {
      courseMap.set(item.courseId, []);
    }
    courseMap.get(item.courseId)!.push(item);
  }

  const cycles: CuadernoTreeCycle[] = [];

  for (const year of UNT_DERECHO.years) {
    for (const cycle of year.cycles) {
      const courseMap = byCycle.get(cycle.number);
      const courses: CuadernoTreeCourse[] = [];

      for (const course of cycle.courses) {
        const classList = (courseMap?.get(course.id) ?? []).sort((a, b) => {
          const na = a.classNumber ?? 999;
          const nb = b.classNumber ?? 999;
          if (na !== nb) return na - nb;
          return a.title.localeCompare(b.title, "es");
        });

        if (classList.length > 0) {
          courses.push({
            courseId: course.id,
            courseName: course.name,
            classes: classList,
          });
        }
      }

      const orphanCourses = courseMap
        ? [...courseMap.entries()].filter(
            ([courseId]) => !cycle.courses.some((c) => c.id === courseId),
          )
        : [];

      for (const [courseId, classList] of orphanCourses) {
        if (!classList.length) continue;
        courses.push({
          courseId,
          courseName: classList[0]?.courseName ?? courseId,
          classes: classList.sort((a, b) => (a.classNumber ?? 999) - (b.classNumber ?? 999)),
        });
      }

      if (courses.length > 0) {
        cycles.push({
          cycleNumber: cycle.number,
          cycleLabel: cycle.label,
          courses,
        });
      }
    }
  }

  const knownCycleNumbers = new Set(cycles.map((c) => c.cycleNumber));
  for (const [cycleNumber, courseMap] of byCycle) {
    if (knownCycleNumbers.has(cycleNumber)) continue;
    const courses: CuadernoTreeCourse[] = [];
    for (const [courseId, classList] of courseMap) {
      if (!classList.length) continue;
      courses.push({
        courseId,
        courseName: classList[0]?.courseName ?? courseId,
        classes: classList,
      });
    }
    if (courses.length) {
      const sample = [...courseMap.values()].flat()[0];
      cycles.push({
        cycleNumber,
        cycleLabel: sample?.cycleLabel ?? `Ciclo ${cycleNumber}`,
        courses,
      });
    }
  }

  return cycles.sort((a, b) => a.cycleNumber - b.cycleNumber);
}

export function flattenCuadernoCourses() {
  return UNT_DERECHO.years.flatMap((year) =>
    year.cycles.flatMap((cycle) =>
      cycle.courses.map((course) => ({
        courseId: course.id,
        courseName: course.name,
        cycleNumber: cycle.number,
        cycleLabel: cycle.label,
        yearNumber: year.number,
        yearLabel: year.label,
      })),
    ),
  );
}
