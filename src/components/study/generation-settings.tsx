"use client";

import {
  DEFAULT_GENERATION_COUNTS,
  GENERATION_LIMITS,
  type StudyGenerationCounts,
} from "@/types/generation";

type Props = {
  value: StudyGenerationCounts;
  onChange: (counts: StudyGenerationCounts) => void;
};

const fields: { key: keyof StudyGenerationCounts; label: string }[] = [
  { key: "flashcards", label: "Tarjetas" },
  { key: "definitionCards", label: "Término ↔ definición" },
  { key: "matchingPairs", label: "Pares (memoria)" },
  { key: "fillBlanks", label: "Completar espacios" },
  { key: "quiz", label: "Preguntas quiz" },
];

export function GenerationSettings({ value, onChange }: Props) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Cantidad por método de estudio</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Elige cuántos ítems generar de cada tipo (0–{GENERATION_LIMITS.max}).
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {fields.map((field) => (
          <label key={field.key}>
            <span className="text-xs font-semibold">{field.label}</span>
            <input
              type="number"
              min={GENERATION_LIMITS.min}
              max={GENERATION_LIMITS.max}
              value={value[field.key]}
              onChange={(event) =>
                onChange({
                  ...value,
                  [field.key]: Number(event.target.value),
                })
              }
              className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange(DEFAULT_GENERATION_COUNTS)}
        className="mt-3 text-xs font-semibold text-accent hover:underline"
      >
        Restaurar cantidades recomendadas
      </button>
    </section>
  );
}
