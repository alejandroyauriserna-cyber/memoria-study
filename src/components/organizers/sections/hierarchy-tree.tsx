"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GitBranch } from "lucide-react";
import { OrganizerSectionShell } from "@/components/organizers/sections/organizer-section-shell";

export function HierarchyTree({
  root,
  branches,
}: {
  root: string;
  branches: string[];
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <OrganizerSectionShell
      title="Jerarquía"
      subtitle="Estructura expandible del contenido"
      icon={<GitBranch size={18} />}
    >
      <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center gap-3 rounded-xl bg-accent-soft/70 px-4 py-3 text-left transition hover:bg-accent-soft"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-accent-foreground">
            R
          </span>
          <span className="flex-1 text-sm font-semibold text-foreground">{root}</span>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} className="text-muted-foreground" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              {branches.map((branch, index) => (
                <motion.li
                  key={`${branch}-${index}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="relative ml-6 mt-3 border-l border-border pl-4"
                >
                  <span className="absolute -left-[5px] top-3 h-2 w-2 rounded-full bg-accent" />
                  <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                    {branch}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    </OrganizerSectionShell>
  );
}
