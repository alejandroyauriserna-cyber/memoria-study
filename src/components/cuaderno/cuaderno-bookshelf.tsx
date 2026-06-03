"use client";

import { useMemo } from "react";
import { buildCuadernoFolders, type CuadernoFolder } from "@/lib/cuaderno/folders";
import { flattenCuadernoCourses } from "@/lib/cuaderno/cuaderno-tree";
import { getCourseCoverArt } from "@/lib/cuaderno/course-covers";
import { getCourseVisualPrefs } from "@/lib/cuaderno/preferences";
import { SMART_COLLECTIONS } from "@/lib/cuaderno/smart-collections";
import { CuadernoNotebookCover } from "@/components/cuaderno/cuaderno-notebook-cover";
import { CuadernoGenerateCoverButton } from "@/components/cuaderno/cuaderno-generate-cover-button";
import { useCuadernoSyncContext } from "@/components/cuaderno/cuaderno-sync-context";
import type { CuadernoClass } from "@/types/cuaderno";

export function CuadernoBookshelf({ classes }: { classes: CuadernoClass[] }) {
  const { countCollection, resolveCover, setCover } = useCuadernoSyncContext();

  const folders = useMemo(() => buildCuadernoFolders(classes), [classes]);
  const folderById = useMemo(
    () => new Map(folders.map((f) => [f.courseId, f])),
    [folders],
  );

  const allCourses = useMemo(() => flattenCuadernoCourses(), []);

  const courseNotebooks = useMemo(() => {
    const withClasses = folders.map((f) => ({ type: "active" as const, folder: f }));
    const empty = allCourses
      .filter((c) => !folderById.has(c.courseId))
      .map((c) => {
        const prefs = getCourseVisualPrefs(c.courseId);
        const base = getCourseCoverArt(c.courseId, prefs);
        return {
          type: "empty" as const,
          courseId: c.courseId,
          courseName: c.courseName,
          coverArt: resolveCover(c.courseId, base),
        };
      });
    return [...withClasses, ...empty.slice(0, Math.max(0, 12 - withClasses.length))];
  }, [folders, folderById, allCourses, resolveCover]);

  return (
    <div className="cn-bookshelf">
      <div className="cn-shelf-label">
        <span>Colecciones inteligentes</span>
      </div>
      <div className="cn-shelf-row cn-shelf-row--smart">
        {SMART_COLLECTIONS.map((col) => (
          <CuadernoNotebookCover
            key={col.slug}
            href={`/cuaderno/coleccion/${col.slug}`}
            title={col.title}
            coverArt={{
              icon: col.icon,
              accent: col.accent,
              cover: col.cover,
              motifs: col.motifs,
            }}
            stats={{
              classCount: countCollection(col.slug),
              pageCount: countCollection(col.slug),
              lastEditedAt: null,
            }}
            compact
          />
        ))}
      </div>

      <div className="cn-shelf-label mt-10">
        <span>Mis cursos</span>
      </div>
      <div className="cn-shelf-plank" aria-hidden />
      <div className="cn-shelf-row">
        {courseNotebooks.map((item) =>
          item.type === "active" ? (
            <CourseNotebook key={item.folder.courseId} folder={item.folder} />
          ) : (
            <div key={item.courseId} className="cn-shelf-book-slot">
              <CuadernoNotebookCover
                href={`/cuaderno/curso/${item.courseId}`}
                title={item.courseName}
                coverArt={item.coverArt}
                stats={{ classCount: 0, pageCount: 0, lastEditedAt: null }}
                compact
              />
              <CuadernoGenerateCoverButton
                courseId={item.courseId}
                courseName={item.courseName}
                onGenerated={(cover) => setCover(item.courseId, cover)}
                className="cn-shelf-cover-gen"
              />
            </div>
          ),
        )}
      </div>
      <div className="cn-shelf-plank cn-shelf-plank--bottom" aria-hidden />
    </div>
  );
}

function CourseNotebook({ folder }: { folder: CuadernoFolder }) {
  const { resolveCover, setCover } = useCuadernoSyncContext();
  const prefs = getCourseVisualPrefs(folder.courseId);
  const coverArt = resolveCover(
    folder.courseId,
    getCourseCoverArt(folder.courseId, prefs, folder.coverArt),
  );

  return (
    <div className="cn-shelf-book-slot">
      <CuadernoNotebookCover
        href={`/cuaderno/curso/${folder.courseId}`}
        title={folder.courseName}
        coverArt={coverArt}
        stats={{
          classCount: folder.classCount,
          pageCount: folder.pageCount,
          lastEditedAt: folder.lastEditedAt,
          progress: folder.progress,
        }}
        compact
      />
      <CuadernoGenerateCoverButton
        courseId={folder.courseId}
        courseName={folder.courseName}
        cycleLabel={folder.cycleLabel}
        onGenerated={(cover) => setCover(folder.courseId, cover)}
        className="cn-shelf-cover-gen"
      />
    </div>
  );
}
