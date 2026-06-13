"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Briefcase,
  Check,
  ChevronDown,
  Filter,
  Gavel,
  GraduationCap,
  Lightbulb,
  Lock,
  RefreshCw,
  Scale,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ProfessorLessonView } from "@/components/guided-study/professor-lesson-view";
import { WhileLoadingPracticePanel } from "@/components/guided-study/while-loading-practice-panel";
import { ExamModePanel } from "@/components/guided-study/exam-mode-panel";
import { CompactConceptChips } from "@/components/guided-study/compact-concept-chips";
import { LoadingState } from "@/components/ui/loading-state";
import type {
  GuidedStudyTutorAction,
  PageProfessorAnalysis,
  TutorChatMessage,
} from "@/types/guided-legal-study";
import { LibrarySetupChecklist } from "@/components/guided-study/library-setup-checklist";
import { formatSourceSyncLabel } from "@/lib/legal-sources/source-meta";
import {
  gateJurisprudenceAction,
  gateNormativeAction,
} from "@/lib/legal-sources/tutor-action-gates";
import type { LibrarySetupStep } from "@/lib/legal-sources/library-setup";
import { LEGAL_SOURCE_CATEGORY_LABELS } from "@/types/legal-sources";
import type {
  LegalSourceAttribution,
  LegalSourceRecord,
  LegalSourcesSettings,
} from "@/types/legal-sources";
import "./guided-study.css";

const PEDAGOGY_ACTIONS: Array<{
  id: GuidedStudyTutorAction;
  label: string;
  icon: typeof Lightbulb;
  accent: string;
}> = [
  { id: "simpler", label: "Más fácil", icon: Lightbulb, accent: "#00BFFF" },
  { id: "first_cycle", label: "Primer ciclo", icon: GraduationCap, accent: "#00FFD5" },
  { id: "another_example", label: "Otro ejemplo", icon: RefreshCw, accent: "#5EEAD4" },
];

const MORE_ACTIONS: Array<{
  id: GuidedStudyTutorAction;
  label: string;
  icon: typeof Lightbulb;
  accent: string;
}> = [{ id: "real_case", label: "Caso real", icon: Briefcase, accent: "#FF8A00" }];

function ActionTile({
  label,
  icon: Icon,
  accent,
  disabled,
  locked,
  title,
  onClick,
  className,
}: {
  label: string;
  icon: typeof Lightbulb;
  accent: string;
  disabled?: boolean;
  locked?: boolean;
  title?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`gs-action-tile ${locked ? "gs-action-tile--locked" : ""} ${className ?? ""}`}
      style={{ "--gs-accent": accent } as React.CSSProperties}
    >
      {locked ? <Lock size={12} style={{ color: accent }} /> : <Icon size={14} style={{ color: accent }} />}
      <span>{label}</span>
    </button>
  );
}

