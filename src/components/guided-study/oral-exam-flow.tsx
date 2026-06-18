"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { StructuredQuestionCard } from "@/components/guided-study/exam-mode-panel";
import type { OralExamSeed } from "@/types/guided-legal-study";

/**
 * Arquitectura para modo examen oral (sin voz por ahora).
 * Flujo: pregunta de profesor → criterios → repreguntas opcionales.
 */
export function OralExamFlow({
  seed,
  pageNumber,
}: {
  seed: OralExamSeed;
  pageNumber: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="gs-le-block gs-le-block--oral-arch">
      <button type="button" className="gs-oral-arch-toggle" onClick={() => setOpen((v) => !v)}>
        <Mic size={14} />
        <span>Defiende tu respuesta</span>
        <span className="gs-oral-arch-badge">Próximamente voz</span>
      </button>

      {open ? (
        <div className="gs-oral-arch-body">
          <p className="text-[10px] text-muted-foreground">
            Simulación oral — página {pageNumber}. Responde en voz alta o por escrito antes de ver la
            rúbrica.
          </p>
          <StructuredQuestionCard
            item={{
              question: seed.question,
              gradingPoints: seed.gradingPoints,
            }}
            index={0}
            accent="#00FFD5"
          />
          {seed.followUpQuestions?.length ? (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Repreguntas del profesor
              </p>
              {seed.followUpQuestions.map((q, i) => (
                <p key={i} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
                  {q}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
