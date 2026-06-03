"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { buildCuadernoFolders } from "@/lib/cuaderno/folders";
import { CuadernoNotebookCover } from "@/components/cuaderno/cuaderno-notebook-cover";
import { CuadernoSheetCover } from "@/components/cuaderno/cuaderno-sheet-cover";
import { CuadernoGenerateCoverButton } from "@/components/cuaderno/cuaderno-generate-cover-button";
import { CuadernoSyncProvider, useCuadernoSyncContext } from "@/components/cuaderno/cuaderno-sync-context";
import { buildInitialNotes, type CuadernoTemplateId } from "@/lib/cuaderno/templates";
import { CuadernoTemplatePicker } from "@/components/cuaderno/cuaderno-template-picker";
import { findCourseById } from "@/lib/academic/helpers";
import { getCourseCoverArt } from "@/lib/cuaderno/course-covers";
import { getCourseVisualPrefs } from "@/lib/cuaderno/preferences";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-premium.css";
import "./cuaderno-paper.css";

export function CuadernoCourseView(props: {
  courseId: string;
  courseName: string;
  cycleLabel: string;
  initialClasses: CuadernoClass[];
}) {
  return (
    <CuadernoSyncProvider>
      <CuadernoCourseViewInner {...props} />
    </CuadernoSyncProvider>
  );
}

function CuadernoCourseViewInner({
  courseId,
  courseName,
  cycleLabel,
  initialClasses,
}: {
  courseId: string;
  courseName: string;
  cycleLabel: string;
  initialClasses: CuadernoClass[];
}) {
  const router = useRouter();
  const { resolveCover, setCover, isFavorite } = useCuadernoSyncContext();
  const [classes, setClasses] = useState(
    initialClasses.filter((c) => c.courseId === courseId),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const located = useMemo(() => findCourseById(courseId), [courseId]);

  const folder = useMemo(
    () => buildCuadernoFolders(initialClasses).find((f) => f.courseId === courseId),
    [initialClasses, courseId],
  );

  const cycleNumber = folder?.cycleNumber ?? located?.cycle.cycleNumber ?? 1;
  const prefs = getCourseVisualPrefs(courseId);
  const baseCover = folder?.coverArt ?? getCourseCoverArt(courseId, prefs);
  const coverArt = resolveCover(courseId, baseCover);

  async function createClass(templateId: CuadernoTemplateId) {
    setPickerOpen(false);
    setCreating(true);
    setError(null);

    const nextNumber =
      classes.reduce((max, c) => Math.max(max, c.classNumber ?? 0), 0) + 1;

    try {
      const response = await fetch("/api/cuaderno/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          courseName,
          cycleNumber,
          cycleLabel: cycleLabel,
          title: `Clase ${String(nextNumber).padStart(2, "0")}`,
          classNumber: nextNumber,
          notes: buildInitialNotes(templateId),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "No se pudo crear la clase.");
      const created = payload.cuadernoClass as CuadernoClass;
      setClasses((prev) => [...prev, created].sort((a, b) => (a.classNumber ?? 99) - (b.classNumber ?? 99)));
      router.push(`/cuaderno/${created.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error al crear clase.");
    } finally {
      setCreating(false);
    }
  }

  function updateClassNotes(classId: string, notes: string) {
    setClasses((prev) => prev.map((c) => (c.id === classId ? { ...c, notes } : c)));
  }

  return (
    <motion.div
      className="cuaderno-premium mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={
        {
          "--cn-course-accent": coverArt.accent,
          "--cn-course-glow": `${coverArt.accent}18`,
        } as React.CSSProperties
      }
    >
      <Link
        href="/cuaderno"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-[#00FFD5]"
      >
        <ArrowLeft size={16} />
        Mis apuntes
      </Link>

      <motion.div
        className="cn-course-hero-panel flex flex-col gap-6 lg:flex-row lg:items-start"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mx-auto w-full max-w-[220px] shrink-0 space-y-3">
          <CuadernoNotebookCover
            href={`/cuaderno/curso/${courseId}`}
            title={courseName}
            coverArt={coverArt}
            stats={
              folder
                ? {
                    classCount: folder.classCount,
                    pageCount: folder.pageCount,
                    lastEditedAt: folder.lastEditedAt,
                    progress: folder.progress,
                  }
                : { classCount: classes.length, pageCount: 0, lastEditedAt: null }
            }
          />
          <CuadernoGenerateCoverButton
            courseId={courseId}
            courseName={courseName}
            cycleLabel={cycleLabel}
            onGenerated={(cover) => setCover(courseId, cover)}
            className="flex justify-center"
          />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">{cycleLabel}</p>
          <button
            type="button"
            disabled={creating}
            onClick={() => setPickerOpen(true)}
            className="tron-btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold sm:w-auto"
          >
            {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Nueva clase
          </button>
        </div>
      </motion.div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="cn-shelf-label mt-4">
        <span>Hojas del curso</span>
      </div>
      <div className="cn-course-sheets">
        {classes.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-white/15 py-16 text-center">
            <p className="text-[#F5F7FA]">Aún no hay hojas en este curso</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pulsa «Nueva clase» y elige una plantilla jurídica o en blanco.
            </p>
          </div>
        ) : (
          classes.map((item, index) => (
            <CuadernoSheetCover
              key={item.id}
              item={item}
              courseCover={coverArt}
              isFavorite={isFavorite(item.id)}
              onNotesUpdated={(notes) => updateClassNotes(item.id, notes)}
              index={index}
            />
          ))
        )}
      </div>

      <CuadernoTemplatePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={createClass}
      />
    </motion.div>
  );
}
