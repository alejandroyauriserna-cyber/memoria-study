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
  onContentUpdate,
}: {
  organizer: OrganizerRecord | null;
  loading?: boolean;
  onClose: () => void;
  onContentUpdate?: (organizerId: string, content: unknown) => void;
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
          className="organizers-studio fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col bg-[#07131A]"
          role="dialog"
          aria-modal="true"
          aria-label={organizer.title}
        >
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.85)] px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00FFD5] to-[#00BFFF] text-[#07131A] shadow-[0_0_20px_rgba(0,255,213,0.35)]">
                <Sparkles size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold tracking-tight text-[#F5F7FA] sm:text-lg">
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
                      <span className="text-[#00FFD5]">Regenerado {formatOrganizerDate(organizer.updated_at)}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.6)] text-[#F5F7FA] transition hover:border-[rgba(0,255,213,0.4)] hover:bg-[rgba(0,255,213,0.08)]"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <OrganizerContentView
              content={organizer.content}
              loading={loading}
              studio
              deckKey={organizer.id}
              organizerId={organizer.id}
              onContentUpdate={(content) => onContentUpdate?.(organizer.id, content)}
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
