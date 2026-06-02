"use client";

import { motion } from "framer-motion";
import { BookOpen, GitCompare, Table2 } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";
import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";

type VisualSummary = NonNullable<StoredOrganizerContent["visualSummary"]>;

export function VisualSummaryCard({
  summary,
  visualSummary,
}: {
  summary: string;
  visualSummary?: VisualSummary;
}) {
  const conceptCards = visualSummary?.conceptCards ?? [];
  const comparisons = visualSummary?.comparisons ?? [];
  const legalTables = visualSummary?.legalTables ?? [];

  return (
    <OrganizerFloatPanel
      title="Resumen visual IA"
      hint="Conceptos, comparaciones y tablas jurídicas"
      icon={<BookOpen size={17} />}
      span={12}
      variant="glow"
    >
      <p className="text-[15px] leading-[1.75] text-foreground/90">{summary}</p>

      {conceptCards.length ? (
        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">Conceptos esenciales</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conceptCards.map((card, index) => (
              <motion.div
                key={`${card.title}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-[rgba(0,255,213,0.12)] bg-[rgba(0,255,213,0.04)] p-3"
              >
                <p className="text-sm font-semibold text-[#F5F7FA]">{card.title}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}

      {comparisons.length ? (
        <div className="mt-5 space-y-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
            <GitCompare size={14} />
            Comparaciones
          </p>
          {comparisons.map((item, index) => (
            <div key={`${item.title}-${index}`} className="grid gap-2 rounded-xl border border-[rgba(0,255,213,0.1)] p-3 sm:grid-cols-[1fr,auto,1fr]">
              <div className="rounded-lg bg-[rgba(7,19,26,0.5)] p-3 text-xs leading-5 text-[#F5F7FA]">{item.left}</div>
              <div className="flex items-center justify-center text-[10px] font-bold uppercase tracking-[0.14em] text-[#00FFD5]">
                {item.title}
              </div>
              <div className="rounded-lg bg-[rgba(7,19,26,0.5)] p-3 text-xs leading-5 text-[#F5F7FA]">{item.right}</div>
            </div>
          ))}
        </div>
      ) : null}

      {legalTables.length ? (
        <div className="mt-5 space-y-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#00FFD5]">
            <Table2 size={14} />
            Tablas jurídicas
          </p>
          {legalTables.map((table, index) => (
            <div key={`${table.title}-${index}`} className="overflow-x-auto rounded-xl border border-[rgba(0,255,213,0.1)]">
              <p className="border-b border-[rgba(0,255,213,0.08)] px-3 py-2 text-xs font-semibold text-[#F5F7FA]">{table.title}</p>
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="bg-[rgba(0,255,213,0.06)] text-[#00FFD5]">
                    {table.headers.map((header) => (
                      <th key={header} className="px-3 py-2 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-[rgba(0,255,213,0.06)]">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-3 py-2 text-muted-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : null}
    </OrganizerFloatPanel>
  );
}
