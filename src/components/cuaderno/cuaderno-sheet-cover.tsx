"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { formatCuadernoRelativeTime } from "@/lib/cuaderno/format";
import { estimatePageCount, parseNoteContent, type SheetCoverMeta } from "@/lib/cuaderno/note-meta";
import { generateSheetCoverRemote } from "@/lib/cuaderno/collections-client";
import type { CourseCoverArt } from "@/lib/cuaderno/course-covers";
import type { CuadernoClass } from "@/types/cuaderno";

export function CuadernoSheetCover({
  item,
  courseCover,
  isFavorite,
  onNotesUpdated,
}: {
  item: CuadernoClass;
  courseCover: CourseCoverArt;
  isFavorite?: boolean;
  onNotesUpdated?: (notes: string) => void;
}) {
  const { meta } = parseNoteContent(item.notes);
  const sheet = meta.sheetCover;
  const [generating, setGenerating] = useState(false);
  const [localSheet, setLocalSheet] = useState<SheetCoverMeta | undefined>(sheet);

  const display = localSheet ?? defaultSheet(item, courseCover);

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
    <motion.div
      whileHover={{ y: -4 }}
      className="cn-sheet-wrap group"
    >
      <Link href={`/cuaderno/${item.id}`} className="cn-sheet-cover block">
        <div
          className="cn-sheet-face"
          style={{
            background: `linear-gradient(155deg, ${display.tint} 0%, #0f1419 70%)`,
            borderColor: `${courseCover.accent}33`,
          }}
        >
          {isFavorite ? (
            <Star size={12} className="cn-sheet-star" fill="currentColor" aria-label="Favorito" />
          ) : null}
          <span className="cn-sheet-icon">{display.icon}</span>
          <span className="cn-sheet-number">
            {item.classNumber != null ? String(item.classNumber).padStart(2, "0") : "—"}
          </span>
          <p className="cn-sheet-keyword">{display.keyword}</p>
        </div>
        <div className="cn-sheet-info">
          <h3 className="cn-sheet-title">{item.title}</h3>
          {item.topic ? <p className="cn-sheet-topic">{item.topic}</p> : null}
          <p className="cn-sheet-meta">
            {estimatePageCount(item.notes)} págs · {formatCuadernoRelativeTime(item.updatedAt)}
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
        title="Generar mini portada con IA"
      >
        {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
      </button>
    </motion.div>
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
