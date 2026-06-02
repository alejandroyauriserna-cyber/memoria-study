"use client";

import { Brain, Link2, Sparkles, Target } from "lucide-react";
import type { CourseDetectionResult } from "@/types/course-detection";

type AiAnalysis = {
  conceptsDetected?: string[];
  relationsFound?: string[];
  difficulty?: "basico" | "intermedio" | "avanzado";
  recommendations?: string[];
  summary?: string;
};

const difficultyLabel = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
} as const;

export function AiAnalysisBanner({
  detection,
  analysis,
  title = "Análisis IA del documento",
}: {
  detection?: CourseDetectionResult | null;
  analysis?: AiAnalysis | null;
  title?: string;
}) {
  const concepts = analysis?.conceptsDetected ?? detection?.conceptsDetected ?? [];
  const relations = analysis?.relationsFound ?? [];
  const difficulty = analysis?.difficulty ?? detection?.difficulty;
  const recommendations = analysis?.recommendations ?? [];

  if (!detection && !analysis && !concepts.length) {
    return null;
  }

  return (
    <section className="organizer-glass rounded-2xl border border-[rgba(0,255,213,0.15)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
            <Sparkles size={14} />
            {title}
          </p>
          {analysis?.summary ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{analysis.summary}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              La IA analizó el PDF y construyó herramientas de estudio personalizadas.
            </p>
          )}
        </div>
        {difficulty ? (
          <span className="rounded-full border border-[rgba(0,255,213,0.2)] bg-[rgba(0,255,213,0.08)] px-3 py-1 text-xs font-semibold text-[#00FFD5]">
            Nivel: {difficultyLabel[difficulty]}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {concepts.length ? (
          <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.45)] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
              <Brain size={12} />
              Conceptos detectados
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {concepts.slice(0, 6).map((concept) => (
                <span
                  key={concept}
                  className="rounded-md bg-[rgba(0,255,213,0.08)] px-2 py-0.5 text-[11px] text-[#F5F7FA]"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {relations.length ? (
          <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.45)] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
              <Link2 size={12} />
              Relaciones
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {relations.slice(0, 4).map((relation) => (
                <li key={relation}>· {relation}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {detection ? (
          <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.45)] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
              <Target size={12} />
              Curso sugerido
            </p>
            <p className="mt-2 text-xs font-semibold text-[#F5F7FA]">{detection.courseName}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {detection.cycleLabel} · {Math.round(detection.confidence * 100)}% confianza
            </p>
          </div>
        ) : null}

        {recommendations.length ? (
          <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.45)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
              Recomendaciones
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
              {recommendations.slice(0, 3).map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
