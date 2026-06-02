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

export function buildLibraryTree(
  materials: Array<{
    id?: string;
    title: string;
    courseId: string;
    courseName: string;
    cycleNumber: number;
    cycleLabel: string;
    materialType?: string;
    authorName?: string;
  }>,
) {
  const byCycle = new Map<
    number,
    {
      cycleLabel: string;
      courses: Map<
        string,
        {
          courseName: string;
          materials: typeof materials;
        }
      >;
    }
  >();

  for (const material of materials) {
    if (!material.id) continue;
    const cycle =
      byCycle.get(material.cycleNumber) ??
      ({
        cycleLabel: material.cycleLabel,
        courses: new Map(),
      } as {
        cycleLabel: string;
        courses: Map<string, { courseName: string; materials: typeof materials }>;
      });

    const course =
      cycle.courses.get(material.courseId) ??
      ({ courseName: material.courseName, materials: [] as typeof materials });

    course.materials.push(material);
    cycle.courses.set(material.courseId, course);
    byCycle.set(material.cycleNumber, cycle);
  }

  return [...byCycle.entries()]
    .sort(([a], [b]) => a - b)
    .map(([cycleNumber, cycle]) => ({
      id: `cycle-${cycleNumber}`,
      cycleNumber,
      cycleLabel: cycle.cycleLabel,
      materialCount: [...cycle.courses.values()].reduce((sum, c) => sum + c.materials.length, 0),
      courses: [...cycle.courses.entries()]
        .sort(([, a], [, b]) => a.courseName.localeCompare(b.courseName, "es"))
        .map(([courseId, course]) => ({
          id: `course-${cycleNumber}-${courseId}`,
          courseId,
          courseName: course.courseName,
          materialCount: course.materials.length,
          materials: course.materials.sort((a, b) => a.title.localeCompare(b.title, "es")),
        })),
    }));
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

        const materials = course.materials.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.courseName.toLowerCase().includes(q) ||
            (m.authorName?.toLowerCase().includes(q) ?? false),
        );

        if (courseMatch || materials.length) {
          expandedIds.add(cycle.id);
          expandedIds.add(course.id);
          return {
            ...course,
            materials: courseMatch ? course.materials : materials,
            materialCount: courseMatch ? course.materials.length : materials.length,
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
