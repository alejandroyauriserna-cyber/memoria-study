"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Sparkles, X } from "lucide-react";
import { OrganizerContentView } from "@/components/organizers/organizer-content-view";
import {
  formatOrganizerDate,
  wasOrganizerRegenerated,
} from "@/lib/organizers/format";
import { parseOrganizerContent } from "@/lib/organizers/parse-content";
import type { OrganizerRecord } from "@/types/organizer";

export function OrganizerDetailModal({
  organizer,
  loading,
  readOnly = false,
  onClose,
  onContentUpdate,
}: {
  organizer: OrganizerRecord | null;
  loading?: boolean;
  readOnly?: boolean;
  onClose: () => void;
  onContentUpdate?: (organizerId: string, content: unknown) => void;
}) {
  const [content, setContent] = useState<unknown>(organizer?.content);

  useEffect(() => {
    setContent(organizer?.content);
  }, [organizer?.id, organizer?.content]);

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

  const parsed = parseOrganizerContent(content);
  const conceptNodes = parsed.conceptMap?.nodes?.filter(Boolean) ?? [];
  const hasConceptMap = Boolean(parsed.conceptMap?.title || conceptNodes.length);

  function handleContentUpdate(next: unknown) {
    setContent(next);
    if (organizer) onContentUpdate?.(organizer.id, next);
  }

  return (
    <AnimatePresence>
      {organizer ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="organizers-studio organizer-modal-root fixed inset-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={organizer.title}
        >
          {hasConceptMap ? (
            <>
              <div className="organizer-immersive-chrome pointer-events-none absolute inset-x-0 top-0 z-50 flex items-center gap-2 px-3 py-2.5 sm:px-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="organizer-immersive-back pointer-events-auto inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-sm font-semibold transition"
                  aria-label="Volver a organizadores"
                >
                  <ChevronLeft size={18} />
                  <span className="hidden sm:inline">Volver</span>
                </button>
                <h2 className="organizer-immersive-title min-w-0 flex-1 truncate text-sm font-bold tracking-tight sm:text-base">
                  {organizer.title}
                </h2>
              </div>

              {readOnly ? (
                <p className="organizer-modal-readonly pointer-events-none absolute inset-x-0 top-12 z-40 shrink-0 border-b px-4 py-1.5 text-center text-[11px] sm:px-6">
                  Vista compartida — solo lectura
                </p>
              ) : null}

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <OrganizerContentView
                  content={content}
                  loading={loading}
                  studio
                  deckKey={organizer.id}
                  organizerId={organizer.id}
                  organizerTitle={organizer.title}
                  onContentUpdate={readOnly ? undefined : handleContentUpdate}
                />
              </div>
            </>
          ) : (
            <>
              <div className="organizer-modal-head flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur-xl sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="organizer-modal-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                    <Sparkles size={18} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="organizer-modal-title truncate text-base font-bold tracking-tight sm:text-lg">
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
                          <span className="text-accent">
                            Regenerado {formatOrganizerDate(organizer.updated_at)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="organizer-modal-close flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {readOnly ? (
                <p className="organizer-modal-readonly shrink-0 border-b px-4 py-2 text-center text-xs sm:px-6">
                  Vista compartida — solo lectura
                </p>
              ) : null}

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <OrganizerContentView
                  content={content}
                  loading={loading}
                  studio
                  deckKey={organizer.id}
                  organizerId={organizer.id}
                  organizerTitle={organizer.title}
                  onContentUpdate={readOnly ? undefined : handleContentUpdate}
                />
              </div>
            </>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
