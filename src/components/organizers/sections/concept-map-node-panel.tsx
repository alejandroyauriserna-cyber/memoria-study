"use client";

import { motion } from "framer-motion";
import { Focus, GraduationCap, Link2, Lightbulb, X } from "lucide-react";
import type { NodeStudyDetail, StudyBranch, StudyMapNode } from "@/lib/organizers/concept-map-study";
import { branchForId } from "@/lib/organizers/concept-map-study";

export function ConceptMapNodePanel({
  node,
  branch,
  detail,
  focusMode,
  onClose,
  onFocusBranch,
  onStudyBranch,
}: {
  node: StudyMapNode;
  branch: StudyBranch;
  detail: NodeStudyDetail;
  focusMode: boolean;
  onClose: () => void;
  onFocusBranch: () => void;
  onStudyBranch: () => void;
}) {
  const BranchIcon = branch.icon;

  return (
    <motion.aside
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="absolute bottom-4 right-4 top-4 z-30 flex w-[min(100%,320px)] flex-col overflow-hidden rounded-2xl border border-white/50 shadow-2xl backdrop-blur-xl sm:right-5"
        style={{
          background: `linear-gradient(165deg, rgba(255,255,255,0.92) 0%, ${branch.soft} 100%)`,
        }}
      >
        <div
          className="flex items-start justify-between gap-2 border-b border-black/5 px-4 py-3"
          style={{ borderColor: `${branch.color}22` }}
        >
          <div className="min-w-0">
            <div
              className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
              style={{ background: branch.color }}
            >
              <BranchIcon size={12} />
              {branch.name}
            </div>
            <h4 className="text-base font-semibold leading-snug text-foreground">{node.label}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 transition hover:bg-black/10"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          <section>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Lightbulb size={12} style={{ color: branch.color }} /> Definición
            </p>
            <p className="leading-6 text-foreground/90">{detail.definition}</p>
          </section>
          <section>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <GraduationCap size={12} style={{ color: branch.color }} /> Para memorizar
            </p>
            <p className="leading-6 text-foreground/85">{detail.example}</p>
          </section>
          {detail.relations.length ? (
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Link2 size={12} style={{ color: branch.color }} /> Relaciones
              </p>
              <ul className="space-y-1.5">
                {detail.relations.map((rel) => (
                  <li
                    key={rel}
                    className="rounded-lg px-2.5 py-1.5 text-xs leading-5"
                    style={{ background: branch.soft, color: "inherit" }}
                  >
                    {rel}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-black/5 p-3">
          <button
            type="button"
            onClick={onFocusBranch}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition ${
              focusMode ? "bg-foreground text-background" : "bg-black/5 text-foreground hover:bg-black/8"
            }`}
          >
            <Focus size={14} />
            {focusMode ? "Salir de enfoque" : "Modo enfoque en rama"}
          </button>
          <button
            type="button"
            onClick={onStudyBranch}
            className="flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white shadow-lg transition hover:brightness-105"
            style={{ background: branch.color, boxShadow: `0 8px 24px ${branch.glow}` }}
          >
            <GraduationCap size={14} />
            Estudiar rama
          </button>
        </div>
      </motion.aside>
  );
}

export function getBranchForNode(node: StudyMapNode) {
  return branchForId(node.branchId);
}
