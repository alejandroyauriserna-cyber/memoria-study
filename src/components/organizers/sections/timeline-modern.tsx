"use client";

import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { OrganizerSectionShell } from "@/components/organizers/sections/organizer-section-shell";

type TimelineEvent = { date?: string; label: string };

export function TimelineModern({ events }: { events: TimelineEvent[] }) {
  return (
    <OrganizerSectionShell
      title="Línea de tiempo"
      subtitle="Secuencia visual del contenido"
      icon={<Clock3 size={18} />}
    >
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4 px-1">
          {events.map((event, index) => (
            <motion.div
              key={`${event.label}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="relative w-56 shrink-0"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent bg-card text-xs font-bold text-accent">
                  {index + 1}
                </span>
                {index < events.length - 1 ? (
                  <span className="h-px flex-1 bg-gradient-to-r from-accent/50 to-transparent" />
                ) : null}
              </div>
              <div className="mt-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                {event.date ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                    {event.date}
                  </p>
                ) : null}
                <p className="mt-1 text-sm leading-6 text-foreground">{event.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </OrganizerSectionShell>
  );
}
