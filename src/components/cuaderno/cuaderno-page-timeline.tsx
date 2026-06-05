"use client";

import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { CuadernoPage } from "@/lib/cuaderno/cuaderno-pages";
import { groupPagesIntoUnits } from "@/lib/cuaderno/page-content-utils";

export function CuadernoPageTimeline({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onToggleFavorite,
}: {
  pages: CuadernoPage[];
  activePageId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onToggleFavorite: (id: string) => void;
}) {
  const units = groupPagesIntoUnits(pages);
  const [openUnits, setOpenUnits] = useState<Set<string>>(() => new Set(units.map((u) => u.id)));

  function toggleUnit(id: string) {
    setOpenUnits((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <aside className="cn-page-timeline" aria-label="Índice de estudio">
      <div className="cn-page-timeline-head">
        <span>Índice</span>
        <button type="button" className="cn-page-sidebar-add" onClick={onAdd} title="Nueva página">
          <Plus size={15} />
        </button>
      </div>

      <div className="cn-page-timeline-tree">
        {units.map((unit) => {
          const open = openUnits.has(unit.id);
          return (
            <div key={unit.id} className="cn-page-timeline-unit">
              <button type="button" className="cn-page-timeline-unit-btn" onClick={() => toggleUnit(unit.id)}>
                <span className="cn-page-timeline-unit-marker" aria-hidden>
                  {open ? "−" : "+"}
                </span>
                {unit.label}
              </button>
              <AnimatePresence initial={false}>
                {open ? (
                  <motion.ul
                    className="cn-page-timeline-pages"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    {unit.pages.map((page, index) => {
                      const active = page.id === activePageId;
                      return (
                        <li key={page.id} className={active ? "is-active" : ""}>
                          <button type="button" className="cn-page-timeline-page" onClick={() => onSelect(page.id)}>
                            <span className="min-w-0 flex-1 text-left">
                              <strong>{page.title || `Página ${index + 1}`}</strong>
                            </span>
                          </button>
                          <button
                            type="button"
                            className={`cn-page-timeline-star${page.favorite ? " is-on" : ""}`}
                            onClick={() => onToggleFavorite(page.id)}
                            aria-label="Marcar favorita"
                            title="Favorita"
                          >
                            ★
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
