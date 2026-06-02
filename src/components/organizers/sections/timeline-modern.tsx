"use client";

import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";

type TimelineEvent = { date?: string; label: string };

export function TimelineModern({ events }: { events: TimelineEvent[] }) {
  return (
    <OrganizerFloatPanel title="Línea de tiempo" hint="Desliza en móvil" icon={<Clock3 size={17} />} span={6}>
      <div className="-mx-1 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-3 px-1">
          {events.map((event, index) => (
            <motion.div
              key={`${event.label}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="w-44 shrink-0"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                  {index + 1}
                </span>
                <span className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
              </div>
              <div className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-3">
                {event.date ? (
                  <p className="text-[10px] font-semibold text-accent">{event.date}</p>
                ) : null}
                <p className="mt-1 text-xs leading-5 text-foreground">{event.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </OrganizerFloatPanel>
  );
}
