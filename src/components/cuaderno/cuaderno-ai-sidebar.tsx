"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  FileText,
  Gavel,
  GitBranch,
  HelpCircle,
  Layers,
  Scale,
  Sparkles,
  X,
} from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useLoadingProgress } from "@/hooks/use-loading-progress";
import type { CuadernoAskAction, CuadernoDictionaryResponse } from "@/types/cuaderno";

type AiActionId =
  | CuadernoAskAction
  | "legislation"
  | "mind_map"
  | "jurisprudence";

const AI_ACTIONS: Array<{
  id: AiActionId;
  label: string;
  icon: typeof Sparkles;
  prompt: string;
}> = [
  { id: "explain", label: "Explicar", icon: HelpCircle, prompt: "Explica en lenguaje claro" },
  { id: "summarize", label: "Resumir", icon: FileText, prompt: "Resume los puntos esenciales" },
  { id: "exam_questions", label: "Preguntas", icon: Brain, prompt: "Genera preguntas de examen" },
  { id: "flashcards", label: "Flashcards", icon: Layers, prompt: "Genera tarjetas pregunta-respuesta" },
  { id: "mind_map", label: "Mapa mental", icon: GitBranch, prompt: "Estructura un mapa mental" },
  { id: "relate", label: "Relacionar", icon: Sparkles, prompt: "Relaciona conceptos del curso" },
  { id: "legislation", label: "Legislación", icon: Scale, prompt: "Legislación peruana aplicable" },
  { id: "jurisprudence", label: "Jurisprudencia", icon: Gavel, prompt: "Jurisprudencia relacionada" },
];

const EXAMPLES = ["Exhorto", "Antijuridicidad", "Negocio jurídico"];

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
            className="cn-ai-sidebar cn-ai-sidebar--open"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            style={{ "--cn-course-accent": courseAccent } as React.CSSProperties}
          >
            <div className="cn-ai-sidebar-head">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">
                  IA Jurídica
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Sin salir del cuaderno</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground hover:bg-white/5 hover:text-white"
                aria-label="Cerrar panel IA"
              >
                <X size={18} />
              </button>
            </div>

            <div className="cn-ai-sidebar-scroll">
              <section className="cn-ai-block">
                <h3 className="cn-ai-section-title">Acciones rápidas</h3>
                <div className="cn-ai-action-grid">
                  {AI_ACTIONS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={askLoading}
                        className="cn-ai-action-tile"
                        onClick={() => onAction(item.id, item.prompt)}
                      >
                        <Icon size={18} className="cn-ai-action-icon" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="cn-ai-block">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
                  <BookOpen size={15} style={{ color: courseAccent }} />
                  Diccionario
                </h3>
                <input
                  value={dictTerm}
                  onChange={(e) => onDictTermChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onLookup(dictTerm)}
                  placeholder="¿Qué significa?"
                  className="cn-ai-input mt-3"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {EXAMPLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onLookup(s)}
                      className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted-foreground hover:text-[#00FFD5]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={dictLoading}
                  onClick={() => onLookup(dictTerm)}
                  className="cn-ai-btn-secondary mt-3 w-full"
                >
                  {dictLoading ? "Consultando…" : "Consultar término"}
                </button>
                {dictEntry ? (
                  <div className="cn-ai-answer mt-4">
                    <p className="font-bold" style={{ color: courseAccent }}>
                      {dictEntry.term}
                    </p>
                    {dictEntry.sections.map((s) => (
                      <div key={s.id} className="mt-2">
                        <p className="text-[11px] font-semibold text-white/90">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.content}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <section className="cn-ai-block">
                <h3 className="text-sm font-bold text-[#F5F7FA]">Pregunta libre</h3>
                <textarea
                  value={customPrompt}
                  onChange={(e) => onCustomPromptChange(e.target.value)}
                  placeholder="Escribe tu pregunta sobre los apuntes…"
                  rows={3}
                  className="cn-ai-input mt-3 resize-none"
                />
                <button
                  type="button"
                  disabled={askLoading || !customPrompt.trim()}
                  onClick={onAskCustom}
                  className="cn-ai-btn-primary mt-2 w-full"
                >
                {askLoading ? "Pensando…" : "Preguntar"}
              </button>
              {askLoading ? (
                <LoadingState active preset="aiGenerate" variant="inline" className="mt-3" />
              ) : null}
              {askAnswer ? (
                  <div className="cn-ai-answer mt-4 whitespace-pre-wrap">{askAnswer}</div>
                ) : null}
              </section>

              <section className="cn-ai-block">
                <h3 className="text-sm font-bold text-[#F5F7FA]">Generar material</h3>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    disabled={!!genLoading}
                    onClick={onGenerateOrganizer}
                    className="cn-ai-chip"
                  >
                    {genLoading === "organizer"
                      ? `Generando… ${genProgress.percent}%`
                      : "Organizador / mapa"}
                  </button>
                  <button
                    type="button"
                    disabled={!!genLoading}
                    onClick={onGenerateDeck}
                    className="cn-ai-chip"
                  >
                    {genLoading === "deck"
                      ? `Generando… ${genProgress.percent}%`
                      : "Flashcards → mazo"}
                  </button>
                  <button
                    type="button"
                    disabled={!!genLoading}
                    onClick={onGenerateExam}
                    className="cn-ai-chip"
                  >
                    {genLoading === "exam"
                      ? `Generando… ${genProgress.percent}%`
                      : "Simulacro → Exámenes"}
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
              </section>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
