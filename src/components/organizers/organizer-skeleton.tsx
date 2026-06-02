"use client";

import { motion } from "framer-motion";

export function OrganizerContentSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((item) => (
        <motion.div
          key={item}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: item * 0.15 }}
          className="rounded-[28px] border border-border/70 bg-card/70 p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-40 rounded-full bg-muted" />
              <div className="h-3 w-56 rounded-full bg-muted/80" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 w-full rounded-full bg-muted/80" />
            <div className="h-3 w-[92%] rounded-full bg-muted/70" />
            <div className="h-3 w-[84%] rounded-full bg-muted/60" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function OrganizerListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.08 }}
          className="rounded-[28px] border border-border/70 bg-card/80 p-5"
        >
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="mt-4 h-6 w-4/5 rounded-full bg-muted" />
          <div className="mt-3 h-4 w-full rounded-full bg-muted/80" />
          <div className="mt-6 h-10 w-full rounded-2xl bg-muted/70" />
        </motion.div>
      ))}
    </div>
  );
}
