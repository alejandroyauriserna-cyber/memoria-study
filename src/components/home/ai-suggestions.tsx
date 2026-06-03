"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Scale, Sparkles } from "lucide-react";
import type { AiSuggestion } from "@/lib/home/dashboard-types";

type AiSuggestionsProps = {
  suggestions: AiSuggestion[];
};

export function AiSuggestions({ suggestions }: AiSuggestionsProps) {
  return (
    <section>
      <div className="mb-4">
        <p className="ms-home-section-title">IA proactiva</p>
        <h2 className="mt-1 text-xl font-bold text-[#F5F7FA]">Sugerencias para ti</h2>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <motion.article
            key={suggestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="ms-home-glass overflow-hidden p-5 md:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(0,255,213,0.1)] text-[#00FFD5]">
                <Scale size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00FFD5]">
                  <Sparkles size={12} />
                  {suggestion.context}
                </p>
                <h3 className="mt-1 text-base font-semibold text-[#F5F7FA]">{suggestion.sourceTitle}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  La IA recomienda los siguientes pasos de estudio
                </p>
              </div>
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {suggestion.actions.map((action) => (
                <li key={action.id}>
                  <Link
                    href={action.href}
                    className="ms-home-chip inline-flex gap-1.5 pr-3"
                  >
                    {action.label}
                    <ArrowRight size={13} className="opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
