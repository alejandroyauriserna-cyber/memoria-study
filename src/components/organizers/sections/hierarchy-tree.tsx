"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GitBranch } from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";

export function HierarchyTree({ root, branches }: { root: string; branches: string[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <OrganizerFloatPanel title="Jerarquía" hint="Expande los subtemas" icon={<GitBranch size={17} />} span={6}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-accent/10 to-transparent px-3 py-2.5 text-left transition hover:from-accent/15"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
          ◉
        </span>
        <span className="flex-1 text-sm font-semibold text-foreground">{root}</span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }}>
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 space-y-2 overflow-hidden pl-2"
          >
            {branches.map((branch, index) => (
              <motion.li
                key={`${branch}-${index}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-xl border border-foreground/5 bg-foreground/[0.02] px-3 py-2.5 text-sm text-foreground"
              >
                {branch}
              </motion.li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </OrganizerFloatPanel>
  );
}
