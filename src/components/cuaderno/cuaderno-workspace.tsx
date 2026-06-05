"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CuadernoBookshelf } from "@/components/cuaderno/cuaderno-bookshelf";
import { CuadernoSyncProvider } from "@/components/cuaderno/cuaderno-sync-context";
import { CuadernoDictionaryTab } from "@/components/cuaderno/cuaderno-dictionary-tab";
import type { CuadernoClass } from "@/types/cuaderno";
import "./cuaderno-premium.css";
import "./cuaderno-paper.css";

type Tab = "notes" | "dictionary";

export function CuadernoWorkspace({ initialClasses }: { initialClasses: CuadernoClass[] }) {
  const [tab, setTab] = useState<Tab>("notes");

  return (
    <CuadernoSyncProvider>
    <div className="cuaderno-premium ms-notebook-shell cuaderno-shell cn-immersive-root--luxury mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-10 text-center md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#00FFD5]">
          Cuaderno IA
        </p>
        <h1 className="cn-hero-title mt-2 text-4xl font-bold tracking-tight text-[#F5F7FA] md:text-5xl">
          Mis apuntes
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:mx-0">
          Tu biblioteca universitaria: carpetas con portada, hojas a pantalla completa e IA al costado.
        </p>
      </header>

      <nav className="mb-8 flex flex-wrap justify-center gap-2 md:justify-start">
        <button type="button" className="cn-tab" data-active={tab === "notes"} onClick={() => setTab("notes")}>
          📚 Estantería
        </button>
        <button
          type="button"
          className="cn-tab"
          data-active={tab === "dictionary"}
          onClick={() => setTab("dictionary")}
        >
          📖 Diccionario
        </button>
      </nav>

      <AnimatePresence mode="wait">
        {tab === "notes" ? (
          <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