function SourcePicker({
  manageableSources,
  activeSources,
  disabled,
  onToggle,
  onEnableAll,
}: {
  manageableSources: LegalSourceRecord[];
  activeSources?: LegalSourceAttribution[];
  disabled?: boolean;
  onToggle: (sourceId: string) => void;
  onEnableAll: () => void;
}) {
  if (!manageableSources.length) return null;

  const allEnabled = manageableSources.every((s) => s.enabled);

  return (
    <div className="gs-sources-banner">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-300">
          Fuentes para el tutor
        </p>
        <button
          type="button"
          disabled={disabled || allEnabled}
          onClick={onEnableAll}
          className="text-[9px] font-semibold text-accent hover:underline disabled:opacity-40"
        >
          Activar todas
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {manageableSources.map((s) => {
          const usedNow = activeSources?.some((a) => a.sourceId === s.id);
          return (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(s.id)}
              title={`${LEGAL_SOURCE_CATEGORY_LABELS[s.category]} — ${s.enabled ? "Activa" : "Desactivada"}`}
              className={`gs-source-tag gs-source-tag--pickable flex flex-col items-start gap-0.5 ${s.enabled ? "gs-source-tag--selected" : ""} ${usedNow ? "gs-source-tag--active" : ""}`}
            >
              <span>
                {s.enabled ? "✓ " : ""}
                {s.title}
              </span>
              {formatSourceSyncLabel(s) ? (
                <span className="text-[8px] font-normal opacity-75">
                  {formatSourceSyncLabel(s)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[9px] text-muted-foreground">
        Activa o desactiva fuentes. El cambio se guarda al instante; pulsa Actualizar explicación para
        aplicarlo al profesor.
      </p>
    </div>
  );
}

function NoSourcesBanner() {
  return (
    <div className="gs-no-sources-banner">
      <AlertTriangle size={16} className="shrink-0 text-[#FBBF24]" />
      <div>
        <p className="text-xs font-semibold text-[#FBBF24]">Sin fuentes activas</p>
        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
          Activa al menos una fuente aquí o en tu biblioteca para que el profesor cite información
          verificable.
        </p>
        <Link
          href="/fuentes-juridicas"
          className="mt-1.5 inline-flex text-[10px] font-semibold text-accent hover:underline"
        >
          Ir a Fuentes Jurídicas →
        </Link>
      </div>
    </div>
  );
}

function SourcesStaleBanner({
  disabled,
  onRefresh,
}: {
  disabled?: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="gs-sources-stale-banner">
      <p className="text-[10px] text-foreground">
        Cambiaste las fuentes activas. La explicación actual puede no reflejarlo.
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={onRefresh}
        className="gs-refresh-explanation-btn"
      >
        <RefreshCw size={12} />
        Actualizar explicación
      </button>
    </div>
  );
}

export function LegalTutorPanel({
  loading,
  loadingPercent,
  loadingMessage,
  loadingStageLabel,
  analysis,
  chatMessages = [],
  customReply,
  examOnly,
  practiceExam,
  sourceSettings,
  activeSources,
  manageableSources,
  onToggleSource,
  onEnableAllSources,
  hasEnabledSources,
  sourcesStale,
  onRefreshExplanation,
  setupSteps,
  needsSetup,
  chapterMode,
  needsGeneration,
  onExamOnlyChange,
  activeHighlightId,
  onHighlightFocus,
  onAction,
  onCustomAsk,
  onMarkUnderstood,
  onGeneratePage,
  pageUnderstood,
  currentPage,
  practiceWhileLoading,
}: {
  loading: boolean;
  loadingPercent?: number;
  loadingMessage?: string;
  loadingStageLabel?: string;
  currentPage?: number;
  practiceWhileLoading?: { pageNumber: number; analysis: PageProfessorAnalysis } | null;
  analysis: PageProfessorAnalysis | null;
  chatMessages?: TutorChatMessage[];
  customReply?: string | null;
  examOnly: boolean;
  practiceExam?: boolean;
  sourceSettings?: LegalSourcesSettings | null;
  activeSources?: LegalSourceAttribution[];
  manageableSources?: LegalSourceRecord[];
  onToggleSource?: (sourceId: string) => void;
  onEnableAllSources?: () => void;
  hasEnabledSources?: boolean;
  sourcesStale?: boolean;
  onRefreshExplanation?: () => void;
  setupSteps?: LibrarySetupStep[];
  needsSetup?: boolean;
  chapterMode?: boolean;
  needsGeneration?: boolean;
  onExamOnlyChange: (value: boolean) => void;
  activeHighlightId?: string | null;
  onHighlightFocus?: (highlightId: string) => void;
  onAction: (action: GuidedStudyTutorAction) => void;
  onCustomAsk: (prompt: string) => void;
  onMarkUnderstood: () => void;
  onGeneratePage?: () => void;
  pageUnderstood: boolean;
}) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [showMoreActions, setShowMoreActions] = useState(false);

  const manageable = manageableSources ?? [];
  const normativeGate = gateNormativeAction(sourceSettings ?? null, manageable);
  const jurisGate = gateJurisprudenceAction(sourceSettings ?? null, manageable);

  const hasExamContent = Boolean(
    analysis?.examMode.oral.length ||
      analysis?.examMode.desarrollo.length ||
      analysis?.examMode.test.length,
  );

  return (
    <div className="gs-panel-shell flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden">
      <div className="gs-tutor-toolbar shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            Profesor IA
          </p>
          <button
            type="button"
            onClick={() => onExamOnlyChange(!examOnly)}
            className={`gs-exam-toggle shrink-0 text-[10px] ${examOnly ? "gs-exam-toggle--active" : ""}`}
          >
            <Filter size={10} className="mr-1 inline" />
            Solo esencial (80/20)
          </button>
        </div>

        <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pedagogía
        </p>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          {PEDAGOGY_ACTIONS.map((item) => (
            <ActionTile
              key={item.id}
              label={item.label}
              icon={item.icon}
              accent={item.accent}
              disabled={loading}
              onClick={() => onAction(item.id)}
            />
          ))}
        </div>

        <p className="mt-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Enriquecer con fuentes (opcional)
        </p>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <ActionTile
            label="Norma peruana"
            icon={Scale}
            accent="#86EFAC"
            disabled={loading || !normativeGate.allowed}
            locked={!normativeGate.allowed}
            title={normativeGate.reason}
            onClick={() => onAction("peru_law")}
          />
          <ActionTile
            label="Jurisprudencia"
            icon={Gavel}
            accent="#C084FC"
            disabled={loading || !jurisGate.allowed}
            locked={!jurisGate.allowed}
            title={jurisGate.reason}
            onClick={() => onAction("jurisprudence")}
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => onAction("exam_mode")}
          className="gs-action-tile gs-action-tile--exam mt-2 w-full justify-center"
        >
          <Brain size={14} />
          <span>Practicar examen</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMoreActions((v) => !v)}
          className="mt-1.5 flex w-full items-center justify-center gap-1 text-[9px] font-semibold text-muted-foreground hover:text-accent"
        >
          Más opciones
          <ChevronDown size={12} className={`transition ${showMoreActions ? "rotate-180" : ""}`} />
        </button>
        {showMoreActions ? (
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {MORE_ACTIONS.map((item) => (
              <ActionTile
                key={item.id}
                label={item.label}
                icon={item.icon}
                accent={item.accent}
                disabled={loading}
                onClick={() => onAction(item.id)}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Chat con el profesor
          </p>
          <div className="mt-1 flex gap-1.5">
            <input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customPrompt.trim()) {
                  onCustomAsk(customPrompt.trim());
                  setCustomPrompt("");
                }
              }}
              placeholder="Pregunta lo que quieras sobre esta página…"
              className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-muted px-2.5 text-xs text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="button"
              disabled={loading || !customPrompt.trim()}
              onClick={() => {
                onCustomAsk(customPrompt.trim());
                setCustomPrompt("");
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:opacity-40"
              aria-label="Enviar pregunta"
            >
              <Send size={14} />
            </button>
          </div>
        </div>

        <Link
          href="/fuentes-juridicas"
          className="mt-2 inline-flex text-[10px] text-muted-foreground hover:text-accent"
        >
          Configurar fuentes jurídicas →
        </Link>
      </div>

      <div className="gs-tutor-scroll px-3 py-3">
        {needsSetup && setupSteps?.length ? (
          <LibrarySetupChecklist steps={setupSteps} />
        ) : null}

        {hasEnabledSources === false ? <NoSourcesBanner /> : null}

        {chapterMode ? (
          <p className="gs-chapter-mode-badge">Explicación del capítulo completo</p>
        ) : null}

        {manageableSources?.length && onToggleSource && onEnableAllSources ? (
          <SourcePicker
            manageableSources={manageableSources}
            activeSources={activeSources}
            disabled={loading}
            onToggle={onToggleSource}
            onEnableAll={onEnableAllSources}
          />
        ) : activeSources?.length ? (
          <div className="gs-sources-banner">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-300">
              Explicación basada en
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {activeSources.map((s) => (
                <span key={s.sourceId} className="gs-source-tag">
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {sourcesStale && onRefreshExplanation && hasEnabledSources !== false ? (
          <SourcesStaleBanner disabled={loading} onRefresh={onRefreshExplanation} />
        ) : null}

        {chatMessages.length ? (
          <div className="gs-tutor-chat" aria-label="Historial de preguntas al profesor">
            {chatMessages.map((message) => (
              <div key={message.id} className="gs-tutor-chat__exchange">
                <div className="gs-tutor-chat__question">
                  <span>Tú</span>
                  <p>{message.question}</p>
                </div>
                <div className="gs-tutor-chat__answer">
                  <span>
                    Profesor IA
                    {message.fromCache ? " · guardado" : null}
                  </span>
                  <p>{message.answer}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="gs-loading-with-practice my-3 space-y-3">
            <LoadingState
              active
              preset="aiAnalyze"
              percent={loadingPercent}
              message={loadingMessage}
              stageLabel={loadingStageLabel}
            />
            {practiceWhileLoading ? (
              <WhileLoadingPracticePanel
                sourcePageNumber={practiceWhileLoading.pageNumber}
                targetPageNumber={currentPage ?? practiceWhileLoading.pageNumber + 1}
                analysis={practiceWhileLoading.analysis}
              />
            ) : (
              <p className="gs-wait-empty rounded-xl border border-border bg-muted/40 px-3 py-3 text-xs leading-5 text-muted-foreground">
                El profesor IA está preparando esta página. Lee el PDF mientras tanto; en las
                siguientes páginas podrás repasar aquí lo que ya explicó.
              </p>
            )}
          </div>
        ) : needsGeneration && !analysis && !customReply ? (
          <div className="gs-page-prompt">
            <Sparkles size={22} className="text-accent" />
            <p>
              Estás en una página nueva. Pulsa <strong className="text-foreground">Explicar página</strong>{" "}
              arriba para que el profesor analice este contenido.
            </p>
            {onGeneratePage ? (
              <button type="button" onClick={onGeneratePage} className="gs-page-nav-generate mt-1">
                <Sparkles size={15} />
                Explicar página
              </button>
            ) : null}
          </div>
        ) : analysis || customReply ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="gs-tutor-content space-y-3"
          >
            {customReply && !chatMessages.length ? (
              <div className="gs-custom-reply">
                <p className="text-sm leading-7 text-foreground">{customReply}</p>
              </div>
            ) : null}
            {analysis ? (
              <>
                {practiceExam ? (
                  hasExamContent ? (
                    <ExamModePanel examMode={analysis.examMode} prominent />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Generando preguntas de práctica para esta página…
                    </p>
                  )
                ) : (
                  <>
                    <CompactConceptChips
                      keyLearning={analysis.keyLearning}
                      highlights={analysis.highlights}
                      examOnly={examOnly}
                      activeHighlightId={activeHighlightId}
                      onSelect={onHighlightFocus}
                    />
                    <ProfessorLessonView
                      analysis={analysis}
                      examOnly={examOnly}
                      activeHighlightId={activeHighlightId}
                      onConceptClick={onHighlightFocus}
                      customReply={customReply}
                      hideKeyLearning
                    />
                    {hasExamContent ? <ExamModePanel examMode={analysis.examMode} /> : null}
                  </>
                )}
              </>
            ) : null}
          </motion.div>
        ) : !chatMessages.length ? (
          <div className="gs-page-prompt">
            <Sparkles size={22} className="text-accent" />
            <p>
              El profesor IA aún no tiene explicación para esta vista. Pulsa{" "}
              <strong className="text-foreground">Explicar página</strong> para generarla.
            </p>
            {onGeneratePage ? (
              <button type="button" onClick={onGeneratePage} className="gs-page-nav-generate mt-1">
                <Sparkles size={15} />
                Explicar página
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="gs-tutor-footer shrink-0 border-t border-border px-3 py-2">
        <button
          type="button"
          onClick={onMarkUnderstood}
          disabled={pageUnderstood || loading}
          className="gs-nav-control"
        >
          {pageUnderstood ? (
            <>
              <Check size={13} />
              Comprendido
            </>
          ) : (
            <>
              Entendí
              <ArrowRight size={13} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
