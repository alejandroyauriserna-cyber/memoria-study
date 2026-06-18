"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react";
import type { NodeStudyDetail } from "@/lib/organizers/concept-map-study";

export type GuidedStudyStep = "concept" | "explanation" | "example" | "question" | "answer";

const STEPS: GuidedStudyStep[] = ["concept", "explanation", "example", "question", "answer"];

const STEP_META: Record<
  GuidedStudyStep,
  { label: string; icon: typeof BookOpen; color: string }
> = {
  concept: { label: "Concepto", icon: Target, color: "var(--org-accent)" },
  explanation: { label: "Explicación", icon: Lightbulb, color: "#00BFFF" },
  example: { label: "Ejemplo", icon: GraduationCap, color: "var(--org-accent)" },
  question: { label: "Pregunta", icon: HelpCircle, color: "#FF8A00" },
  answer: { label: "Respuesta", icon: CheckCircle2, color: "var(--org-accent)" },
};

export function GuidedStudyWalkthrough({
  conceptLabel,
  detail,
  onComplete,
  onClose,
}: {
  conceptLabel: string;
  detail: NodeStudyDetail;
  onComplete?: () => void;
  onClose?: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const step = STEPS[stepIndex]!;
  const meta = STEP_META[step];
  const Icon = meta.icon;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const content = useMemo(() => {
    switch (step) {
      case "concept":
        return {
          title: conceptLabel,
          body: detail.summary,
          hint: "Lee el concepto y conéctalo con lo que ya sabes del PDF.",
        };
      case "explanation":
        return {
          title: "Explicación sencilla",
          body: detail.simpleExplanation,
          hint: detail.examImportance,
        };
      case "example":
        return {
          title: "Ejemplo práctico",
          body: detail.legalExample,
          hint: "Imagina un caso real del documento donde aparezca este concepto.",
        };
      case "question":
        return {
          title: "Pregunta de examen",
          body: detail.examQuestion,
          hint: "Intenta responder mentalmente antes de avanzar.",
        };
      case "answer":
        return {
          title: "Respuesta y repaso",
          body: revealedAnswer
            ? `${detail.summary}\n\nError frecuente: ${detail.commonMistake}\n\nTruco: ${detail.memoryTip}`
            : "¿Recuerdas la respuesta? Tócala para revelarla.",
          hint: revealedAnswer ? "Marca como completado para continuar." : "",
        };
      default:
        return { title: "", body: "", hint: "" };
    }
  }, [step, conceptLabel, detail, revealedAnswer]);

  function goNext() {
    if (step === "answer" && !revealedAnswer) {
      setRevealedAnswer(true);
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((v) => v + 1);
      setRevealedAnswer(false);
      return;
    }
    onComplete?.();
  }

  function goPrev() {
    if (stepIndex > 0) {
      setStepIndex((v) => v - 1);
      setRevealedAnswer(false);
    }
  }

  return (
    <div className="org-guided-study flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="org-guided-study__kicker flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
          <Sparkles size={12} />
          Modo estudio guiado
        </p>
        {onClose ? (
          <button type="button" onClick={onClose} className="org-guided-study__exit text-xs">
            Salir
          </button>
        ) : null}
      </div>

      <div className="org-guided-study__progress-track h-1.5 overflow-hidden rounded-full">
        <motion.div
          className="org-guided-study__progress-bar h-full rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((item, index) => {
          const done = index < stepIndex;
          const active = index === stepIndex;
          return (
            <span
              key={item}
              className={`org-guided-study__chip rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider${
                active ? " is-active" : done ? " is-done" : ""
              }`}
            >
              {STEP_META[item].label}
            </span>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          className="org-guided-study__card rounded-2xl p-5"
        >
          <p
            className="org-guided-study__step-label mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: meta.color }}
          >
            <Icon size={12} />
            {content.title}
          </p>
          {step === "answer" && !revealedAnswer ? (
            <button
              type="button"
              onClick={() => setRevealedAnswer(true)}
              className="org-guided-study__reveal flex min-h-32 w-full flex-col items-center justify-center rounded-xl px-4 py-8 text-center transition"
            >
              <HelpCircle size={28} className="org-guided-study__reveal-icon mb-3" />
              <p className="text-sm text-muted-foreground">{content.body}</p>
            </button>
          ) : (
            <p className="org-guided-study__body whitespace-pre-line text-sm leading-7">{content.body}</p>
          )}
          {content.hint ? (
            <p className="org-guided-study__hint mt-4 flex items-start gap-1.5 text-xs leading-5">
              <AlertTriangle size={12} className="mt-0.5 shrink-0 text-[#FF8A00]" />
              {content.hint}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="org-guided-study__nav-btn flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          <ArrowLeft size={14} />
          Anterior
        </button>
        <span className="text-xs text-muted-foreground">
          {stepIndex + 1} / {STEPS.length}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="org-guided-study__nav-btn org-guided-study__nav-btn--primary flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold"
        >
          {stepIndex === STEPS.length - 1 && revealedAnswer ? "Completar" : "Siguiente"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

/** Compact CTA to launch guided mode */
export function GuidedStudyLaunchButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="org-guided-study__launch flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold transition"
    >
      <ChevronRight size={13} />
      Iniciar modo estudio
    </button>
  );
}
