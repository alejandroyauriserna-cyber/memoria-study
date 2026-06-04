"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  Filter,
  Gavel,
  GraduationCap,
  Lightbulb,
  Loader2,
  RefreshCw,
  Scale,
  Send,
} from "lucide-react";
import Link from "next/link";
import { ProfessorLessonView } from "@/components/guided-study/professor-lesson-view";
import { ExamModePanel } from "@/components/guided-study/exam-mode-panel";
import { CompactConceptChips } from "@/components/guided-study/compact-concept-chips";
import type {
  GuidedStudyTutorAction,
  PageProfessorAnalysis,
} from "@/types/guided-legal-study";
import type { LegalSourceAttribution } from "@/types/legal-sources";
import "./guided-study.css";

const PROFESSOR_ACTIONS: Array<{
  id: GuidedStudyTutorAction;
  label: string;
  icon: typeof Lightbulb;
  accent: string;
}> = [
  { id: "simpler", label: "Más fácil", icon: Lightbulb, accent: "#00BFFF" },
  { id: "first_cycle", label: "Primer ciclo", icon: GraduationCap, accent: "#00FFD5" },
  { id: "another_example", label: "Otro ejemplo", icon: RefreshCw, accent: "#5EEAD4" },
  { id: "real_case", label: "Caso real", icon: Briefcase, accent: "#FF8A00" },
  { id: "peru_law", label: "Derecho peruano", icon: Scale, accent: "#86EFAC" },
  { id: "jurisprudence", label: "Jurisprudencia", icon: Gavel, accent: "#C084FC" },
  { id: "civil_code", label: "Código Civil", icon: BookOpen, accent: "#93C5FD" },
];

function SourcesBanner({ sources }: { sources: LegalSourceAttribution[] }) {
  if (!sources.length) return null;

  return (
    <div className="gs-sources-banner">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#86EFAC]">
        Explicación basada en
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {sources.map((s) => (
          <span key={s.sourceId} className="gs-source-tag">
            {s.title}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LegalTutorPanel({
  loading,
  analysis,
  customReply,
  examOnly,
  activeSources,
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
  activeSources?: LegalSourceAttribution[];
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.6)]">
      <div className="shrink-0 border-b border-[rgba(0,255,213,0.1)] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
            Profesor IA
          </p>
          <button
            type="button"
            onClick={() => onExamOnlyChange(!examOnly)}
            className={`gs-exam-toggle shrink-0 text-[10px] ${examOnly ? "gs-exam-toggle--active" : ""}`}
          >
            <Filter size={10} className="mr-1 inline" />
            Solo examen
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {PROFESSOR_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                disabled={loading}
                onClick={() => onAction(item.id)}
                className="gs-action-tile"
                style={{ "--gs-accent": item.accent } as React.CSSProperties}
              >
                <Icon size={14} style={{ color: item.accent }} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            disabled={loading}
            onClick={() => onAction("exam_mode")}
            className="gs-action-tile gs-action-tile--exam"
          >
            <Brain size={14} />
            <span>Modo examen</span>
          </button>
        </div>

        <div className="mt-2 flex gap-1.5">
          <input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customPrompt.trim()) {
                onCustomAsk(customPrompt.trim());
                setCustomPrompt("");
              }
            }}
            placeholder="Pregunta al profesor..."
            className="h-8 min-w-0 flex-1 rounded-lg border border-[rgba(0,255,213,0.12)] bg-[rgba(0,0,0,0.25)] px-2.5 text-xs text-[#F5F7FA] placeholder:text-muted-foreground"
          />
          <button
            type="button"
            disabled={loading || !customPrompt.trim()}
            onClick={() => {
              onCustomAsk(customPrompt.trim());
              setCustomPrompt("");
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00FFD5] text-[#07131a] disabled:opacity-40"
            aria-label="Enviar"
          >
            <Send size={14} />
          </button>
        </div>

        <Link
          href="/fuentes-juridicas"
          className="mt-2 inline-flex text-[10px] text-muted-foreground hover:text-[#00FFD5]"
        >
          Configurar fuentes jurídicas →
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {activeSources?.length ? <SourcesBanner sources={activeSources} /> : null}

        {loading ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Loader2 size={22} className="animate-spin text-[#00FFD5]" />
            <p className="text-xs text-muted-foreground">Analizando esta página...</p>
          </div>
        ) : analysis ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <CompactConceptChips
              keyLearning={analysis.keyLearning}
              highlights={analysis.highlights}
              examOnly={examOnly}
              activeHighlightId={activeHighlightId}
              onSelect={onHighlightFocus}
            />
            <ProfessorLessonView
              analysis={analysis}
              examOnly={examOnly}
              activeHighlightId={activeHighlightId}
              onConceptClick={onHighlightFocus}
              customReply={customReply}
              hideKeyLearning
            />
            {!examOnly ? <ExamModePanel examMode={analysis.examMode} /> : null}
          </motion.div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-[rgba(0,255,213,0.08)] px-3 py-2">
        <button
          type="button"
          onClick={onMarkUnderstood}
          disabled={pageUnderstood || loading}
          className="gs-nav-control"
        >
          {pageUnderstood ? (
            <>
              <Check size={13} />
              Comprendido
            </>
          ) : (
            <>
              Entendí
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
