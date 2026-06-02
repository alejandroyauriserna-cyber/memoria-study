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
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: fullscreen ? 0 : 40, scale: fullscreen ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: fullscreen ? 0 : 32, scale: fullscreen ? 1 : 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={
              fullscreen
                ? "fixed left-[2.5vw] top-[2.5vh] z-[70] flex h-[95vh] w-[95vw] flex-col overflow-hidden rounded-2xl border border-[rgba(245,158,11,0.25)] bg-[#07131A] shadow-[0_0_80px_rgba(245,158,11,0.15)]"
                : `fixed z-[70] flex max-h-[min(88vh,920px)] flex-col overflow-hidden rounded-2xl border border-[rgba(0,255,213,0.2)] bg-[rgba(7,19,26,0.96)] shadow-[0_0_64px_rgba(0,255,213,0.12)] backdrop-blur-2xl ${
                    wide
                      ? "inset-x-4 bottom-4 top-auto sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:w-[min(960px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2"
                      : "inset-x-4 bottom-4 top-auto sm:inset-x-auto sm:right-6 sm:top-1/2 sm:w-[min(520px,calc(100vw-2rem))] sm:-translate-y-1/2"
                  }`
            }
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {!fullscreen ? (
              <div className="flex items-center justify-between border-b border-[rgba(0,255,213,0.12)] px-4 py-3">
                <h3 className="text-sm font-semibold text-[#F5F7FA]">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-[rgba(0,255,213,0.08)] hover:text-[#00FFD5]"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
            <div
              className={`min-h-0 flex-1 ${fullscreen ? "flex flex-col" : "overflow-y-auto p-4 sm:p-5"}`}
            >
              {children}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
