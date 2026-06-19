"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
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
import { OrganizerSpeakButton } from "@/components/organizers/sections/organizer-speak-button";
import { buildNodeSpeakScript } from "@/lib/organizers/build-speak-script";
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
      <div className="text-sm leading-6 org-panel-text-soft">{children}</div>
    </section>
  );
}

function PanelScrollBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const syncScrollState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    setCanScrollUp(el.scrollTop > 6);
    setCanScrollDown(maxScroll > 6 && el.scrollTop < maxScroll - 6);
  }, []);

  useEffect(() => {
    syncScrollState();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(syncScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [syncScrollState, children]);

  function nudge(direction: "up" | "down") {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ top: direction === "down" ? 160 : -160, behavior: "smooth" });
  }

  return (
    <div className={`org-panel-scroll-wrap relative min-h-0 flex-1 ${className}`}>
      {canScrollUp ? (
        <button
          type="button"
          className="org-panel-scroll-nudge org-panel-scroll-nudge--up"
          aria-label="Subir en el panel"
          onClick={() => nudge("up")}
        >
          <ChevronUp size={16} strokeWidth={2.2} />
        </button>
      ) : null}
      <div
        ref={ref}
        className="org-panel-scroll-body org-panel-scroll-host min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-3"
        onScroll={syncScrollState}
        onTouchMove={(event) => event.stopPropagation()}
      >
        {children}
      </div>
      {canScrollDown ? (
        <button
          type="button"
          className="org-panel-scroll-nudge org-panel-scroll-nudge--down"
          aria-label="Bajar en el panel"
          onClick={() => nudge("down")}
        >
          <ChevronDown size={16} strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
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
  sheet = false,
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
  sheet?: boolean;
}) {
  const BranchIcon = branch.icon;
  const [collapsed, setCollapsed] = useState(false);
  const [guidedMode, setGuidedMode] = useState(false);
  const speakScript = buildNodeSpeakScript(detail);

  const content = (
    <>
      {sheet ? (
        <div className="org-panel-sheet-handle-wrap shrink-0 px-4 pt-2.5">
          <div className="org-panel-sheet-handle" aria-hidden />
          <p className="org-panel-sheet-hint">Desliza para ver todo el contenido</p>
        </div>
      ) : null}

      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--org-accent-border)] px-4 py-3">
        <div className="min-w-0">
          <p className="org-panel-kicker flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
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
          <h4 className="org-panel-title text-base font-bold leading-snug">{node.label}</h4>
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

      <div className="shrink-0 border-b border-[var(--org-accent-border)] px-4 py-2">
        <OrganizerSpeakButton script={speakScript} label="Escuchar explicación" compact />
      </div>

      {guidedMode ? (
        <PanelScrollBody>
          <GuidedStudyWalkthrough
            conceptLabel={node.label}
            detail={detail}
            onComplete={() => setGuidedMode(false)}
            onClose={() => setGuidedMode(false)}
          />
        </PanelScrollBody>
      ) : (
        <>
      <PanelScrollBody>
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
              <div className="org-panel-block p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conceptos previos</p>
                <ul className="org-panel-text-muted mt-2 space-y-1 text-xs">
                  {detail.previousConcepts.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {detail.derivedConcepts.length ? (
              <div className="org-panel-block p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Conceptos derivados</p>
                <ul className="org-panel-text-muted mt-2 space-y-1 text-xs">
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
                  className="org-panel-chip rounded-lg px-2.5 py-1 text-xs"
                >
                  {rel}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </PanelScrollBody>

      <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--org-accent-border)] p-3">
        <GuidedStudyLaunchButton onClick={() => setGuidedMode(true)} />
        <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onFocusBranch}
          className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition ${
            focusMode
              ? "bg-[#00FFD5] text-[#07131A] shadow-[0_0_16px_rgba(0,255,213,0.35)]"
              : "org-panel-control h-9 w-auto flex-1 border px-2"
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
        className={`organizer-studio-panel flex h-full min-h-0 flex-col overflow-hidden ${
          drawer
            ? sheet
              ? "org-panel-drawer--sheet-inner"
              : ""
            : "org-panel-drawer rounded-2xl"
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
