"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { buildCuadernoFolders } from "@/lib/cuaderno/folders";
import { formatCuadernoRelativeTime } from "@/lib/cuaderno/format";
import { useTimeGreeting } from "@/lib/home/use-time-greeting";
import type { CuadernoClass } from "@/types/cuaderno";

export function CuadernoBookshelfHero({
  profileName,
  classes,
  studyHoursLabel = "—",
}: {
  profileName: string;
  classes: CuadernoClass[];
  studyHoursLabel?: string;
}) {
  const firstName = profileName.split(/\s+/)[0] ?? profileName;
  const greeting = useTimeGreeting();

  const folders = useMemo(() => buildCuadernoFolders(classes), [classes]);

  const stats = useMemo(() => {
    const notebooks = folders.length;
    const pages = folders.reduce((sum, folder) => sum + folder.pageCount, 0);
    const avgProgress =
      notebooks > 0
        ? Math.round(folders.reduce((sum, folder) => sum + folder.progress, 0) / notebooks)
        : 0;
    return { notebooks, pages, avgProgress };
  }, [folders]);

  const continueItem = useMemo(() => {
    if (!classes.length) return null;
    const latest = [...classes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const folder = folders.find((f) => f.courseId === latest.courseId);
    const pageCount = folder?.pageCount ?? 0;
    const pendingLabel =
      pageCount > 0
        ? `${pageCount} ${pageCount === 1 ? "página pendiente" : "páginas en el cuaderno"}`
        : "Retoma tus apuntes";

    return {
      href: `/cuaderno/${latest.id}`,
      courseName: latest.courseName,
      pendingLabel,
      edited: formatCuadernoRelativeTime(latest.updatedAt),
    };
  }, [classes, folders]);

  return (
    <section className="cn-bookshelf-hero" aria-label="Resumen de biblioteca">
      <div className="cn-bookshelf-hero-copy">
        <p className="cn-bookshelf-hero-greeting">
          {greeting}, {firstName}
        </p>
        <h1 className="cn-bookshelf-hero-title">Continúa donde te quedaste</h1>

        {continueItem ? (
          <div className="cn-bookshelf-hero-continue">
            <p className="cn-bookshelf-hero-course">{continueItem.courseName}</p>
            <p className="cn-bookshelf-hero-meta">{continueItem.pendingLabel}</p>
            <p className="cn-bookshelf-hero-edited">Editado {continueItem.edited}</p>
            <Link href={continueItem.href} className="cn-bookshelf-hero-cta">
              Continuar estudiando
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <p className="cn-bookshelf-hero-empty">
            Abre un curso y crea tu primera hoja para empezar tu biblioteca jurídica.
          </p>
        )}
      </div>

      <dl className="cn-bookshelf-hero-stats">
        <div>
          <dt>Cuadernos</dt>
          <dd>{stats.notebooks}</dd>
        </div>
        <div>
          <dt>Páginas</dt>
          <dd>{stats.pages}</dd>
        </div>
        <div>
          <dt>Estudio</dt>
          <dd>{studyHoursLabel}</dd>
        </div>
      </dl>
    </section>
  );
}
