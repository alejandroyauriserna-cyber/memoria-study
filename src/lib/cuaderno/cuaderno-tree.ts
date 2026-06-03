import { normalizeMaterialAcademicFields } from "@/lib/academic/helpers";
import { OFFICIAL_MALLA_2021 } from "@/lib/academic/official-malla-2021";
import type { CuadernoClass } from "@/types/cuaderno";
import type { CuadernoTreeCourse, CuadernoTreeCycle } from "@/types/cuaderno";

export function buildCuadernoTree(classes: CuadernoClass[]): CuadernoTreeCycle[] {
  const classesByCourse = new Map<string, CuadernoClass[]>();

  for (const item of classes) {
    const normalized = normalizeMaterialAcademicFields({
      courseId: item.courseId,
      courseName: item.courseName,
      cycleNumber: item.cycleNumber,
      cycleLabel: item.cycleLabel,
    });

    const key = `${normalized.cycleNumber}:${normalized.courseId}`;
    const bucket = classesByCourse.get(key) ?? [];
    bucket.push({
      ...item,
      courseId: normalized.courseId,
      courseName: normalized.courseName,
      cycleNumber: normalized.cycleNumber,
      cycleLabel: normalized.cycleLabel,
    });
    classesByCourse.set(key, bucket);
  }

  return OFFICIAL_MALLA_2021.map((officialCycle) => {
    const courses: CuadernoTreeCourse[] = officialCycle.courses
      .map((officialCourse) => {
        const key = `${officialCycle.number}:${officialCourse.id}`;
        const classList = (classesByCourse.get(key) ?? []).sort((a, b) => {
          const na = a.classNumber ?? 999;
          const nb = b.classNumber ?? 999;
          if (na !== nb) return na - nb;
          return a.title.localeCompare(b.title, "es");
        });

        if (!classList.length) return null;

        return {
          courseId: officialCourse.id,
          courseName: officialCourse.name,
          classes: classList,
        };
      })
      .filter((course): course is CuadernoTreeCourse => course !== null);

    if (!courses.length) return null;

    return {
      cycleNumber: officialCycle.number,
      cycleLabel: officialCycle.label,
      courses,
    };
  }).filter((cycle): cycle is CuadernoTreeCycle => cycle !== null);
}

export function flattenCuadernoCourses() {
  return OFFICIAL_MALLA_2021.flatMap((cycle) =>
    cycle.courses.map((course) => ({
      courseId: course.id,
      courseName: course.name,
      cycleNumber: cycle.number,
      cycleLabel: cycle.label,
      yearNumber: cycle.number <= 2 ? 1 : cycle.number <= 4 ? 2 : cycle.number <= 6 ? 3 : cycle.number <= 8 ? 4 : cycle.number <= 10 ? 5 : 6,
      yearLabel:
        cycle.number <= 2
          ? "Primer año"
          : cycle.number <= 4
            ? "Segundo año"
            : cycle.number <= 6
              ? "Tercer año"
              : cycle.number <= 8
                ? "Cuarto año"
                : cycle.number <= 10
                  ? "Quinto año"
                  : "Sexto año",
    })),
  );
}
