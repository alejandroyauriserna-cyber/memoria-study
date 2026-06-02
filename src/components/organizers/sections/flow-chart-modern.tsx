"use client";

import { motion } from "framer-motion";
import { ArrowRight, Workflow } from "lucide-react";
import { OrganizerSectionShell } from "@/components/organizers/sections/organizer-section-shell";

export function FlowChartModern({
  start,
  end,
  steps = [],
}: {
  start: string;
  end: string;
  steps?: string[];
}) {
  const items = [start, ...steps.filter(Boolean), end];

  return (
    <OrganizerSectionShell
      title="Flujo del contenido"
      subtitle="Proceso descrito en el documento"
      icon={<Workflow size={18} />}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        {items.map((step, index) => (
          <div key={`${step}-${index}`} className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-sm ${
                index === 0
                  ? "border-accent/30 bg-accent-soft text-foreground"
                  : index === items.length - 1
                    ? "border-foreground/20 bg-foreground text-background"
                    : "border-border bg-card text-foreground"
              }`}
            >
              {step}
            </motion.div>
            {index < items.length - 1 ? (
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" />
            ) : null}
          </div>
        ))}
      </div>
    </OrganizerSectionShell>
  );
}
