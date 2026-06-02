"use client";

import { motion } from "framer-motion";
import { ArrowRight, Workflow } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";

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
    <OrganizerFloatPanel title="Flujo" hint="Proceso del documento" icon={<Workflow size={17} />} span={12}>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((step, index) => (
          <div key={`${step}-${index}`} className="flex items-center gap-2">
            <motion.span
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium ${
                index === 0
                  ? "bg-accent/12 text-accent"
                  : index === items.length - 1
                    ? "bg-foreground text-background"
                    : "border border-foreground/8 bg-foreground/[0.03] text-foreground"
              }`}
            >
              {step}
            </motion.span>
            {index < items.length - 1 ? (
              <ArrowRight size={14} className="text-muted-foreground/60" />
            ) : null}
          </div>
        ))}
      </div>
    </OrganizerFloatPanel>
  );
}
