"use client";

import { useState } from "react";
import {
  Brain,
  ChevronDown,
  ClipboardList,
  Eye,
  EyeOff,
  Mic,
  XCircle,
} from "lucide-react";
import type {
  ExamModeContent,
  ExamStructuredQuestion,
  ExamTestQuestion,
} from "@/types/guided-legal-study";

function AccordionSection({
  title,
  icon: Icon,
  color,
  children,
  defaultOpen,
}: {
  title: string;
  icon: typeof Brain;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="gs-exam-section">
      <button
        type="button"
        className="gs-exam-section-head"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 text-xs font-semibold" style={{ color }}>
          <Icon size={14} />
          {title}
        </span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? <div className="px-3 pb-3">{children}</div> : null}
    </div>
  );
}

function StructuredQuestionCard({
  item,
  index,
  accent,
}: {
  item: ExamStructuredQuestion;
  index: number;
  accent: string;
}) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <article className="gs-oral-card" style={{ "--gs-oral-accent": accent } as React.CSSProperties}>
      <p className="gs-oral-card-num">Pregunta {index + 1}</p>
      <p className="gs-oral-card-question">{item.question}</p>
      {item.gradingPoints.length ? (
        <div className="gs-oral-card-rubric">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Debes mencionar
          </p>
          <ul className="mt-1 space-y-0.5">
            {item.gradingPoints.map((point, i) => (
              <li key={i} className="text-[11px] text-[#F5F7FA]/80">
                • {point}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {item.modelAnswer ? (
        <>
          <button
            type="button"
            onClick={() => setShowAnswer((v) => !v)}
            className="gs-reveal-answer-btn"
          >
            {showAnswer ? <EyeOff size={12} /> : <Eye size={12} />}
            {showAnswer ? "Ocultar respuesta modelo" : "Ver respuesta modelo"}
          </button>
          {showAnswer ? (
            <p className="gs-oral-card-answer">{item.modelAnswer}</p>
          ) : null}
        </>
      ) : null}
    </article>
  );
}

function TestQuestionCard({ item, index }: { item: ExamTestQuestion; index: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="gs-test-card">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#C084FC]/80">
        Pregunta {index + 1}
      </p>
      <p className="mt-1 text-sm font-medium text-[#F5F7FA]">{item.question}</p>
      <ul className="mt-2 space-y-1">
        {item.options.map((opt, j) => {
          const isPicked = picked === j;
          const isCorrect = j === item.answerIndex;
          let className = "gs-test-option";
          if (revealed && isCorrect) className += " gs-test-option--correct";
          else if (revealed && isPicked && !isCorrect) className += " gs-test-option--wrong";
          else if (isPicked) className += " gs-test-option--picked";

          return (
            <li key={j}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => setPicked(j)}
                className={className}
              >
                <span className="gs-test-option-letter">{String.fromCharCode(65 + j)}.</span>
                {opt}
              </button>
            </li>
          );
        })}
      </ul>
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="gs-reveal-answer-btn mt-2"
        >
          <Eye size={12} />
          Ver corrección
        </button>
      ) : (
        <div className="gs-test-explanation">
          <p className="text-[10px] font-semibold text-[#00FFD5]">
            Respuesta: {String.fromCharCode(65 + item.answerIndex)}.{" "}
            {item.options[item.answerIndex]}
          </p>
          {item.explanation ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.explanation}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ExamModePanel({
  examMode,
  prominent,
}: {
  examMode: ExamModeContent;
  prominent?: boolean;
}) {
  const hasContent =
    examMode.oral.length ||
    examMode.desarrollo.length ||
    examMode.test.length ||
    examMode.memorableConcepts.length ||
    examMode.commonErrors.length;

  if (!hasContent) return null;

  return (
    <div className={`gs-exam-panel ${prominent ? "gs-exam-panel--prominent" : ""}`}>
      <p className="gs-section-label">
        <Brain size={12} />
        Practicar examen — esta página
      </p>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Responde mentalmente antes de revelar la corrección.
      </p>

      <div className="mt-3 space-y-2">
        {examMode.oral.length ? (
          <AccordionSection
            title={`Preguntas orales (${examMode.oral.length})`}
            icon={Mic}
            color="#FF8A00"
            defaultOpen={prominent}
          >
            <div className="space-y-2">
              {examMode.oral.map((q, i) => (
                <StructuredQuestionCard key={i} item={q} index={i} accent="#FF8A00" />
              ))}
            </div>
          </AccordionSection>
        ) : null}

        {examMode.desarrollo.length ? (
          <AccordionSection
            title={`Preguntas de desarrollo (${examMode.desarrollo.length})`}
            icon={ClipboardList}
            color="#00FFD5"
            defaultOpen={prominent}
          >
            <div className="space-y-2">
              {examMode.desarrollo.map((q, i) => (
                <StructuredQuestionCard key={i} item={q} index={i} accent="#00FFD5" />
              ))}
            </div>
          </AccordionSection>
        ) : null}

        {examMode.test.length ? (
          <AccordionSection
            title={`Opción múltiple (${examMode.test.length})`}
            icon={Brain}
            color="#C084FC"
            defaultOpen={prominent}
          >
            <div className="space-y-3">
              {examMode.test.map((q, i) => (
                <TestQuestionCard key={i} item={q} index={i} />
              ))}
            </div>
          </AccordionSection>
        ) : null}

        {examMode.memorableConcepts.length ? (
          <AccordionSection title="Conceptos memorables" icon={Brain} color="#FFD600">
            <div className="flex flex-wrap gap-1.5">
              {examMode.memorableConcepts.map((c, i) => (
                <span key={i} className="gs-memorable-chip">
                  {c}
                </span>
              ))}
            </div>
          </AccordionSection>
        ) : null}

        {examMode.commonErrors.length ? (
          <AccordionSection title="Errores frecuentes" icon={XCircle} color="#FCA5A5">
            <ul className="space-y-2">
              {examMode.commonErrors.map((e, i) => (
                <li key={i} className="gs-error-item">
                  {e}
                </li>
              ))}
            </ul>
          </AccordionSection>
        ) : null}
      </div>
    </div>
  );
}
