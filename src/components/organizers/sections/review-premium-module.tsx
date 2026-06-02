"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, ChevronDown, ClipboardCheck, HelpCircle, Trophy } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";
import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";

type ReviewBundle = NonNullable<StoredOrganizerContent["reviewBundle"]>;

const difficultyLabel = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
} as const;

export function ReviewPremiumModule({
  reviewBundle,
  onAnswerRecorded,
}: {
  reviewBundle: ReviewBundle;
  onAnswerRecorded?: (correct: boolean) => void;
}) {
  const [tab, setTab] = useState<"conceptos" | "preguntas" | "examen">("conceptos");
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [examFinishedAt, setExamFinishedAt] = useState<number | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<number | null>(null);

  const questions = reviewBundle.questions ?? [];
  const keyConcepts = reviewBundle.keyConcepts ?? [];
  const examQuestions = reviewBundle.examQuestions ?? [];

  useEffect(() => {
    if (tab === "examen" && !examStartedAt) {
      setExamStartedAt(Date.now());
    }
  }, [tab, examStartedAt]);

  const groupedQuestions = useMemo(() => {
    const groups = { basico: [] as typeof questions, intermedio: [] as typeof questions, avanzado: [] as typeof questions };
    for (const item of questions) {
      const key = item.difficulty ?? "intermedio";
      groups[key].push(item);
    }
    return groups;
  }, [questions]);

  const examScore = useMemo(() => {
    let correct = 0;
    examQuestions.forEach((item, index) => {
      if (examAnswers[index] === item.answer) correct += 1;
    });
    return { correct, total: examQuestions.length };
  }, [examAnswers, examQuestions]);

  const examComplete = examQuestions.length > 0 && Object.keys(examAnswers).length >= examQuestions.length;
  const examMinutes = examStartedAt
    ? Math.max(1, Math.round(((examFinishedAt ?? Date.now()) - examStartedAt) / 60_000))
    : 0;

  useEffect(() => {
    if (examComplete && !examFinishedAt) {
      setExamFinishedAt(Date.now());
    }
  }, [examComplete, examFinishedAt]);

  if (!keyConcepts.length && !questions.length && !examQuestions.length) {
    return null;
  }

  return (
    <OrganizerFloatPanel title="Repaso inteligente" hint="Conceptos · preguntas · examen IA" icon={<HelpCircle size={17} />} span={12}>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "conceptos" as const, label: "Conceptos clave" },
          { id: "preguntas" as const, label: "Preguntas IA" },
          { id: "examen" as const, label: "Examen IA" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === item.id
                ? "bg-[rgba(0,255,213,0.15)] text-[#00FFD5]"
                : "text-muted-foreground hover:text-[#F5F7FA]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "conceptos" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {keyConcepts.map((concept, index) => (
            <motion.button
              key={`${concept}-${index}`}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setSelectedConcept(selectedConcept === index ? null : index)}
              className={`rounded-xl border p-3 text-left transition ${
                selectedConcept === index
                  ? "border-[rgba(0,255,213,0.35)] bg-[rgba(0,255,213,0.1)]"
                  : "border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.45)] hover:border-[rgba(0,255,213,0.25)]"
              }`}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
                <Brain size={12} />
                Concepto {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#F5F7FA]">{concept}</p>
              {selectedConcept === index ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Repasa este concepto en el mapa y explícalo en voz alta antes de continuar.
                </p>
              ) : null}
            </motion.button>
          ))}
        </div>
      ) : null}

      {tab === "preguntas" ? (
        <div className="space-y-4">
          {(["basico", "intermedio", "avanzado"] as const).map((level) => {
            const items = groupedQuestions[level];
            if (!items.length) return null;
            return (
              <div key={level}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
                  {difficultyLabel[level]}
                </p>
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const globalIndex = `${level}-${index}`;
                    const isOpen = openIndex === globalIndex;
                    return (
                      <div key={globalIndex} className="overflow-hidden rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.35)]">
                        <button
                          type="button"
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="flex w-full items-start gap-2 px-3 py-3 text-left"
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[rgba(0,255,213,0.12)] text-[10px] font-bold text-[#00FFD5]">
                            {index + 1}
                          </span>
                          <span className="flex-1 text-sm leading-6 text-[#F5F7FA]">{item.question}</span>
                          <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                            <ChevronDown size={16} className="text-muted-foreground" />
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-[rgba(0,255,213,0.08)] px-3 py-3"
                            >
                              <p className="text-xs font-semibold text-[#00FFD5]">Respuesta</p>
                              <p className="mt-1 text-xs leading-6 text-[#F5F7FA]/90">{item.answer}</p>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "examen" ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,255,213,0.06)] px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Puntaje: <span className="font-semibold text-[#00FFD5]">{examScore.correct}/{examScore.total}</span>
            </p>
            {examStartedAt ? (
              <p className="text-xs text-muted-foreground">
                Tiempo: <span className="font-semibold text-[#F5F7FA]">{examMinutes} min</span>
              </p>
            ) : null}
            {examComplete ? (
              <p className="flex items-center gap-1 text-xs font-semibold text-[#00FFD5]">
                <Trophy size={12} />
                Dominio: {examScore.total ? Math.round((examScore.correct / examScore.total) * 100) : 0}%
              </p>
            ) : null}
          </div>

          {examQuestions.map((item, index) => (
            <div key={`exam-${index}`} className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.4)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
                {item.type.replace("_", " ")}
              </p>
              <p className="mt-2 text-sm font-medium text-[#F5F7FA]">{item.question}</p>
              {item.type === "caso_practico" ? (
                <textarea
                  className="mt-3 w-full rounded-lg border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.5)] px-3 py-2 text-xs text-[#F5F7FA]"
                  rows={3}
                  placeholder="Escribe tu solución..."
                  onChange={(e) => setExamAnswers((c) => ({ ...c, [index]: e.target.value ? "respondido" : "" }))}
                />
              ) : item.options?.length ? (
                <div className="mt-3 space-y-2">
                  {item.options.map((option) => {
                    const answered = examAnswers[index];
                    const isSelected = answered === option;
                    const showResult = Boolean(answered);
                    const isCorrect = option === item.answer;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setExamAnswers((c) => ({ ...c, [index]: option }));
                          onAnswerRecorded?.(option === item.answer);
                        }}
                        className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                          showResult && isSelected
                            ? isCorrect
                              ? "border-[rgba(0,255,213,0.4)] bg-[rgba(0,255,213,0.1)] text-[#00FFD5]"
                              : "border-red-400/40 bg-red-500/10 text-red-200"
                            : isSelected
                              ? "border-[rgba(0,255,213,0.4)] bg-[rgba(0,255,213,0.1)] text-[#00FFD5]"
                              : "border-[rgba(0,255,213,0.1)] text-muted-foreground hover:border-[rgba(0,255,213,0.25)]"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {examAnswers[index] && item.explanation ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  <span className="text-[#00FFD5]">Retroalimentación:</span> {item.explanation}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <ClipboardCheck size={12} className="text-[#00FFD5]" />
        Prioriza conceptos fallados y repasa con flashcards antes del siguiente intento.
      </p>
    </OrganizerFloatPanel>
  );
}
