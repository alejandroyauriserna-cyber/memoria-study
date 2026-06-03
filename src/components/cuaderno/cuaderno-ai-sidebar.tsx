"use client";

import { BookOpen, Loader2, Sparkles, X } from "lucide-react";
import type { CuadernoDictionaryResponse } from "@/types/cuaderno";

const QUICK_PROMPTS = [
  "¿Qué significa antijuridicidad?",
  "Explícame este párrafo",
  "Resume la sentencia",
  "Genera preguntas de examen",
  "Relaciona con otros temas del curso",
  "¿Qué artículos aplican?",
];

const EXAMPLES = ["Exhorto", "Acto jurídico", "Negocio jurídico", "Compensación"];

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
  onQuickPrompt,
  askLoading,
  askAnswer,
  onGenerateOrganizer,
  onGenerateDeck,
  onGenerateExam,
  genLoading,
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
  onQuickPrompt: (prompt: string) => void;
  askLoading: boolean;
  askAnswer: string | null;
  onGenerateOrganizer: () => void;
  onGenerateDeck: () => void;
  onGenerateExam: () => void;
  genLoading: string | null;
}) {
  return (
    <>
      <div
        className={`cn-ai-backdrop ${open ? "cn-ai-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside className={`cn-ai-sidebar ${open ? "cn-ai-sidebar--open" : ""}`} aria-hidden={!open}>
        <div className="cn-ai-sidebar-head">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00FFD5]">
              💡 IA Jurídica
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
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#F5F7FA]">
              <BookOpen size={15} className="text-[#00FFD5]" />
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
                <p className="font-bold text-[#00FFD5]">{dictEntry.term}</p>
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
            <h3 className="text-sm font-bold text-[#F5F7FA]">Preguntar</h3>
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
              {askLoading ? "Pensando…" : "Preguntar a la IA"}
            </button>
            <div className="mt-3 flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={askLoading}
                  onClick={() => onQuickPrompt(prompt)}
                  className="cn-ai-chip text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
            {askLoading ? (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Generando respuesta…
              </p>
            ) : null}
            {askAnswer ? (
              <div className="cn-ai-answer mt-4 whitespace-pre-wrap">{askAnswer}</div>
            ) : null}
          </section>

          <section className="cn-ai-block">
            <h3 className="text-sm font-bold text-[#F5F7FA]">Generar</h3>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                disabled={!!genLoading}
                onClick={onGenerateOrganizer}
                className="cn-ai-chip"
              >
                <Sparkles size={14} className="inline mr-1" />
                {genLoading === "organizer" ? "Generando…" : "Mapa / organizador"}
              </button>
              <button
                type="button"
                disabled={!!genLoading}
                onClick={onGenerateDeck}
                className="cn-ai-chip"
              >
                Flashcards
              </button>
              <button
                type="button"
                disabled={!!genLoading}
                onClick={onGenerateExam}
                className="cn-ai-chip"
              >
                {genLoading === "exam" ? "Generando…" : "Simulacro → Exámenes"}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
