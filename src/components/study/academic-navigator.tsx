"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap } from "lucide-react";
import { SelectionCard, SelectionGroup } from "@/components/ui/selection-cards";
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
    if (!selection) return;
    saveAcademicSelection(selection);
    onChange(selection);
  }, [selection, onChange]);

  return (
    <section className="ms-panel p-5 md:p-6">
      <div className="mb-5 flex items-center gap-2">
        <GraduationCap className="text-[#00FFD5]" size={20} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
            {UNT_DERECHO.university}
          </p>
          <h2 className="text-lg font-semibold text-[#F5F7FA]">Contexto académico</h2>
        </div>
      </div>

      <div className="space-y-5">
        <SelectionGroup label="Año">
          {UNT_DERECHO.years.map((item) => (
            <SelectionCard
              key={item.number}
              selected={state.yearNumber === item.number}
              onClick={() => {
                const nextCycle = item.cycles[0];
                setState({
                  yearNumber: item.number,
                  cycleNumber: nextCycle?.number ?? 1,
                  courseId: nextCycle?.courses[0]?.id ?? "",
                  weekNumber: 1,
                });
              }}
            >
              {item.label.replace("Año ", "")}
            </SelectionCard>
          ))}
        </SelectionGroup>

        <SelectionGroup label="Ciclo">
          {year?.cycles.map((item) => (
            <SelectionCard
              key={item.number}
              selected={state.cycleNumber === item.number}
              onClick={() => {
                setState((current) => ({
                  ...current,
                  cycleNumber: item.number,
                  courseId: item.courses[0]?.id ?? "",
                  weekNumber: 1,
                }));
              }}
            >
              {item.label.replace("Ciclo ", "")}
            </SelectionCard>
          ))}
        </SelectionGroup>

        <SelectionGroup label="Curso">
          {cycle?.courses.map((item) => (
            <SelectionCard
              key={item.id}
              selected={effectiveCourseId === item.id}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  courseId: item.id,
                  weekNumber: 1,
                }))
              }
            >
              {item.name}
            </SelectionCard>
          ))}
        </SelectionGroup>

        <SelectionGroup label="Semana">
          {course?.weeks.map((item) => (
            <SelectionCard
              key={item.number}
              selected={(week?.number ?? 1) === item.number}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  weekNumber: item.number,
                }))
              }
            >
              {item.title.replace("Semana ", "S")}
            </SelectionCard>
          ))}
        </SelectionGroup>
      </div>

      {(value ?? selection) ? (
        <p className="ms-input mt-5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
          Ubicación:{" "}
          <span className="font-semibold text-[#F5F7FA]">
            {(value ?? selection)?.yearLabel} · {(value ?? selection)?.cycleLabel} ·{" "}
            {(value ?? selection)?.courseName} · {(value ?? selection)?.weekTitle}
          </span>
        </p>
      ) : null}
    </section>
  );
}
