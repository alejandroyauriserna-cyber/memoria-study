"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cnCoverClass } from "@/lib/cuaderno/preferences";
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
  courseLabel,
  pinned = false,
  variant = "default",
  compact,
  hero,
}: {
  href: string;
  title: string;
  coverArt: CourseCoverArt;
  stats?: NotebookCoverStats;
  courseLabel?: string;
  pinned?: boolean;
  variant?: "default" | "compact" | "hero" | "shelf";
  /** @deprecated use variant="compact" */
  compact?: boolean;
  /** @deprecated use variant="hero" */
  hero?: boolean;
}) {
  const resolvedVariant = hero ? "hero" : compact ? "compact" : variant;
  const wrapClass =
    resolvedVariant === "hero"
      ? "cn-notebook-wrap cn-notebook-wrap--hero"
      : resolvedVariant === "compact"
        ? "cn-notebook-wrap cn-notebook-wrap--compact"
        : resolvedVariant === "shelf"
          ? "cn-notebook-wrap cn-notebook-wrap--shelf"
          : "cn-notebook-wrap";

  const hoverProps =
    resolvedVariant === "shelf"
      ? {
          whileHover: {
            y: -14,
            rotateY: -8,
            rotateX: 2,
            scale: 1.02,
            transition: { type: "spring" as const, stiffness: 280, damping: 22 },
          },
        }
      : {
          whileHover: { y: -6, scale: 1.02 },
          transition: { type: "spring" as const, stiffness: 320, damping: 24 },
        };

  return (
    <motion.div {...hoverProps} className={wrapClass} style={{ transformStyle: "preserve-3d" }}>
      <Link
        href={href}
        className={`cn-notebook-cover block ${cnCoverClass(coverArt.cover)}`}
        style={{ "--notebook-accent": coverArt.accent } as React.CSSProperties}
      >
        {pinned ? <span className="cn-notebook-pin" aria-label="Con favoritos" /> : null}

        <div className="cn-notebook-motifs" aria-hidden>
          {coverArt.motifs.slice(0, 3).map((word) => (
            <span key={word}>{word}</span>
          ))}
        </div>

        <div className="cn-notebook-body">
          <span className="cn-notebook-icon">{coverArt.icon}</span>
          <h3 className="cn-notebook-title">{title}</h3>
          {resolvedVariant !== "shelf" && coverArt.subtitle ? (
            <p className="cn-notebook-subtitle">{coverArt.subtitle}</p>
          ) : null}
          {resolvedVariant === "shelf" && courseLabel ? (
            <p className="cn-notebook-course">{courseLabel}</p>
          ) : null}

          {stats && resolvedVariant === "shelf" ? (
            <div className="cn-notebook-meta-shelf">
              <div className="cn-notebook-progress-row">
                <span>{typeof stats.progress === "number" ? stats.progress : 0}%</span>
                <div className="cuaderno-progress cn-notebook-progress">
                  <span style={{ width: `${stats.progress ?? 0}%` }} />
                </div>
              </div>
              <p className="cn-notebook-edited-shelf">
                {formatCuadernoRelativeTime(stats.lastEditedAt)}
              </p>
            </div>
          ) : null}

          {stats && resolvedVariant !== "shelf" ? (
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

        {resolvedVariant === "shelf" ? <div className="cn-notebook-edge" aria-hidden /> : null}
        <div className="cn-notebook-spine" aria-hidden />
      </Link>
    </motion.div>
  );
}
