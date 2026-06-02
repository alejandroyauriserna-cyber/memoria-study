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
  concept: { label: "Concepto", icon: Target, color: "#00FFD5" },
  explanation: { label: "Explicación", icon: Lightbulb, color: "#00BFFF" },
  example: { label: "Ejemplo", icon: GraduationCap, color: "#00FFD5" },
  question: { label: "Pregunta", icon: HelpCircle, color: "#FF8A00" },
  answer: { label: "Respuesta", icon: CheckCircle2, color: "#00FFD5" },
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
          <Sparkles size={12} />
          Modo estudio guiado
        </p>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-[#00FFD5]"
          >
            Salir
          </button>
        ) : null}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#00FFD5] to-[#00BFFF]"
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
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                active
                  ? "bg-[rgba(0,255,213,0.18)] text-[#00FFD5]"
                  : done
                    ? "bg-[rgba(0,255,213,0.08)] text-[#00FFD5]/70"
                    : "text-muted-foreground"
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
          className="rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[rgba(7,19,26,0.55)] p-5"
        >
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
            <Icon size={12} />
            {content.title}
          </p>
          {step === "answer" && !revealedAnswer ? (
            <button
              type="button"
              onClick={() => setRevealedAnswer(true)}
              className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(0,255,213,0.25)] px-4 py-8 text-center transition hover:border-[rgba(0,255,213,0.45)] hover:bg-[rgba(0,255,213,0.05)]"
            >
              <HelpCircle size={28} className="mb-3 text-[#00FFD5]" />
              <p className="text-sm text-muted-foreground">{content.body}</p>
            </button>
          ) : (
            <p className="whitespace-pre-line text-sm leading-7 text-[#F5F7FA]/90">{content.body}</p>
          )}
          {content.hint ? (
            <p className="mt-4 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
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
          className="flex items-center gap-1 rounded-xl border border-[rgba(0,255,213,0.15)] px-3 py-2 text-xs font-semibold text-[#F5F7FA] transition hover:text-[#00FFD5] disabled:opacity-40"
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
          className="flex items-center gap-1 rounded-xl bg-[rgba(0,255,213,0.15)] px-3 py-2 text-xs font-semibold text-[#00FFD5] transition hover:bg-[rgba(0,255,213,0.22)]"
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
      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[rgba(0,255,213,0.25)] bg-[rgba(0,255,213,0.08)] text-[11px] font-semibold text-[#00FFD5] transition hover:bg-[rgba(0,255,213,0.14)]"
    >
      <ChevronRight size={13} />
      Iniciar modo estudio
    </button>
  );
}
