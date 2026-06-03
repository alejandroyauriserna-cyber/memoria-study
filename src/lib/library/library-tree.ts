import { normalizeAcademicForWrite } from "@/lib/academic/normalize-academic";
import { OFFICIAL_MALLA_2021 } from "@/lib/academic/official-malla-2021";

const STORAGE_KEY = "memoria-library-expanded";

export function loadExpandedFolders(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveExpandedFolders(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

type LibraryMaterial = {
  id?: string;
  title: string;
  courseId: string;
  courseName: string;
  cycleNumber: number;
  cycleLabel: string;
  materialType?: string;
  authorName?: string;
};

/**
 * Árbol oficial: Derecho UNT → Ciclo I–XII → Curso → Materiales.
 * Incluye todos los cursos de la malla aunque no tengan materiales aún.
 */
export function buildLibraryTree(materials: LibraryMaterial[]) {
  const materialsByCourse = new Map<string, LibraryMaterial[]>();

  for (const material of materials) {
    if (!material.id) continue;
    const official = normalizeAcademicForWrite({
      courseId: material.courseId,
      courseName: material.courseName,
      cycleNumber: material.cycleNumber,
      cycleLabel: material.cycleLabel,
    });
    if (!official) continue;

    const key = `${official.cycleNumber}:${official.courseId}`;
    const bucket = materialsByCourse.get(key) ?? [];
    bucket.push({
      ...material,
      courseId: official.courseId,
      courseName: official.courseName,
      cycleNumber: official.cycleNumber,
      cycleLabel: official.cycleLabel,
    });
    materialsByCourse.set(key, bucket);
  }

  return OFFICIAL_MALLA_2021.map((officialCycle) => {
    const courses = officialCycle.courses.map((officialCourse) => {
      const key = `${officialCycle.number}:${officialCourse.id}`;
      const courseMaterials = (materialsByCourse.get(key) ?? []).sort((a, b) =>
        a.title.localeCompare(b.title, "es"),
      );

      return {
        id: `course-${officialCycle.number}-${officialCourse.id}`,
        courseId: officialCourse.id,
        courseName: officialCourse.name,
        materialCount: courseMaterials.length,
        materials: courseMaterials,
      };
    });

    const materialCount = courses.reduce((sum, course) => sum + course.materialCount, 0);

    return {
      id: `cycle-${officialCycle.number}`,
      cycleNumber: officialCycle.number,
      cycleLabel: officialCycle.label,
      materialCount,
      courses,
    };
  });
}

export type LibraryTreeCycle = ReturnType<typeof buildLibraryTree>[number];

export function filterLibraryTree(
  tree: LibraryTreeCycle[],
  query: string,
): { tree: LibraryTreeCycle[]; expandedIds: Set<string> } {
  const q = query.trim().toLowerCase();
  if (!q) return { tree, expandedIds: new Set<string>() };

  const expandedIds = new Set<string>();
  const filtered: LibraryTreeCycle[] = [];

  for (const cycle of tree) {
    const courses = cycle.courses
      .map((course) => {
        const courseMatch =
          course.courseName.toLowerCase().includes(q) ||
          course.courseId.toLowerCase().includes(q);

        const matchedMaterials = course.materials.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.courseName.toLowerCase().includes(q) ||
            (m.authorName?.toLowerCase().includes(q) ?? false),
        );

        if (courseMatch || matchedMaterials.length) {
          expandedIds.add(cycle.id);
          expandedIds.add(course.id);
          return {
            ...course,
            materials: courseMatch ? course.materials : matchedMaterials,
            materialCount: courseMatch ? course.materials.length : matchedMaterials.length,
          };
        }
        return null;
      })
      .filter(Boolean) as LibraryTreeCycle["courses"];

    const cycleMatch = cycle.cycleLabel.toLowerCase().includes(q);
    if (cycleMatch || courses.length) {
      if (cycleMatch || courses.length) expandedIds.add(cycle.id);
      filtered.push({
        ...cycle,
        courses: cycleMatch ? cycle.courses : courses,
        materialCount: (cycleMatch ? cycle.courses : courses).reduce(
          (sum, c) => sum + c.materialCount,
          0,
        ),
      });
    }
  }

  return { tree: filtered, expandedIds };
}
