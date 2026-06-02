"use client";

import { motion } from "framer-motion";

export function OrganizerContentSkeleton({ studio = false }: { studio?: boolean }) {
  return (
    <div className="space-y-4">
      {studio ? (
        <div className="organizer-dot-grid h-[min(50vh,400px)] animate-pulse rounded-[20px] border border-white/50 bg-white/30" />
      ) : null}
      <div className="organizer-bento">
        {[8, 4, 6, 6].map((span) => (
          <motion.div
            key={span}
            animate={{ opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="organizer-glass h-36 rounded-[22px]"
            style={{ gridColumn: `span ${span} / span ${span}` }}
          />
        ))}
      </div>
    </div>
  );
}

export function OrganizerListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.div
          key={index}
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 1.3, repeat: Infinity, delay: index * 0.06 }}
          className="organizer-glass h-52 rounded-[24px]"
        />
      ))}
    </div>
  );
}
