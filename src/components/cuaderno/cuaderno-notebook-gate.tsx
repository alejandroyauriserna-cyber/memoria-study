"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import { cnCoverClass } from "@/lib/cuaderno/preferences";

export function CuadernoNotebookGate({
  title,
  courseName,
  pageLabel,
  pageNumber,
  progressPercent,
  coverArt,
  onOpenPage,
}: {
  title: string;
  courseName: string;
  pageLabel: string;
  pageNumber: number;
  progressPercent: number;
  coverArt: CourseCoverArt;
  onOpenPage: () => void;
}) {
  return (
    <motion.div
      className="cn-notebook-gate"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className={`cn-notebook-gate-cover ${cnCoverClass(coverArt.cover)}`}
        style={{ "--notebook-accent": coverArt.accent } as React.CSSProperties}
      >
        <div className="cn-notebook-gate-motifs" aria-hidden>
          {coverArt.motifs.slice(0, 4).map((word) => (
            <span key={word}>{word}</span>
          ))}
        </div>
        <span className="cn-notebook-gate-icon">{coverArt.icon}</span>
        <p className="cn-notebook-gate-kicker">{courseName}</p>
        <h2 className="cn-notebook-gate-title">{title}</h2>
        <div className="cn-notebook-gate-spine" aria-hidden />
      </div>

      <div className="cn-notebook-gate-body">
        <p className="cn-notebook-gate-label">
          <Sparkles size={14} />
          Continúa estudiando
        </p>
        <p className="cn-notebook-gate-topic">{pageLabel}</p>
        <p className="cn-notebook-gate-meta">
          Página {pageNumber} · {progressPercent}% del cuaderno
        </p>
        <div className="cn-notebook-gate-progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <button type="button" className="cn-notebook-gate-cta" onClick={onOpenPage}>
          <BookOpen size={16} />
          Abrir página {pageNumber}
          <ArrowRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
