"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { COVER_GRADIENTS } from "@/lib/cuaderno/preferences";
import { formatCuadernoRelativeTime } from "@/lib/cuaderno/format";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";

export type NotebookCoverStats = {
  classCount: number;
  pageCount: number;
  lastEditedAt: string | null;
  progress?: number;
};

export function CuadernoNotebookCover({
  href,
  title,
  coverArt,
  stats,
  compact = false,
  hero = false,
}: {
  href: string;
  title: string;
  coverArt: CourseCoverArt;
  stats?: NotebookCoverStats;
  compact?: boolean;
  hero?: boolean;
}) {
  const wrapClass = hero
    ? "cn-notebook-wrap cn-notebook-wrap--hero"
    : compact
      ? "cn-notebook-wrap cn-notebook-wrap--compact"
      : "cn-notebook-wrap";

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={wrapClass}
    >
      <Link
        href={href}
        className="cn-notebook-cover block"
        style={
          {
            background: COVER_GRADIENTS[coverArt.cover],
            "--notebook-accent": coverArt.accent,
          } as React.CSSProperties
        }
      >
        <div className="cn-notebook-motifs" aria-hidden>
          {coverArt.motifs.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </div>

        <div className="cn-notebook-body">
          <span className="cn-notebook-icon">{coverArt.icon}</span>
          <h3 className="cn-notebook-title">{title}</h3>
          {coverArt.subtitle ? (
            <p className="cn-notebook-subtitle">{coverArt.subtitle}</p>
          ) : null}

          {stats ? (
            <div className="cn-notebook-stats">
              <p>
                <strong>{stats.classCount}</strong> clases
              </p>
              <p>
                <strong>{stats.pageCount}</strong> páginas
              </p>
              <div className="cn-notebook-edited">
                <span className="cn-notebook-edited-label">Última edición:</span>
                <span>{formatCuadernoRelativeTime(stats.lastEditedAt)}</span>
              </div>
              {typeof stats.progress === "number" ? (
                <div className="cuaderno-progress cn-notebook-progress">
                  <span style={{ width: `${stats.progress}%` }} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="cn-notebook-spine" aria-hidden />
      </Link>
    </motion.div>
  );
}
