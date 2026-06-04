"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BookMarked,
  Brain,
  CheckCircle2,
  Gavel,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Loader2,
  MessageSquare,
  Scale,
  Send,
  Sparkles,
  Target,
} from "lucide-react";
import type {
  DetectedLegalConcept,
  ExamQuestionSet,
  GuidedStudyTutorAction,
  LegalCitation,
} from "@/types/guided-legal-study";

const QUICK_ACTIONS: Array<{
  id: GuidedStudyTutorAction;
  label: string;
  icon: typeof Sparkles;
  prompt?: string;
}> = [
  { id: "explain_page", label: "Explícame esta página", icon: Lightbulb },
  { id: "examples", label: "Dame un ejemplo práctico", icon: GraduationCap },
  { id: "peru_law", label: "¿Cómo se aplica en Perú?", icon: Scale },
  { id: "detect_concepts", label: "Conceptos importantes", icon: Target },
  { id: "exam_questions", label: "Preguntas de examen", icon: Brain },
  { id: "verify_comprehension", label: "¿Entendiste?", icon: HelpCircle },
];

const PROFESSOR_ACTIONS: Array<{
  id: GuidedStudyTutorAction;
  label: string;
}> = [
  { id: "simpler", label: "Explícamelo más fácil" },
  { id: "first_cycle", label: "Como primer ciclo" },
  { id: "another_example", label: "Dame otro ejemplo" },
  { id: "real_case", label: "Caso real" },
  { id: "jurisprudence", label: "Jurisprudencia" },
  { id: "civil_code", label: "Código Civil peruano" },
];

function MarkdownAnswer({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2 text-sm leading-7 text-[#F5F7FA]">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="mt-3 text-sm font-bold text-[#00FFD5]">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="mt-4 text-base font-bold text-[#00FFD5]">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <p key={i} className="pl-3 text-muted-foreground">
              • {line.slice(2)}
            </p>
          );
        }
        if (!line.trim()) return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

function CitationsBlock({ citations }: { citations: LegalCitation[] }) {
  if (!citations.length) return null;
  return (
    <div className="mt-4 space-y-2 rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,255,213,0.04)] p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
        <Gavel size={12} />
        Base jurídica oficial
      </p>
      {citations.map((c, i) => (
        <div key={i} className="rounded-lg bg-black/20 p-2.5 text-xs">
          <p className="font-semibold text-[#F5F7FA]">
            {c.norm} — {c.article}
          </p>
          <p className="mt-1 text-muted-foreground">{c.text}</p>
          <p className="mt-1 text-[10px] text-[#00FFD5]/70">Actualizado: {c.updatedAt}</p>
        </div>
      ))}
    </div>
  );
}

function ConceptsBlock({ concepts }: { concepts: DetectedLegalConcept[] }) {
  const typeLabels: Record<DetectedLegalConcept["type"], string> = {
    definicion: "Definición",
    principio: "Principio",
    requisito: "Requisito",
    elemento: "Elemento",
    excepcion: "Excepción",
    clasificacion: "Clasificación",
  };

  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
        <BookMarked size={12} />
        Conceptos detectados
      </p>
      <div className="grid gap-2">
        {concepts.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.5)] p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[#F5F7FA]">{c.term}</p>
              <span className="shrink-0 rounded-full bg-[rgba(0,255,213,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[#00FFD5]">
                {typeLabels[c.type]}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{c.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionsBlock({ questions }: { questions: ExamQuestionSet }) {
  return (
    <div className="mt-4 space-y-4">
      {questions.oral.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF8A00]">
            Preguntas orales
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {questions.oral.map((q, i) => (
              <li key={i}>• {q}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {questions.desarrollo.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF8A00]">
            Preguntas de desarrollo
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {questions.desarrollo.map((q, i) => (
              <li key={i}>• {q}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {questions.test.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF8A00]">
            Preguntas tipo test
          </p>
          <div className="mt-2 space-y-3">
            {questions.test.map((q, i) => (
              <div key={i} className="rounded-xl border border-[rgba(255,138,0,0.15)] bg-[rgba(255,138,0,0.04)] p-3">
                <p className="text-sm font-medium text-[#F5F7FA]">{q.question}</p>
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {q.options.map((opt, j) => (
                    <li key={j} className={j === q.answerIndex ? "text-[#00FFD5]" : ""}>
                      {String.fromCharCode(65 + j)}. {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function LegalTutorPanel({
  loading,
  answer,
  citations,
  concepts,
  questions,
  comprehensionCheck,
  onAction,
  onCustomAsk,
  onMarkUnderstood,
  pageUnderstood,
}: {
  loading: boolean;
  answer: string | null;
  citations?: LegalCitation[];
  concepts?: DetectedLegalConcept[];
  questions?: ExamQuestionSet;
  comprehensionCheck?: string;
  onAction: (action: GuidedStudyTutorAction) => void;
  onCustomAsk: (prompt: string) => void;
  onMarkUnderstood: () => void;
  pageUnderstood: boolean;
}) {
  const [customPrompt, setCustomPrompt] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.6)]">
      <div className="border-b border-[rgba(0,255,213,0.1)] px-4 py-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
          <Sparkles size={12} />
          Tutor Jurídico IA
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Profesor particular — estudio página por página
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Acciones rápidas
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() => onAction(item.id)}
                  className="flex items-center gap-2 rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,255,213,0.04)] px-3 py-2.5 text-left text-xs font-medium text-[#F5F7FA] transition hover:border-[rgba(0,255,213,0.3)] hover:bg-[rgba(0,255,213,0.08)] disabled:opacity-50"
                >
                  <Icon size={14} className="shrink-0 text-[#00FFD5]" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4">
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
              placeholder="Pregunta libre sobre esta página..."
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
              aria-label="Enviar pregunta"
            >
              <Send size={16} />
            </button>
          </div>
        </section>

        <div className="mt-5 min-h-[8rem]">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin text-[#00FFD5]" />
              El tutor está analizando esta página...
            </div>
          ) : answer ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <MarkdownAnswer text={answer} />
              {citations?.length ? <CitationsBlock citations={citations} /> : null}
              {concepts?.length ? <ConceptsBlock concepts={concepts} /> : null}
              {questions ? <QuestionsBlock questions={questions} /> : null}
              {comprehensionCheck ? (
                <div className="mt-4 rounded-xl border border-[rgba(255,138,0,0.2)] bg-[rgba(255,138,0,0.06)] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#FF8A00]">
                    <MessageSquare size={14} />
                    Verificación de comprensión
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{comprehensionCheck}</p>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecciona una acción o escribe una pregunta para estudiar la página actual con tu
              tutor jurídico.
            </p>
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
          {pageUnderstood ? "Página comprendida ✓" : "Entendí esta página — continuar"}
        </button>
      </div>
    </div>
  );
}
