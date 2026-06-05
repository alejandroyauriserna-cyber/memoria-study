"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import { cnCoverClass } from "@/lib/cuaderno/preferences";
import { formatCuadernoRelativeTime } from "@/lib/cuaderno/folders";
import type { CuadernoFolder } from "@/lib/cuaderno/folders";

export function CuadernoFolderCard({ folder }: { folder: CuadernoFolder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Link
        href={`/cuaderno/curso/${folder.courseId}`}
        className={`cuaderno-folder-card block p-5 ${cnCoverClass(folder.cover)}`}
        style={{ "--folder-accent": folder.accent } as React.CSSProperties}
      >
        <div className="relative z-10 flex items-start justify-between gap-3">
          <span className="text-3xl" aria-hidden>
            {folder.icon}
          </span>
          <FolderOpen size={20} className="text-white/40" />
        </div>
        <h3 className="relative z-10 mt-6 text-sm font-bold uppercase tracking-wide text-white/90">
          {folder.courseName}
        </h3>
        <p className="relative z-10 mt-1 text-xs text-white/55">{folder.cycleLabel}</p>
        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3 text-xs text-white/70">
          <div>
            <p className="font-semibold text-white">{folder.classCount}</p>
            <p className="text-white/50">clases</p>
          </div>
          <div>
            <p className="font-semibold text-white">{folder.pageCount}</p>
            <p className="text-white/50">páginas</p>
          </div>
        </div>
        <p className="relative z-10 mt-3 text-[11px] text-white/45">
          última edición: {formatCuadernoRelativeTime(folder.lastEditedAt)}
        </p>
        <div className="cuaderno-progress relative z-10 mt-4">
          <span style={{ width: `${folder.progress}%` }} />
        </div>
      </Link>
    </motion.div>
  );
}
