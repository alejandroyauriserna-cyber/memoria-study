"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { OrganizerContentView } from "@/components/organizers/organizer-content-view";
import {
  formatOrganizerDate,
  organizerTypeLabel,
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[32px] border border-border bg-background shadow-[0_40px_120px_rgba(15,23,42,0.22)] sm:rounded-[32px]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={organizer.title}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                  {organizerTypeLabel(String(organizer.organizer_type))}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                  {organizer.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {organizer.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border bg-muted px-3 py-1">
                    {organizer.course_name}
                  </span>
                  <span className="rounded-full border border-border bg-muted px-3 py-1">
                    {organizer.cycle_label}
                  </span>
                  <span className="rounded-full border border-border bg-muted px-3 py-1">
                    Creado {formatOrganizerDate(organizer.created_at)}
                  </span>
                  {regenerated ? (
                    <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-accent">
                      Regenerado {formatOrganizerDate(organizer.updated_at)}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card hover:bg-muted"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-6 sm:px-7">
              <OrganizerContentView content={organizer.content} loading={loading} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
