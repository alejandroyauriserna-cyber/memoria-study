"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";
import { loadAcademicSelection, saveAcademicSelection } from "@/lib/academic/storage";
import type { AcademicSelection } from "@/types/academic";

type Props = {
  value: AcademicSelection | null;
  onChange: (selection: AcademicSelection) => void;
};

function initialState() {
  const saved = loadAcademicSelection();
  const defaultYear = UNT_DERECHO.years[0];
  const defaultCycle = defaultYear?.cycles[0];
  const defaultCourse = defaultCycle?.courses[0];

  return {
    yearNumber: saved?.yearNumber ?? defaultYear?.number ?? 1,
    cycleNumber: saved?.cycleNumber ?? defaultCycle?.number ?? 1,
    courseId: saved?.courseId ?? defaultCourse?.id ?? "",
    weekNumber: saved?.weekNumber ?? 1,
  };
}

export function AcademicNavigator({ value, onChange }: Props) {
  const [state, setState] = useState(initialState);

  const year = useMemo(
    () => UNT_DERECHO.years.find((item) => item.number === state.yearNumber),
    [state.yearNumber],
  );

  const cycle = useMemo(
    () => year?.cycles.find((item) => item.number === state.cycleNumber),
    [year, state.cycleNumber],
  );

  const effectiveCourseId = useMemo(() => {
    if (cycle?.courses.some((item) => item.id === state.courseId)) {
      return state.courseId;
    }
    return cycle?.courses[0]?.id ?? "";
  }, [cycle, state.courseId]);

  const course = useMemo(
    () => cycle?.courses.find((item) => item.id === effectiveCourseId),
    [cycle, effectiveCourseId],
  );

  const week = useMemo(
    () =>
      course?.weeks.find((item) => item.number === state.weekNumber) ??
      course?.weeks[0],
    [course, state.weekNumber],
  );

  const selection = useMemo<AcademicSelection | null>(() => {
    if (!year || !cycle || !course || !week) {
      return null;
    }

    return {
      yearNumber: year.number,
      yearLabel: year.label,
      cycleNumber: cycle.number,
      cycleLabel: cycle.label,
      courseId: course.id,
      courseName: course.name,
      weekNumber: week.number,
      weekTitle: week.title,
    };
  }, [year, cycle, course, week]);

  useEffect(() => {
    if (!selection) {
      return;
    }
    saveAcademicSelection(selection);
    onChange(selection);
  }, [selection, onChange]);

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <GraduationCap className="text-accent" size={20} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {UNT_DERECHO.university}
          </p>
          <h2 className="text-lg font-semibold">Carrera de {UNT_DERECHO.career}</h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label>
          <span className="text-sm font-semibold">Año de la carrera</span>
          <select
            value={state.yearNumber}
            onChange={(event) => {
              const yearNumber = Number(event.target.value);
              const nextYear = UNT_DERECHO.years.find((item) => item.number === yearNumber);
              const nextCycle = nextYear?.cycles[0];
              setState({
                yearNumber,
                cycleNumber: nextCycle?.number ?? 1,
                courseId: nextCycle?.courses[0]?.id ?? "",
                weekNumber: 1,
              });
            }}
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {UNT_DERECHO.years.map((item) => (
              <option key={item.number} value={item.number}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-semibold">Ciclo</span>
          <select
            value={state.cycleNumber}
            onChange={(event) => {
              const cycleNumber = Number(event.target.value);
              const nextCycle = year?.cycles.find((item) => item.number === cycleNumber);
              setState((current) => ({
                ...current,
                cycleNumber,
                courseId: nextCycle?.courses[0]?.id ?? "",
                weekNumber: 1,
              }));
            }}
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {year?.cycles.map((item) => (
              <option key={item.number} value={item.number}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-semibold">Curso</span>
          <select
            value={effectiveCourseId}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                courseId: event.target.value,
                weekNumber: 1,
              }))
            }
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {cycle?.courses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm font-semibold">Semana</span>
          <select
            value={week?.number ?? 1}
            onChange={(event) =>
              setState((current) => ({
                ...current,
                weekNumber: Number(event.target.value),
              }))
            }
            className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {course?.weeks.map((item) => (
              <option key={item.number} value={item.number}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(value ?? selection) ? (
        <p className="mt-4 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          Material para:{" "}
          <strong className="text-foreground">
            {(value ?? selection)?.yearLabel}
          </strong>{" "}
          ·{" "}
          <strong className="text-foreground">
            {(value ?? selection)?.cycleLabel}
          </strong>{" "}
          ·{" "}
          <strong className="text-foreground">
            {(value ?? selection)?.courseName}
          </strong>{" "}
          ·{" "}
          <strong className="text-foreground">
            {(value ?? selection)?.weekTitle}
          </strong>
        </p>
      ) : null}
    </section>
  );
}
