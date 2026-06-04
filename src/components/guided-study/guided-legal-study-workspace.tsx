"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { PdfViewerPanel } from "@/components/guided-study/pdf-viewer-panel";
import { LegalTutorPanel } from "@/components/guided-study/legal-tutor-panel";
import {
  getStudyProgressPercent,
  loadGuidedStudySession,
  markPageUnderstood,
  updateCurrentPage,
} from "@/lib/guided-study/progress";
import type {
  DetectedLegalConcept,
  DocumentStudyIndex,
  ExamQuestionSet,
  GuidedStudyTutorAction,
  LegalCitation,
} from "@/types/guided-legal-study";

type MaterialInfo = {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  courseName: string;
  cycleLabel: string;
  totalPages: number;
};

type TutorState = {
  answer: string | null;
  citations?: LegalCitation[];
  concepts?: DetectedLegalConcept[];
  questions?: ExamQuestionSet;
  comprehensionCheck?: string;
};

export function GuidedLegalStudyWorkspace({ materialId }: { materialId: string }) {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [material, setMaterial] = useState<MaterialInfo | null>(null);
  const [index, setIndex] = useState<DocumentStudyIndex | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [understoodPages, setUnderstoodPages] = useState<number[]>([]);
  const [showIndex, setShowIndex] = useState(true);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorState, setTutorState] = useState<TutorState>({ answer: null });
  const [detectedConcepts, setDetectedConcepts] = useState<DetectedLegalConcept[]>([]);

  useEffect(() => {
    const session = loadGuidedStudySession(materialId);
    if (session) {
      setCurrentPage(session.currentPage);
      setUnderstoodPages(session.understoodPages);
    }
  }, [materialId]);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      setPhase("loading");
      setError("");

      try {
        const response = await fetch("/api/guided-study/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo analizar el documento.");
        }

        if (cancelled) return;

        setMaterial(payload.material);
        setIndex(payload.index);
        setPhase("ready");

        const session = loadGuidedStudySession(materialId);
        if (session?.currentPage) {
          setCurrentPage(Math.min(session.currentPage, payload.material.totalPages));
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Error desconocido.");
          setPhase("error");
        }
      }
    }

    void analyze();
    return () => {
      cancelled = true;
    };
  }, [materialId]);

  const askTutor = useCallback(
    async (action: GuidedStudyTutorAction, customPrompt?: string) => {
      if (!material) return;

      setTutorLoading(true);
      setTutorState({ answer: null });

      try {
        const response = await fetch("/api/guided-study/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materialId,
            pageNumber: currentPage,
            action,
            customPrompt,
            index,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Error del tutor.");
        }

        setTutorState({
          answer: payload.answer,
          citations: payload.citations,
          concepts: payload.concepts,
          questions: payload.questions,
          comprehensionCheck: payload.comprehensionCheck,
        });

        if (payload.concepts?.length) {
          setDetectedConcepts((prev) => {
            const merged = [...prev];
            for (const c of payload.concepts as DetectedLegalConcept[]) {
              if (!merged.some((m) => m.term === c.term)) merged.push(c);
            }
            return merged;
          });
        }
      } catch (caught) {
        setTutorState({
          answer: caught instanceof Error ? caught.message : "Error consultando al tutor.",
        });
      } finally {
        setTutorLoading(false);
      }
    },
    [material, materialId, currentPage, index],
  );

  useEffect(() => {
    if (phase !== "ready" || !material) return;
    void askTutor("explain_page");
  }, [currentPage, phase, material?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePageChange(page: number) {
    setCurrentPage(page);
    updateCurrentPage(materialId, page);
    setTutorState({ answer: null });
  }

  function handleMarkUnderstood() {
    const session = markPageUnderstood(materialId, currentPage);
    setUnderstoodPages(session.understoodPages);
    if (material && currentPage < material.totalPages) {
      handlePageChange(currentPage + 1);
    }
  }

  const progressPercent =
    material && understoodPages.length
      ? getStudyProgressPercent(
          { materialId, currentPage, understoodPages, lastUpdated: "" },
          material.totalPages,
        )
      : 0;

  const currentChapter = index?.chapters.find(
    (ch) => currentPage >= ch.startPage && currentPage <= ch.endPage,
  );

  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Loader2 size={32} className="animate-spin text-[#00FFD5]" />
        <div>
          <p className="text-lg font-semibold text-[#F5F7FA]">Analizando documento...</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Generando índice de temas, capítulos y preparando el tutor jurídico
          </p>
        </div>
      </div>
    );
  }

  if (phase === "error" || !material || !index) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-red-400" />
        <p className="mt-4 font-semibold text-[#F5F7FA]">No se pudo iniciar el estudio guiado</p>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <Link
          href={`/materials/${materialId}`}
          className="tron-btn-secondary mt-6 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold"
        >
          Volver al material
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-5rem)] min-h-[32rem] flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgba(0,255,213,0.12)] bg-[rgba(7,19,26,0.5)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00FFD5]">
            <Sparkles size={12} />
            Modo Estudio Guiado Jurídico
          </p>
          <h1 className="mt-0.5 truncate text-lg font-bold text-[#F5F7FA]">{material.title}</h1>
          <p className="text-xs text-muted-foreground">
            {material.courseName} · {material.cycleLabel}
            {currentChapter ? ` · ${currentChapter.title}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Progreso</p>
            <p className="text-sm font-bold text-[#00FFD5]">{progressPercent}%</p>
          </div>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-[rgba(0,255,213,0.1)]">
            <div
              className="h-full rounded-full bg-[#00FFD5] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowIndex((v) => !v)}
            className="tron-btn-secondary flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold"
          >
            <BookOpen size={14} />
            Índice
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="grid h-full gap-3 lg:grid-cols-2">
          <PdfViewerPanel
            fileUrl={material.fileUrl}
            pageNumber={currentPage}
            totalPages={material.totalPages}
            onPageChange={handlePageChange}
          />

          <LegalTutorPanel
            loading={tutorLoading}
            answer={tutorState.answer}
            citations={tutorState.citations}
            concepts={tutorState.concepts}
            questions={tutorState.questions}
            comprehensionCheck={tutorState.comprehensionCheck}
            onAction={(action) => void askTutor(action)}
            onCustomAsk={(prompt) => void askTutor("custom", prompt)}
            onMarkUnderstood={handleMarkUnderstood}
            pageUnderstood={understoodPages.includes(currentPage)}
          />
        </div>

        <AnimatePresence>
          {showIndex ? (
            <>
              <motion.div
                className="absolute inset-0 z-20 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowIndex(false)}
              />
              <motion.aside
                className="absolute left-0 top-0 z-30 flex h-full w-[min(100%,320px)] flex-col overflow-hidden rounded-2xl border border-[rgba(0,255,213,0.15)] bg-[#07131a] shadow-2xl"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
              >
                <div className="flex items-center justify-between border-b border-[rgba(0,255,213,0.1)] px-4 py-3">
                  <p className="text-sm font-bold text-[#F5F7FA]">Índice de estudio</p>
                  <button
                    type="button"
                    onClick={() => setShowIndex(false)}
                    className="rounded-lg p-1 text-muted-foreground hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <p className="text-xs leading-5 text-muted-foreground">{index.summary}</p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[#00FFD5]">
                    {material.totalPages} páginas · {index.chapters.length} capítulos
                  </p>

                  <div className="mt-4 space-y-2">
                    {index.chapters.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          handlePageChange(ch.startPage);
                          setShowIndex(false);
                        }}
                        className={`flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                          currentChapter?.id === ch.id
                            ? "border-[rgba(0,255,213,0.35)] bg-[rgba(0,255,213,0.08)]"
                            : "border-[rgba(0,255,213,0.08)] hover:border-[rgba(0,255,213,0.2)]"
                        }`}
                      >
                        <ChevronRight size={14} className="mt-0.5 shrink-0 text-[#00FFD5]" />
                        <div>
                          <p className="text-sm font-medium text-[#F5F7FA]">{ch.title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Págs. {ch.startPage}–{ch.endPage}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {detectedConcepts.length ? (
                    <div className="mt-6">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#00FFD5]">
                        Conceptos de esta sesión
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {detectedConcepts.map((c) => (
                          <span
                            key={c.id}
                            className="rounded-full border border-[rgba(0,255,213,0.15)] px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {c.term}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
