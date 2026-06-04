"use client";

import { useState } from "react";
import { Brain, ChevronDown, ClipboardList, Mic, XCircle } from "lucide-react";
import type { ExamModeContent } from "@/types/guided-legal-study";

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

export function ExamModePanel({ examMode }: { examMode: ExamModeContent }) {
  const hasContent =
    examMode.oral.length ||
    examMode.desarrollo.length ||
    examMode.test.length ||
    examMode.memorableConcepts.length ||
    examMode.commonErrors.length;

  if (!hasContent) return null;

  return (
    <div className="gs-exam-panel">
      <p className="gs-section-label">
        <Brain size={12} />
        Modo examen — esta página
      </p>

      <div className="mt-3 space-y-2">
        {examMode.oral.length ? (
          <AccordionSection title="Preguntas orales probables" icon={Mic} color="#FF8A00" defaultOpen>
            <ul className="space-y-2">
              {examMode.oral.map((q, i) => (
                <li key={i} className="gs-exam-item">
                  {q}
                </li>
              ))}
            </ul>
          </AccordionSection>
        ) : null}

        {examMode.desarrollo.length ? (
          <AccordionSection title="Preguntas de desarrollo" icon={ClipboardList} color="#00FFD5">
            <ul className="space-y-2">
              {examMode.desarrollo.map((q, i) => (
                <li key={i} className="gs-exam-item">
                  {q}
                </li>
              ))}
            </ul>
          </AccordionSection>
        ) : null}

        {examMode.test.length ? (
          <AccordionSection title="Opción múltiple" icon={Brain} color="#C084FC">
            <div className="space-y-3">
              {examMode.test.map((q, i) => (
                <div key={i} className="gs-test-card">
                  <p className="text-sm font-medium text-[#F5F7FA]">{q.question}</p>
                  <ul className="mt-2 space-y-0.5">
                    {q.options.map((opt, j) => (
                      <li
                        key={j}
                        className={`text-xs ${j === q.answerIndex ? "text-[#00FFD5] font-semibold" : "text-muted-foreground"}`}
                      >
                        {String.fromCharCode(65 + j)}. {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AccordionSection>
        ) : null}

        {examMode.memorableConcepts.length ? (
          <AccordionSection title="Conceptos memorables" icon={Brain} color="#FFD600" defaultOpen>
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
