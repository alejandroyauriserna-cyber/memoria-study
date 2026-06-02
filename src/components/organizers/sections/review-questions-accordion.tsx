"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";

export function ReviewQuestionsAccordion({ questions }: { questions: string[] }) {
  const items = questions.filter(Boolean);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items.length) return null;

  return (
    <OrganizerFloatPanel title="Repaso" hint="Acordeón interactivo" icon={<HelpCircle size={17} />} span={6}>
      <div className="space-y-2">
        {items.map((question, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={`${question}-${index}`}
              className="overflow-hidden rounded-xl border border-foreground/5 bg-foreground/[0.02]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-start gap-2.5 px-3 py-3 text-left"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/12 text-[10px] font-bold text-accent">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm leading-6 text-foreground">{question}</span>
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
                    className="overflow-hidden border-t border-foreground/5 px-3 py-2 text-xs leading-5 text-muted-foreground"
                  >
                    Repasa con el PDF original y valida tu respuesta antes de continuar.
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </OrganizerFloatPanel>
  );
}
