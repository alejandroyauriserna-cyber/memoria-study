"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function OrganizerFloatPanel({
  title,
  hint,
  icon,
  children,
  span = 6,
  variant = "default",
}: {
  title: string;
  hint?: string;
  icon: ReactNode;
  children: ReactNode;
  span?: 4 | 6 | 8 | 12;
  variant?: "default" | "glow" | "warm";
}) {
  const variantClass =
    variant === "glow"
      ? "ring-1 ring-accent/15"
      : variant === "warm"
        ? "ring-1 ring-amber-400/20"
        : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`organizer-float-card organizer-glass rounded-[22px] p-4 sm:p-5 ${variantClass}`}
      style={{ gridColumn: `span ${span} / span ${span}` }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-foreground/5 to-accent/10 text-accent">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export function ExecutiveSummaryCard({ summary }: { summary: string }) {
  return (
    <OrganizerFloatPanel
      title="Resumen ejecutivo"
      hint="Lo esencial del documento"
      icon={<span className="text-base">✦</span>}
      span={8}
      variant="glow"
    >
      <p className="text-[15px] leading-[1.75] text-foreground/90">{summary}</p>
    </OrganizerFloatPanel>
  );
}

export function EasyExplanationBlock({ explanation }: { explanation: string }) {
  return (
    <OrganizerFloatPanel
      title="Explícamelo fácil"
      hint="Sin jerga académica"
      icon={<span className="text-base">💡</span>}
      span={4}
      variant="warm"
    >
      <p className="text-sm leading-7 text-foreground/85">{explanation}</p>
    </OrganizerFloatPanel>
  );
}
