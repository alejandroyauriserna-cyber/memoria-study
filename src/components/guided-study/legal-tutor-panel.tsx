"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  Filter,
  GraduationCap,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { ProfessorLessonView } from "@/components/guided-study/professor-lesson-view";
import { ExamModePanel } from "@/components/guided-study/exam-mode-panel";
import type {
  GuidedStudyTutorAction,
  PageProfessorAnalysis,
} from "@/types/guided-legal-study";
import "./guided-study.css";

const PROFESSOR_ACTIONS: Array<{ id: GuidedStudyTutorAction; label: string }> = [
  { id: "simpler", label: "Más fácil" },
  { id: "first_cycle", label: "Primer ciclo" },
  { id: "another_example", label: "Otro ejemplo" },
  { id: "real_case", label: "Caso real" },
  { id: "peru_law", label: "Derecho peruano" },
  { id: "jurisprudence", label: "Jurisprudencia" },
  { id: "civil_code", label: "Código Civil" },
];

export function LegalTutorPanel({
  loading,
  analysis,
  customReply,
  examOnly,
  onExamOnlyChange,
  activeHighlightId,
  onHighlightFocus,
  onAction,
  onCustomAsk,
  onMarkUnderstood,
  pageUnderstood,
}: {
  loading: boolean;
  analysis: PageProfessorAnalysis | null;
  customReply?: string | null;
  examOnly: boolean;
  onExamOnlyChange: (value: boolean) => void;
  activeHighlightId?: string | null;
  onHighlightFocus?: (highlightId: string) => void;
  onAction: (action: GuidedStudyTutorAction) => void;
  onCustomAsk: (prompt: string) => void;
  onMarkUnderstood: () => void;
  pageUnderstood: boolean;
}) {
  const [customPrompt, setCustomPrompt] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.6)]">
      <div className="border-b border-[rgba(0,255,213,0.1)] px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="gs-section-label">
              <GraduationCap size={12} />
              Modo profesor
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Enseñanza jurídica — no resumen
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExamOnlyChange(!examOnly)}
            className={`gs-exam-toggle shrink-0 ${examOnly ? "gs-exam-toggle--active" : ""}`}
            title="Muestra solo el 20% esencial para examen (regla 80/20)"
          >
            <Filter size={12} className="mr-1 inline" />
            Solo lo importante para examen
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Modo profesor particular
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PROFESSOR_ACTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={loading}
                onClick={() => onAction(item.id)}
                className="rounded-full border border-[rgba(0,255,213,0.12)] px-3 py-1 text-[11px] text-muted-foreground hover:border-[rgba(0,255,213,0.25)] hover:text-[#F5F7FA] disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              disabled={loading}
              onClick={() => onAction("exam_mode")}
              className="rounded-full border border-[rgba(255,138,0,0.2)] px-3 py-1 text-[11px] text-[#FF8A00] hover:bg-[rgba(255,138,0,0.08)] disabled:opacity-50"
            >
              <Brain size={11} className="mr-1 inline" />
              Modo examen
            </button>
          </div>
        </section>

        <section className="mt-4">
          <div className="flex gap-2">
            <input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customPrompt.trim()) {
                  onCustomAsk(customPrompt.trim());
                  setCustomPrompt("");
                }
              }}
              placeholder="Pregunta al profesor sobre esta página..."
              className="h-10 flex-1 rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-3 text-sm text-[#F5F7FA] placeholder:text-muted-foreground"
            />
            <button
              type="button"
              disabled={loading || !customPrompt.trim()}
              onClick={() => {
                onCustomAsk(customPrompt.trim());
                setCustomPrompt("");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00FFD5] text-[#07131a] disabled:opacity-40"
              aria-label="Enviar"
            >
              <Send size={16} />
            </button>
          </div>
        </section>

        <div className="mt-5 min-h-[8rem]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 size={24} className="animate-spin text-[#00FFD5]" />
              <p className="text-sm text-muted-foreground">
                El profesor está analizando las ideas jurídicas de esta página...
              </p>
            </div>
          ) : analysis ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <ProfessorLessonView
                analysis={analysis}
                examOnly={examOnly}
                activeHighlightId={activeHighlightId}
                onConceptClick={onHighlightFocus}
                customReply={customReply}
              />
              {!examOnly || analysis.examMode ? (
                <ExamModePanel examMode={analysis.examMode} />
              ) : null}
            </motion.div>
          ) : (
            <div className="py-8 text-center">
              <Sparkles size={28} className="mx-auto text-[#00FFD5]/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                Navega por el PDF. El profesor explicará solo lo jurídicamente relevante.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[rgba(0,255,213,0.1)] p-4">
        <button
          type="button"
          onClick={onMarkUnderstood}
          disabled={pageUnderstood}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgba(0,255,213,0.12)] py-3 text-sm font-semibold text-[#00FFD5] transition hover:bg-[rgba(0,255,213,0.2)] disabled:cursor-default disabled:opacity-60"
        >
          <CheckCircle2 size={16} />
          {pageUnderstood ? "Página comprendida ✓" : "Entendí — siguiente página"}
        </button>
      </div>
    </div>
  );
}
