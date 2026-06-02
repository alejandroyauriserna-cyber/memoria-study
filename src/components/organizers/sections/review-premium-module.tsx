"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, ChevronDown, ClipboardCheck, HelpCircle, Sparkles } from "lucide-react";
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
  legacyQuestions = [],
}: {
  reviewBundle?: ReviewBundle;
  legacyQuestions?: string[];
}) {
  const [tab, setTab] = useState<"conceptos" | "preguntas" | "examen">("conceptos");
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});

  const questions = reviewBundle?.questions ?? [];
  const keyConcepts = reviewBundle?.keyConcepts ?? [];
  const examQuestions = reviewBundle?.examQuestions ?? [];

  const groupedQuestions = useMemo(() => {
    const groups = { basico: [] as typeof questions, intermedio: [] as typeof questions, avanzado: [] as typeof questions };
    for (const item of questions) {
      const key = item.difficulty ?? "intermedio";
      groups[key].push(item);
    }
    return groups;
  }, [questions]);

  const legacyItems = legacyQuestions.filter(Boolean);

  if (!keyConcepts.length && !questions.length && !examQuestions.length && !legacyItems.length) {
    return null;
  }

  return (
    <OrganizerFloatPanel title="Repaso inteligente" hint="IA · conceptos, preguntas y examen" icon={<HelpCircle size={17} />} span={12}>
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
          {(keyConcepts.length ? keyConcepts : legacyItems.slice(0, 6)).map((concept, index) => (
            <motion.div
              key={`${concept}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.45)] p-3"
            >
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
                <Brain size={12} />
                Concepto {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#F5F7FA]">{concept}</p>
            </motion.div>
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
                              <p className="text-xs leading-6 text-muted-foreground">{item.answer}</p>
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
          {!questions.length && legacyItems.length ? (
            <ReviewQuestionsLegacy questions={legacyItems} />
          ) : null}
        </div>
      ) : null}

      {tab === "examen" ? (
        <div className="space-y-3">
          {examQuestions.length ? (
            examQuestions.map((item, index) => (
              <div key={`exam-${index}`} className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.4)] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
                  {item.type.replace("_", " ")}
                </p>
                <p className="mt-2 text-sm font-medium text-[#F5F7FA]">{item.question}</p>
                {item.options?.length ? (
                  <div className="mt-3 space-y-2">
                    {item.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setExamAnswers((current) => ({ ...current, [index]: option }))}
                        className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition ${
                          examAnswers[index] === option
                            ? "border-[rgba(0,255,213,0.4)] bg-[rgba(0,255,213,0.1)] text-[#00FFD5]"
                            : "border-[rgba(0,255,213,0.1)] text-muted-foreground hover:border-[rgba(0,255,213,0.25)]"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
                {examAnswers[index] ? (
                  <p className={`mt-3 text-xs ${examAnswers[index] === item.answer ? "text-[#00FFD5]" : "text-[#FF8A00]"}`}>
                    {examAnswers[index] === item.answer ? "Correcto" : `Respuesta: ${item.answer}`}
                    {item.explanation ? ` · ${item.explanation}` : ""}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles size={14} className="text-[#00FFD5]" />
              El examen IA se generará con el próximo organizador enriquecido.
            </p>
          )}
        </div>
      ) : null}

      <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <ClipboardCheck size={12} className="text-[#00FFD5]" />
        Retención activa: repasa primero los conceptos marcados como avanzados y los que fallaste en el examen.
      </p>
    </OrganizerFloatPanel>
  );
}

function ReviewQuestionsLegacy({ questions }: { questions: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {questions.map((question, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={`${question}-${index}`} className="overflow-hidden rounded-xl border border-[rgba(0,255,213,0.1)]">
            <button type="button" onClick={() => setOpenIndex(isOpen ? null : index)} className="flex w-full items-start gap-2 px-3 py-3 text-left">
              <span className="text-sm text-[#F5F7FA]">{question}</span>
              <ChevronDown size={16} className="ml-auto text-muted-foreground" />
            </button>
            {isOpen ? (
              <div className="border-t border-[rgba(0,255,213,0.08)] px-3 py-2 text-xs text-muted-foreground">
                Refuerza con flashcards y el mapa de conceptos del organizador.
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
