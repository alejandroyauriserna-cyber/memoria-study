"use client";

import { useMemo } from "react";
import { UNT_DERECHO } from "@/lib/academic/unt-derecho";

type Selection = {
  cycleNumber: number;
  cycleLabel: string;
};

type Props = {
  value: Selection | null;
  onChange: (selection: Selection) => void;
};

const cycles = UNT_DERECHO.years.flatMap((year) =>
  year.cycles.map((cycle) => ({
    yearLabel: year.label,
    cycleNumber: cycle.number,
    cycleLabel: cycle.label,
  })),
);

export function CycleSelector({ value, onChange }: Props) {
  const selected = useMemo(
    () => value ?? cycles[0],
    [value],
  );

  return (
    <label className="block">
      <span className="text-sm font-semibold">Ciclo actual</span>
      <select
        value={selected.cycleNumber}
        onChange={(event) => {
          const cycleNumber = Number(event.target.value);
          const next = cycles.find((item) => item.cycleNumber === cycleNumber);
          if (next) {
            onChange({ cycleNumber: next.cycleNumber, cycleLabel: next.cycleLabel });
          }
        }}
        className="mt-2 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
      >
        {cycles.map((cycle) => (
          <option key={cycle.cycleNumber} value={cycle.cycleNumber}>
            {cycle.yearLabel} · {cycle.cycleLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
