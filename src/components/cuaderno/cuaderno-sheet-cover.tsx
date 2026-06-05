"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { formatCuadernoRelativeTime } from "@/lib/cuaderno/format";
import { getTemplatePreviewClass } from "@/lib/cuaderno/paper-styles";
import { estimatePageCount, parseNoteContent, type SheetCoverMeta } from "@/lib/cuaderno/note-meta";
import { generateSheetCoverRemote } from "@/lib/cuaderno/collections-client";
import { getTemplate } from "@/lib/cuaderno/templates";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import type { CuadernoClass } from "@/types/cuaderno";

export function CuadernoSheetCover({
  item,
  courseCover,
  isFavorite,
  onNotesUpdated,
  index = 0,
}: {
  item: CuadernoClass;
  courseCover: CourseCoverArt;
  isFavorite?: boolean;
  onNotesUpdated?: (notes: string) => void;
  index?: number;
}) {
  const { meta } = parseNoteContent(item.notes);
  const template = getTemplate(meta.templateId);
  const sheet = meta.sheetCover;
  const [generating, setGenerating] = useState(false);
  const [localSheet, setLocalSheet] = useState<SheetCoverMeta | undefined>(sheet);
  const coverProgress = useLoadingProgress(generating, "aiGenerate");

  const display = localSheet ?? defaultSheet(item, courseCover);
  const pages = estimatePageCount(item.notes);

  async function generateMini() {
    setGenerating(true);
    try {
      const result = await generateSheetCoverRemote(item.id);
      setLocalSheet(result.sheetCover);
      onNotesUpdated?.(result.notes);
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  }

  return (
    <motion.article
      className="cn-sheet-wrap group"
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      style={{ "--cn-course-accent": courseCover.accent } as React.CSSProperties}
    >
      <Link href={`/cuaderno/${item.id}`} className="cn-sheet-cover block">
        <div
          className="cn-sheet-face"
          style={
            {
              "--cn-sheet-tint": display.tint,
              borderColor: `${courseCover.accent}44`,
            } as React.CSSProperties
          }
        >
          <div
            className={`cn-sheet-pattern-preview ${getTemplatePreviewClass(meta.templateId)} cn-paper-preview-sheet`}
            aria-hidden
          />
          <motion.span
            className="cn-sheet-fav"
            animate={isFavorite ? { scale: [1, 1.2, 1] } : {}}
          >
            {isFavorite ? <Star size={14} fill="currentColor" className="cn-sheet-star" /> : null}
          </motion.span>
          <span className="cn-sheet-icon">{display.icon}</span>
          <span className="cn-sheet-number">
            {item.classNumber != null ? String(item.classNumber).padStart(2, "0") : "—"}
          </span>
          <span className="cn-sheet-template-badge">{template.label}</span>
        </div>
        <div className="cn-sheet-info">
          <h3 className="cn-sheet-title">{item.title}</h3>
          {item.topic ? <p className="cn-sheet-topic">{item.topic}</p> : null}
          <p className="cn-sheet-meta">
            {pages} {pages === 1 ? "pág" : "págs"} · {formatCuadernoRelativeTime(item.updatedAt)}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          void generateMini();
        }}
        disabled={generating}
        className="cn-sheet-ai-btn"
        title={generating ? `Generando mini portada… ${coverProgress.percent}%` : "Generar mini portada con IA"}
      >
        {generating ? `${coverProgress.percent}%` : <Sparkles size={12} />}
      </button>
      {generating ? (
        <LoadingState
          active
          preset="aiGenerate"
          percent={coverProgress.percent}
          message={coverProgress.message}
          stageLabel={coverProgress.stageLabel}
          variant="inline"
          className="cn-sheet-ai-progress"
        />
      ) : null}
    </motion.article>
  );
}

function defaultSheet(item: CuadernoClass, course: CourseCoverArt): SheetCoverMeta {
  const keyword =
    item.topic?.split(" ").slice(0, 2).join(" ") ||
    course.motifs[0]?.slice(0, 18) ||
    item.title.split(" ").slice(0, 2).join(" ");
  return {
    icon: course.icon,
    keyword,
    tint: `${course.accent}33`,
  };
}
