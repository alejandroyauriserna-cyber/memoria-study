"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { FlashcardCarousel } from "@/components/organizers/sections/flashcard-carousel";
import type { StudyBranch } from "@/lib/organizers/concept-map-study";

export function ConceptMapBranchStudyModal({
  open,
  branch,
  flashcards,
  onClose,
}: {
  open: boolean;
  branch: StudyBranch | null;
  flashcards: Array<{ question: string; answer: string }>;
  onClose: () => void;
}) {
  const Icon = branch?.icon;

  return (
    <AnimatePresence>
      {open && branch ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="max-h-[85%] w-full max-w-lg overflow-y-auto rounded-[24px] border border-white/40 p-4 shadow-2xl"
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.95), ${branch.soft})`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Icon ? (
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                    style={{ background: branch.color }}
                  >
                    <Icon size={16} />
                  </span>
                ) : null}
                <div>
                  <p className="text-sm font-semibold text-foreground">Estudiar rama</p>
                  <p className="text-xs text-muted-foreground">{branch.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/5"
              >
                <X size={16} />
              </button>
            </div>
            <FlashcardCarousel flashcards={flashcards} embedded />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
