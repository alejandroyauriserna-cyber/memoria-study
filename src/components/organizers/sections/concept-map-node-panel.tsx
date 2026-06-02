"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Focus, GraduationCap, HelpCircle, Link2, Lightbulb, X } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <motion.button
        type="button"
        data-study-panel
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        onClick={() => setCollapsed(false)}
        className="absolute bottom-4 right-4 z-30 flex items-center gap-2 rounded-xl border border-[rgba(0,255,213,0.3)] bg-[rgba(16,39,48,0.85)] px-4 py-2.5 text-xs font-semibold text-[#00FFD5] shadow-[0_0_32px_rgba(0,255,213,0.2)] backdrop-blur-xl"
      >
        <Lightbulb size={14} />
        {node.label}
      </motion.button>
    );
  }

  return (
    <motion.aside
      data-study-panel
      initial={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 12, scale: 0.96, filter: "blur(6px)" }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-3 left-3 right-3 z-30 flex max-h-[min(52vh,420px)] flex-col overflow-hidden rounded-2xl border border-[rgba(0,255,213,0.25)] bg-[rgba(16,39,48,0.82)] shadow-[0_0_48px_rgba(0,255,213,0.15),0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:bottom-auto sm:left-auto sm:right-4 sm:top-4 sm:w-[min(100%,340px)] sm:max-h-[calc(100%-2rem)]"
    >
      <div className="flex items-start justify-between gap-2 border-b border-[rgba(0,255,213,0.12)] px-4 py-3">
        <div className="min-w-0">
          <div
            className="mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#07131A]"
            style={{ background: `linear-gradient(135deg, ${branch.color}, rgba(0,191,255,0.85))` }}
          >
            <BranchIcon size={11} />
            {branch.name}
          </div>
          <h4 className="text-sm font-bold leading-snug text-[#F5F7FA]">{node.label}</h4>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-[rgba(0,255,213,0.08)] hover:text-[#00FFD5]"
            aria-label="Colapsar panel"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-[rgba(0,255,213,0.08)] hover:text-[#00FFD5]"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-3 text-sm">
        <section>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#00FFD5]">
            <Lightbulb size={11} /> Definición
          </p>
          <p className="leading-6 text-[#F5F7FA]/90">{detail.definition}</p>
        </section>
        <section>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#00BFFF]">
            <GraduationCap size={11} /> Ejemplo
          </p>
          <p className="leading-6 text-[#F5F7FA]/85">{detail.example}</p>
        </section>
        <section>
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#FF8A00]">
            <HelpCircle size={11} /> Repaso
          </p>
          <p className="leading-6 text-[#F5F7FA]/85">{detail.reviewQuestion}</p>
        </section>
        {detail.relations.length ? (
          <section>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Link2 size={11} style={{ color: branch.color }} /> Relaciones
            </p>
            <ul className="space-y-1">
              {detail.relations.map((rel) => (
                <li
                  key={rel}
                  className="rounded-lg border border-[rgba(0,255,213,0.1)] bg-[rgba(0,255,213,0.04)] px-2.5 py-1.5 text-xs leading-5 text-[#F5F7FA]/80"
                >
                  {rel}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-[rgba(0,255,213,0.1)] p-3 sm:flex-row">
        <button
          type="button"
          onClick={onFocusBranch}
          className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition ${
            focusMode
              ? "bg-[#00FFD5] text-[#07131A] shadow-[0_0_16px_rgba(0,255,213,0.35)]"
              : "border border-[rgba(0,255,213,0.2)] text-[#F5F7FA] hover:bg-[rgba(0,255,213,0.08)]"
          }`}
        >
          <Focus size={13} />
          {focusMode ? "Salir enfoque" : "Enfocar rama"}
        </button>
        <button
          type="button"
          onClick={onStudyBranch}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-[#07131A] transition hover:brightness-110"
          style={{ background: branch.color, boxShadow: `0 6px 20px ${branch.glow}` }}
        >
          <GraduationCap size={13} />
          Estudiar rama
        </button>
      </div>
    </motion.aside>
  );
}

export function getBranchForNode(node: StudyMapNode) {
  return branchForId(node.branchId);
}
