import { OFFICIAL_MALLA_2021 } from "@/lib/academic/official-malla-2021";
import { normalizeMaterialAcademicFields } from "@/lib/academic/helpers";
import { getCourseCoverArt } from "@/lib/cuaderno/course-covers";
import { estimatePageCount } from "@/lib/cuaderno/note-meta";
import { getCourseVisualPrefs } from "@/lib/cuaderno/preferences";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import type { CuadernoClass } from "@/types/cuaderno";

export type CuadernoFolder = {
  courseId: string;
  courseName: string;
  cycleNumber: number;
  cycleLabel: string;
  icon: string;
  accent: string;
  cover: ReturnType<typeof getCourseVisualPrefs>["cover"];
  classCount: number;
  pageCount: number;
  lastEditedAt: string | null;
  progress: number;
  classes: CuadernoClass[];
  coverArt: CourseCoverArt;
};

export { formatCuadernoRelativeTime } from "@/lib/cuaderno/format";

export function buildCuadernoFolders(classes: CuadernoClass[]): CuadernoFolder[] {
  const byCourse = new Map<string, CuadernoClass[]>();

  for (const item of classes) {
    const n = normalizeMaterialAcademicFields({
      courseId: item.courseId,
      courseName: item.courseName,
      cycleNumber: item.cycleNumber,
      cycleLabel: item.cycleLabel,
    });
    const key = n.courseId;
    const bucket = byCourse.get(key) ?? [];
    bucket.push({ ...item, ...n });
    byCourse.set(key, bucket);
  }

  const folders: CuadernoFolder[] = [];

  for (const cycle of OFFICIAL_MALLA_2021) {
    for (const course of cycle.courses) {
      const classList = (byCourse.get(course.id) ?? []).sort((a, b) => {
        const na = a.classNumber ?? 999;
        const nb = b.classNumber ?? 999;
        if (na !== nb) return na - nb;
        return a.title.localeCompare(b.title, "es");
      });

      if (!classList.length) continue;

      const pageCount = classList.reduce((sum, c) => sum + estimatePageCount(c.notes), 0);
      const lastEditedAt = classList.reduce<string | null>((latest, c) => {
        if (!latest || c.updatedAt > latest) return c.updatedAt;
        return latest;
      }, null);

      const withNotes = classList.filter((c) => c.notes.replace(/<!--[\s\S]*?-->/, "").trim().length > 40);
      const progress = Math.round((withNotes.length / Math.max(classList.length, 1)) * 100);
      const prefs = getCourseVisualPrefs(course.id);
      const coverArt = getCourseCoverArt(course.id, prefs);

      folders.push({
        courseId: course.id,
        courseName: course.name,
        cycleNumber: cycle.number,
        cycleLabel: cycle.label,
        icon: coverArt.icon,
        accent: coverArt.accent,
        cover: coverArt.cover,
        coverArt,
        classCount: classList.length,
        pageCount,
        lastEditedAt,
        progress,
        classes: classList,
      });
    }
  }

  folders.sort((a, b) => {
    const ta = a.lastEditedAt ? new Date(a.lastEditedAt).getTime() : 0;
    const tb = b.lastEditedAt ? new Date(b.lastEditedAt).getTime() : 0;
    return tb - ta;
  });

  return folders;
}

export function getFolderByCourseId(
  folders: CuadernoFolder[],
  courseId: string,
): CuadernoFolder | undefined {
  return folders.find((f) => f.courseId === courseId);
}
