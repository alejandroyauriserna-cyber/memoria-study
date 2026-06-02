"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  Focus,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Link2,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  GuidedStudyLaunchButton,
  GuidedStudyWalkthrough,
} from "@/components/organizers/sections/guided-study-walkthrough";
import type { NodeStudyDetail, StudyBranch, StudyMapNode } from "@/lib/organizers/concept-map-study";
import { branchForId } from "@/lib/organizers/concept-map-study";

function Section({
  icon,
  label,
  color,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
        {icon}
        {label}
      </p>
      <div className="text-sm leading-6 text-[#F5F7FA]/88">{children}</div>
    </section>
  );
}

export function StudyAssistantPanel({
  node,
  branch,
  detail,
  focusMode,
  onClose,
  onFocusBranch,
  onStudyBranch,
  embedded = false,
  drawer = false,
}: {
  node: StudyMapNode;
  branch: StudyBranch;
  detail: NodeStudyDetail;
  focusMode: boolean;
  onClose: () => void;
  onFocusBranch: () => void;
  onStudyBranch: () => void;
  embedded?: boolean;
  drawer?: boolean;
}) {
  const BranchIcon = branch.icon;
  const [collapsed, setCollapsed] = useState(false);
  const [guidedMode, setGuidedMode] = useState(false);

  const content = (
    <>
      <div className="flex items-start justify-between gap-2 border-b border-[rgba(0,255,213,0.12)] px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
            <Sparkles size={12} />
            Asistente de estudio
          </p>
          <div
            className="mb-1.5 mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#07131A]"
            style={{ background: `linear-gradient(135deg, ${branch.color}, rgba(0,191,255,0.85))` }}
          >
            <BranchIcon size={11} />
            {branch.name}
          </div>
          <h4 className="text-base font-bold leading-snug text-[#F5F7FA]">{node.label}</h4>
        </div>
        <div className="flex shrink-0 gap-1">
          {!embedded ? (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-[rgba(0,255,213,0.08)] hover:text-[#00FFD5]"
              aria-label="Colapsar panel"
            >
              <ChevronLeft size={16} />
            </button>
          ) : null}
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

      {guidedMode ? (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <GuidedStudyWalkthrough
            conceptLabel={node.label}
            detail={detail}
            onComplete={() => setGuidedMode(false)}
            onClose={() => setGuidedMode(false)}
          />
        </div>
      ) : (
        <>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
        <Section icon={<BookOpen size={11} />} label="Resumen IA" color="#00FFD5">
          {detail.summary}
        </Section>
        <Section icon={<Lightbulb size={11} />} label="Explicación sencilla" color="#00BFFF">
          {detail.simpleExplanation}
        </Section>
        <Section icon={<Target size={11} />} label="Importancia en examen" color="#FF8A00">
          {detail.examImportance}
        </Section>
        <Section icon={<GraduationCap size={11} />} label="Ejemplo jurídico" color="#00FFD5">
          {detail.legalExample}
        </Section>
        <Section icon={<HelpCircle size={11} />} label="Posible pregunta de examen" color="#00BFFF">
          {detail.examQuestion}
        </Section>
        <Section icon={<AlertTriangle size={11} />} label="Error frecuente" color="#FF8A00">
          {detail.commonMistake}
        </Section>
        <Section icon={<Sparkles size={11} />} label="Tip de memorización" color="#00FFD5">
          {detail.memoryTip}
        </Section>

        {detail.previousConcepts.length || detail.derivedConcepts.length ? (
          <section className="grid gap-2 sm:grid-cols-2">
            {detail.previousConcepts.length ? (
              <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.4)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conceptos previos</p>
                <ul className="mt-2 space-y-1 text-xs text-[#F5F7FA]/85">
                  {detail.previousConcepts.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {detail.derivedConcepts.length ? (
              <div className="rounded-xl border border-[rgba(0,255,213,0.1)] bg-[rgba(7,19,26,0.4)] p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conceptos derivados</p>
                <ul className="mt-2 space-y-1 text-xs text-[#F5F7FA]/85">
                  {detail.derivedConcepts.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        {detail.relations.length ? (
          <section>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Link2 size={11} style={{ color: branch.color }} />
              Relaciones
            </p>
            <div className="flex flex-wrap gap-1.5">
              {detail.relations.map((rel) => (
                <span
                  key={rel}
                  className="rounded-lg border border-[rgba(0,255,213,0.12)] bg-[rgba(0,255,213,0.06)] px-2.5 py-1 text-xs text-[#F5F7FA]/85"
                >
                  {rel}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-[rgba(0,255,213,0.1)] p-3">
        <GuidedStudyLaunchButton onClick={() => setGuidedMode(true)} />
        <div className="flex flex-col gap-2 sm:flex-row">
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
          {focusMode ? "Salir enfoque" : "Resaltar rama"}
        </button>
        <button
          type="button"
          onClick={onStudyBranch}
          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold text-[#07131A] transition hover:brightness-110"
          style={{ background: branch.color, boxShadow: `0 6px 20px ${branch.glow}` }}
        >
          <GraduationCap size={13} />
          Flashcards de rama
        </button>
        </div>
      </div>
        </>
      )}
    </>
  );

  if (collapsed && !embedded) {
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

  if (embedded) {
    return (
      <div
        data-study-panel
        className={`flex h-full min-h-0 flex-col overflow-hidden ${
          drawer
            ? ""
            : "rounded-2xl border border-[rgba(0,255,213,0.2)] bg-[rgba(16,39,48,0.88)] shadow-[0_0_48px_rgba(0,255,213,0.1)] backdrop-blur-2xl"
        }`}
      >
        {content}
      </div>
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
      {content}
    </motion.aside>
  );
}

export function getBranchForNode(node: StudyMapNode) {
  return branchForId(node.branchId);
}

/** @deprecated use StudyAssistantPanel */
export const ConceptMapNodePanel = StudyAssistantPanel;
