"use client";

import { useMemo } from "react";
import { buildCuadernoFolders, type CuadernoFolder } from "@/lib/cuaderno/folders";
import { flattenCuadernoCourses } from "@/lib/cuaderno/cuaderno-tree";
import { getCourseCoverArt } from "@/lib/cuaderno/course-covers";
import { getCourseVisualPrefs } from "@/lib/cuaderno/preferences";
import { SMART_COLLECTIONS } from "@/lib/cuaderno/smart-collections";
import { CuadernoNotebookCover } from "@/components/cuaderno/cuaderno-notebook-cover";
import { CuadernoSmartCollectionModule } from "@/components/cuaderno/cuaderno-smart-collection";
import { CuadernoGenerateCoverButton } from "@/components/cuaderno/cuaderno-generate-cover-button";
import { useCuadernoSyncContext } from "@/components/cuaderno/cuaderno-sync-context";
import type { CuadernoClass } from "@/types/cuaderno";

export function CuadernoBookshelf({ classes }: { classes: CuadernoClass[] }) {
  const { countCollection, resolveCover, setCover, isFavorite } = useCuadernoSyncContext();

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
          cycleLabel: c.cycleLabel,
          coverArt: resolveCover(c.courseId, base),
        };
      });
    return [...withClasses, ...empty.slice(0, Math.max(0, 8 - withClasses.length))];
  }, [folders, folderById, allCourses, resolveCover]);

  const footerStats = useMemo(() => {
    const pages = folders.reduce((sum, folder) => sum + folder.pageCount, 0);
    const avgProgress =
      folders.length > 0
        ? Math.round(folders.reduce((sum, folder) => sum + folder.progress, 0) / folders.length)
        : 0;
    const latest =
      folders.reduce<string | null>((value, folder) => {
        if (!folder.lastEditedAt) return value;
        if (!value || folder.lastEditedAt > value) return folder.lastEditedAt;
        return value;
      }, null) ?? null;

    return {
      notebooks: folders.length,
      pages,
      avgProgress,
      latest,
    };
  }, [folders]);

  return (
    <div className="cn-bookshelf">
      <section className="cn-bookshelf-section" aria-label="Mis cuadernos">
        <div className="cn-bookshelf-section-head">
          <h2>Mis cuadernos</h2>
          <span>{folders.length} cursos activos</span>
        </div>

        <div className="cn-shelf-stage">
          <div className="cn-shelf-plank cn-shelf-plank--library cn-shelf-plank--library-top" aria-hidden />
          <div className="cn-shelf-row cn-shelf-row--library">
            {courseNotebooks.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                Aún no hay cuadernos. Entra a un curso y crea tu primera hoja.
              </p>
            ) : (
              courseNotebooks.map((item) =>
                item.type === "active" ? (
                  <CourseNotebook key={item.folder.courseId} folder={item.folder} isFavorite={isFavorite} />
                ) : (
                  <div key={item.courseId} className="cn-shelf-book-slot cn-shelf-book-slot--library">
                    <CuadernoNotebookCover
                      href={`/cuaderno/curso/${item.courseId}`}
                      title={item.courseName}
                      coverArt={item.coverArt}
                      courseLabel={item.cycleLabel}
                      variant="shelf"
                      stats={{ classCount: 0, pageCount: 0, lastEditedAt: null, progress: 0 }}
                    />
                    <CuadernoGenerateCoverButton
                      courseId={item.courseId}
                      courseName={item.courseName}
                      onGenerated={(cover) => setCover(item.courseId, cover)}
                      className="cn-shelf-cover-gen"
                    />
                  </div>
                ),
              )
            )}
          </div>
          <div className="cn-shelf-plank cn-shelf-plank--library cn-shelf-plank--library-bottom" aria-hidden />
        </div>
      </section>

      <section className="cn-bookshelf-section" aria-label="Colecciones inteligentes">
        <div className="cn-bookshelf-section-head">
          <h2>Colecciones</h2>
          <span>Acceso rápido</span>
        </div>
        <div className="cn-smart-modules">
          {SMART_COLLECTIONS.map((col) => (
            <CuadernoSmartCollectionModule
              key={col.slug}
              href={`/cuaderno/coleccion/${col.slug}`}
              title={col.title}
              description={col.description}
              count={countCollection(col.slug)}
              accent={col.accent}
              cover={col.cover}
            />
          ))}
        </div>
      </section>

      <dl className="cn-bookshelf-footer-stats" aria-label="Resumen de biblioteca">
        <div>
          <dt>Cuadernos activos</dt>
          <dd>{footerStats.notebooks}</dd>
        </div>
        <div>
          <dt>Progreso medio</dt>
          <dd>{footerStats.avgProgress}%</dd>
        </div>
        <div>
          <dt>Última actividad</dt>
          <dd>{footerStats.latest ? new Date(footerStats.latest).toLocaleDateString("es-PE") : "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

function CourseNotebook({
  folder,
  isFavorite,
}: {
  folder: CuadernoFolder;
  isFavorite: (id: string) => boolean;
}) {
  const { resolveCover, setCover } = useCuadernoSyncContext();
  const prefs = getCourseVisualPrefs(folder.courseId);
  const coverArt = resolveCover(
    folder.courseId,
    getCourseCoverArt(folder.courseId, prefs, folder.coverArt),
  );
  const pinned = folder.classes.some((item) => isFavorite(item.id));

  return (
    <div className="cn-shelf-book-slot cn-shelf-book-slot--library">
      <CuadernoNotebookCover
        href={`/cuaderno/curso/${folder.courseId}`}
        title={folder.courseName}
        coverArt={coverArt}
        courseLabel={folder.cycleLabel}
        pinned={pinned}
        variant="shelf"
        stats={{
          classCount: folder.classCount,
          pageCount: folder.pageCount,
          lastEditedAt: folder.lastEditedAt,
          progress: folder.progress,
        }}
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
