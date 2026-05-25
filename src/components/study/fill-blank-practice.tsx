"use client";

import { useState } from "react";
import type { FillBlank } from "@/types/study";

export function FillBlankPractice({ items }: { items: FillBlank[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay ejercicios de completar espacios en este mazo.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-border p-4">
          <p className="font-medium leading-relaxed">{item.sentence}</p>
          <button
            type="button"
            onClick={() =>
              setRevealed((current) => ({
                ...current,
                [item.id]: !current[item.id],
              }))
            }
            className="mt-3 text-sm font-semibold text-accent hover:underline"
          >
            {revealed[item.id] ? "Ocultar respuesta" : "Ver respuesta"}
          </button>
          {revealed[item.id] ? (
            <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">
              <p>
                <strong>Respuesta:</strong> {item.answer}
              </p>
              <p className="mt-1 text-muted-foreground">{item.explanation}</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
