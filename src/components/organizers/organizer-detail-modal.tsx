"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { OrganizerContentView } from "@/components/organizers/organizer-content-view";
import {
  formatOrganizerDate,
  wasOrganizerRegenerated,
} from "@/lib/organizers/format";
import type { OrganizerRecord } from "@/types/organizer";

export function OrganizerDetailModal({
  organizer,
  loading,
  onClose,
}: {
  organizer: OrganizerRecord | null;
  loading?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!organizer) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [organizer, onClose]);

  const regenerated = organizer
    ? wasOrganizerRegenerated(organizer.created_at, organizer.updated_at)
    : false;

  return (
    <AnimatePresence>
      {organizer ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="organizers-studio fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={organizer.title}
        >
          <div className="organizer-glass flex shrink-0 items-center justify-between gap-4 border-b border-white/40 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-emerald-600 text-white shadow-lg shadow-accent/25">
                <Sparkles size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {organizer.title}
                </h2>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span>{organizer.course_name}</span>
                  <span>·</span>
                  <span>{organizer.cycle_label}</span>
                  <span>·</span>
                  <span>{formatOrganizerDate(organizer.created_at)}</span>
                  {regenerated ? (
                    <>
                      <span>·</span>
                      <span className="text-accent">Regenerado {formatOrganizerDate(organizer.updated_at)}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-foreground/8 bg-foreground/[0.03] transition hover:bg-foreground/[0.06]"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
            <div className="mx-auto max-w-6xl">
              <OrganizerContentView content={organizer.content} loading={loading} studio />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
