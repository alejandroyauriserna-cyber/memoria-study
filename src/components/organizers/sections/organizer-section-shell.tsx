"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function OrganizerSectionShell({
  title,
  subtitle,
  icon,
  children,
  accent = "default",
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
  accent?: "default" | "highlight" | "warm";
}) {
  const accentClass =
    accent === "highlight"
      ? "from-accent/10 via-card to-card border-accent/20"
      : accent === "warm"
        ? "from-amber-50 via-card to-card border-amber-200/60"
        : "from-muted/40 via-card to-card border-border/80";

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`overflow-hidden rounded-[28px] border bg-gradient-to-br p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6 ${accentClass}`}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-sm">
          {icon}
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

export function ExecutiveSummaryCard({ summary }: { summary: string }) {
  return (
    <OrganizerSectionShell
      title="Executive Summary"
      subtitle="Síntesis fiel del documento"
      icon={<Sparkles size={18} />}
      accent="highlight"
    >
      <p className="text-[15px] leading-8 text-foreground/90">{summary}</p>
    </OrganizerSectionShell>
  );
}

export function EasyExplanationBlock({ explanation }: { explanation: string }) {
  return (
    <OrganizerSectionShell
      title="Explícamelo fácil"
      subtitle="Versión clara y directa del contenido"
      icon={<Sparkles size={18} />}
      accent="warm"
    >
      <div className="rounded-2xl border border-amber-200/50 bg-white/70 px-5 py-4 text-[15px] leading-8 text-foreground/90 backdrop-blur-sm">
        {explanation}
      </div>
    </OrganizerSectionShell>
  );
}
