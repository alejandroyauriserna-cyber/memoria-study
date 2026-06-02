"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  return (
    <section className="ms-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <h3 className="text-sm font-semibold text-[#F5F7FA]">Configuración avanzada</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cantidad por método de estudio (0–{GENERATION_LIMITS.max})
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="border-t border-[rgba(0,255,213,0.1)] px-5 pb-5 pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {fields.map((field) => (
              <label key={field.key}>
                <span className="text-xs font-semibold text-muted-foreground">{field.label}</span>
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
                  className="ms-input mt-1.5"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onChange(DEFAULT_GENERATION_COUNTS)}
            className="mt-3 text-xs font-semibold text-[#00FFD5] hover:underline"
          >
            Restaurar cantidades recomendadas
          </button>
        </div>
      ) : null}
    </section>
  );
}
