"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import { CuadernoAiAnswerCards } from "@/components/cuaderno/cuaderno-ai-answer-cards";
import type { CuadernoAskAction, CuadernoDictionaryResponse } from "@/types/cuaderno";

type AiActionId =
  | CuadernoAskAction
  | "legislation"
  | "mind_map"
  | "jurisprudence";

const PRIMARY_ACTIONS: Array<{ id: AiActionId; label: string; prompt: string }> = [
  { id: "explain", label: "Explicar", prompt: "Explica en lenguaje claro" },
  { id: "summarize", label: "Resumir", prompt: "Resume los puntos esenciales" },
  { id: "exam_questions", label: "Examen", prompt: "Genera preguntas de examen" },
  { id: "flashcards", label: "Flashcards", prompt: "Genera tarjetas pregunta-respuesta" },
];

const MORE_ACTIONS: Array<{ id: AiActionId; label: string; prompt: string }> = [
  { id: "relate", label: "Relacionar", prompt: "Relaciona conceptos del curso" },
  { id: "legislation", label: "Legislación", prompt: "Legislación peruana aplicable" },
  { id: "jurisprudence", label: "Jurisprudencia", prompt: "Jurisprudencia relacionada" },
  { id: "mind_map", label: "Mapa mental", prompt: "Estructura un mapa mental" },
];

export function CuadernoAiSidebar({
  open,
  onClose,
  dictTerm,
  onDictTermChange,
  dictLoading,
  dictEntry,
  onLookup,
  customPrompt,
  onCustomPromptChange,
  onAskCustom,
  onAction,
  askLoading,
  askAnswer,
  onGenerateOrganizer,
  onGenerateDeck,
  onGenerateExam,
  genLoading,
  courseAccent = "#00ffd5",
  detectedConcepts = [],
  onExplainPage,
}: {
  open: boolean;
  onClose: () => void;
  dictTerm: string;
  onDictTermChange: (v: string) => void;
  dictLoading: boolean;
  dictEntry: CuadernoDictionaryResponse | null;
  onLookup: (term: string) => void;
  customPrompt: string;
  onCustomPromptChange: (v: string) => void;
  onAskCustom: () => void;
  onAction: (action: AiActionId, prompt: string) => void;
  askLoading: boolean;
  askAnswer: string | null;
  onGenerateOrganizer: () => void;
  onGenerateDeck: () => void;
  onGenerateExam: () => void;
  genLoading: string | null;
  courseAccent?: string;
  detectedConcepts?: Array<{ term: string; cite?: string }>;
  onExplainPage?: () => void;
}) {
  const genActive = genLoading !== null;
  const genProgress = useLoadingProgress(genActive, "aiGenerate");

  return (
    <>
      <div
        className={`cn-ai-backdrop ${open ? "cn-ai-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <AnimatePresence>
        {open ? (
          <motion.aside
            className="cn-ai-sidebar cn-ai-sidebar--open cn-ai-sidebar--professor cn-ai-sidebar--luxury"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            style={{ "--cn-course-accent": courseAccent } as React.CSSProperties}
          >
            <div className="cn-ai-sidebar-head">
              <div>
                <p className="cn-ai-professor-badge">Profesor IA</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="cn-ai-close-btn"
                aria-label="Cerrar panel IA"
              >
                <X size={16} />
              </button>
            </div>

            <div className="cn-ai-sidebar-scroll">
              {detectedConcepts.length > 0 ? (
                <section className="cn-ai-tutor-block">
                  <p className="cn-ai-tutor-lead">Esta página trata sobre</p>
                  <ul className="cn-ai-tutor-topics">
                    {detectedConcepts.map((concept) => (
                      <li key={concept.term}>
                        <button
                          type="button"
                          onClick={() => onLookup(concept.term)}
                          className="cn-ai-tutor-topic"
                        >
                          {concept.term}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="cn-ai-tutor-link"
                    disabled={askLoading}
                    onClick={onExplainPage}
                  >
                    Explicar estos temas
                  </button>
                </section>
              ) : null}

              <section className="cn-ai-block">
                <textarea
                  value={customPrompt}
                  onChange={(e) => onCustomPromptChange(e.target.value)}
                  placeholder="Pregunta sobre tus apuntes…"
                  rows={4}
                  className="cn-ai-input cn-ai-input--hero resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onAskCustom();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={askLoading || !customPrompt.trim()}
                  onClick={onAskCustom}
                  className="cn-ai-btn-primary cn-ai-btn-primary--luxury"
                >
                  {askLoading ? "Pensando…" : "Enviar"}
                </button>
                {askLoading ? (
                  <LoadingState active preset="aiGenerate" variant="inline" className="mt-3" />
                ) : null}
                {askAnswer ? (
                  <div className="mt-5">
                    <CuadernoAiAnswerCards answer={askAnswer} accent={courseAccent} />
                  </div>
                ) : null}
              </section>

              <section className="cn-ai-block cn-ai-block--compact">
                <div className="cn-ai-action-row">
                  {PRIMARY_ACTIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={askLoading}
                      className="cn-ai-action-pill"
                      onClick={() => onAction(item.id, item.prompt)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <details className="cn-ai-more-actions">
                  <summary>Más acciones</summary>
                  <div className="cn-ai-action-row mt-2">
                    {MORE_ACTIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={askLoading}
                        className="cn-ai-action-pill cn-ai-action-pill--muted"
                        onClick={() => onAction(item.id, item.prompt)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </details>
              </section>

              <section className="cn-ai-block cn-ai-block--compact">
                <input
                  value={dictTerm}
                  onChange={(e) => onDictTermChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onLookup(dictTerm)}
                  placeholder="Buscar término jurídico…"
                  className="cn-ai-input"
                />
                {dictLoading ? <p className="cn-ai-muted mt-2">Consultando…</p> : null}
                {dictEntry ? (
                  <div className="cn-ai-answer cn-ai-answer--luxury mt-4">
                    <p className="cn-ai-answer-term">{dictEntry.term}</p>
                    {dictEntry.sections.map((s) => (
                      <div key={s.id} className="mt-3">
                        <p className="cn-ai-answer-label">{s.title}</p>
                        <p className="cn-ai-answer-body">{s.content}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <details className="cn-ai-block cn-ai-block--compact cn-ai-generate-details">
                <summary>Generar material</summary>
                <div className="cn-ai-generate-links">
                  <button type="button" disabled={!!genLoading} onClick={onGenerateOrganizer}>
                    {genLoading === "organizer"
                      ? `Organizador… ${genProgress.percent}%`
                      : "Organizador"}
                  </button>
                  <button type="button" disabled={!!genLoading} onClick={onGenerateDeck}>
                    {genLoading === "deck" ? `Mazo… ${genProgress.percent}%` : "Mazo flashcards"}
                  </button>
                  <button type="button" disabled={!!genLoading} onClick={onGenerateExam}>
                    {genLoading === "exam" ? `Examen… ${genProgress.percent}%` : "Simulacro"}
                  </button>
                </div>
                {genActive ? (
                  <LoadingState
                    active
                    preset="aiGenerate"
                    percent={genProgress.percent}
                    message={genProgress.message}
                    stageLabel={genProgress.stageLabel}
                    variant="inline"
                    className="mt-3"
                  />
                ) : null}
              </details>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
