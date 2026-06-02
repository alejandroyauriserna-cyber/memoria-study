"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { OrganizerSectionShell } from "@/components/organizers/sections/organizer-section-shell";

export function ReviewQuestionsAccordion({ questions }: { questions: string[] }) {
  const items = questions.filter(Boolean);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items.length) return null;

  return (
    <OrganizerSectionShell
      title="Preguntas de repaso"
      subtitle="Tarjetas de repaso con acordeón"
      icon={<HelpCircle size={18} />}
    >
      <div className="space-y-3">
        {items.map((question, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={`${question}-${index}`}
              className="overflow-hidden rounded-2xl border border-border/80 bg-card/90"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-muted/40"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-medium leading-6 text-foreground">{question}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={18} className="text-muted-foreground" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
                      Usa esta pregunta para autoevaluarte antes del examen o repasar el PDF original.
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </OrganizerSectionShell>
  );
}
