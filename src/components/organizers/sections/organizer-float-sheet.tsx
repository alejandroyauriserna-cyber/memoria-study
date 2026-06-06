"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function OrganizerFloatSheet({
  open,
  title,
  onClose,
  children,
  wide = false,
  fullscreen = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  fullscreen?: boolean;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="organizer-float-sheet__backdrop fixed inset-0 z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, y: fullscreen ? 0 : 40, scale: fullscreen ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: fullscreen ? 0 : 32, scale: fullscreen ? 1 : 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`organizer-float-sheet fixed z-[70] flex max-h-[min(88vh,920px)] flex-col overflow-hidden rounded-2xl backdrop-blur-2xl ${
              fullscreen
                ? "organizer-float-sheet--fullscreen left-[2.5vw] top-[2.5vh] h-[95vh] w-[95vw] max-h-[95vh]"
                : wide
                  ? "organizer-float-sheet--wide inset-x-4 bottom-4 top-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[min(960px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2"
                  : "inset-x-4 bottom-4 top-auto sm:inset-x-auto sm:right-6 sm:top-1/2 sm:w-[min(520px,calc(100vw-2rem))] sm:-translate-y-1/2"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {!fullscreen ? (
              <div className="organizer-float-sheet__head flex items-center justify-between px-4 py-3">
                <h3 className="organizer-float-sheet__title text-sm font-semibold">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-[var(--org-accent-soft)] hover:text-[var(--org-accent)]"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
            <div
              className={`organizer-studio-panel min-h-0 flex-1 ${fullscreen ? "flex flex-col" : "overflow-y-auto p-4 sm:p-5"}`}
            >
              {children}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
