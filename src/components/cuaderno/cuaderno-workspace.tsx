"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CuadernoBookshelf } from "@/components/cuaderno/cuaderno-bookshelf";
import { CuadernoBookshelfHero } from "@/components/cuaderno/cuaderno-bookshelf-hero";
import { CuadernoSyncProvider } from "@/components/cuaderno/cuaderno-sync-context";
import { CuadernoDictionaryTab } from "@/components/cuaderno/cuaderno-dictionary-tab";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-premium.css";
import "./cuaderno-paper.css";
import "./cuaderno-bookshelf.css";

type Tab = "notes" | "dictionary";

export function CuadernoWorkspace({
  initialClasses,
  profileName = "Estudiante",
  studyHoursLabel = "—",
}: {
  initialClasses: CuadernoClass[];
  profileName?: string;
  studyHoursLabel?: string;
}) {
  const [tab, setTab] = useState<Tab>("notes");

  return (
    <CuadernoSyncProvider>
      <div className="cuaderno-premium ms-notebook-shell cuaderno-shell cn-bookshelf-page mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
        <nav className="cn-bookshelf-nav" aria-label="Secciones del cuaderno">
          <button type="button" className="cn-tab" data-active={tab === "notes"} onClick={() => setTab("notes")}>
            Biblioteca
          </button>
          <button
            type="button"
            className="cn-tab"
            data-active={tab === "dictionary"}
            onClick={() => setTab("dictionary")}
          >
            Diccionario
          </button>
        </nav>

        <AnimatePresence mode="wait">
          {tab === "notes" ? (
            <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CuadernoBookshelfHero
                profileName={profileName}
                classes={initialClasses}
                studyHoursLabel={studyHoursLabel}
              />
              <CuadernoBookshelf classes={initialClasses} />
            </motion.div>
          ) : (
            <motion.div key="dict" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CuadernoDictionaryTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CuadernoSyncProvider>
  );
}
