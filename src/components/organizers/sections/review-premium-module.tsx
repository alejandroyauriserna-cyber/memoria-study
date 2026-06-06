"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  ChevronDown,
  ClipboardCheck,
  Flame,
  HelpCircle,
  Target,
  Timer,
  Trophy,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { OrganizerFloatPanel } from "@/components/organizers/sections/organizer-section-shell";
import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";
import {
  buildReviewRecommendations,
  buildTopicMasteryList,
  loadReviewAnalytics,
  recordExamSession,
  recordReviewAnswer,
  weakTopics,
  type ReviewAnalyticsState,
} from "@/lib/study/review-analytics";

type ReviewBundle = NonNullable<StoredOrganizerContent["reviewBundle"]>;

const difficultyLabel = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
} as const;

export function ReviewPremiumModule({
  reviewBundle,
  deckKey = "default",
  onAnswerRecorded,
}: {
  reviewBundle: ReviewBundle;
  deckKey?: string;
  onAnswerRecorded?: (correct: boolean) => void;
}) {
  const [tab, setTab] = useState<"metricas" | "conceptos" | "preguntas" | "examen">("metricas");
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examSubmitted, setExamSubmitted] = useState<Record<number, boolean>>({});
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [examFinishedAt, setExamFinishedAt] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<ReviewAnalyticsState>(() => loadReviewAnalytics(deckKey));

  const questions = reviewBundle.questions ?? [];
  const keyConcepts = reviewBundle.keyConcepts ?? [];
  const examQuestions = reviewBundle.examQuestions ?? [];

  useEffect(() => {
    setAnalytics(loadReviewAnalytics(deckKey));
  }, [deckKey]);

  useEffect(() => {
    if (tab === "examen" && !examStartedAt) {
      setExamStartedAt(Date.now());
    }
  }, [tab, examStartedAt]);

  const groupedQuestions = useMemo(() => {
    const groups = { basico: [] as typeof questions, intermedio: [] as typeof questions, avanzado: [] as typeof questions };
    for (const item of questions) {
      const key = item.difficulty ?? "intermedio";
      groups[key].push(item);
    }
    return groups;
  }, [questions]);

  const examScore = useMemo(() => {
    let correct = 0;
    examQuestions.forEach((item, index) => {
      const submitted = examSubmitted[index];
      if (!submitted) return;
      const answer = examAnswers[index];
      if (item.type === "caso_practico") {
        if (answer && answer.length > 20) correct += 1;
      } else if (answer === item.answer) {
        correct += 1;
      }
    });
    return { correct, total: examQuestions.length };
  }, [examAnswers, examQuestions, examSubmitted]);

  const allSubmitted =
    examQuestions.length > 0 &&
    examQuestions.every((_, index) => examSubmitted[index]);

  const examMinutes = examStartedAt
    ? Math.max(1, Math.round(((examFinishedAt ?? Date.now()) - examStartedAt) / 60_000))
    : 0;

  const masteryList = useMemo(
    () => buildTopicMasteryList(keyConcepts, analytics.topicStats),
    [keyConcepts, analytics.topicStats],
  );

  const weak = useMemo(() => weakTopics(masteryList), [masteryList]);
  const recommendations = useMemo(
    () => buildReviewRecommendations(masteryList, analytics.streak),
    [masteryList, analytics.streak],
  );

  const conceptsMastered = masteryList.filter((t) => t.mastery >= 70).length;

  function submitExamAnswer(index: number, question: string, correct: boolean) {
    setExamSubmitted((c) => ({ ...c, [index]: true }));
    const next = recordReviewAnswer(deckKey, question, correct);
    setAnalytics(next);
    onAnswerRecorded?.(correct);
  }

  function finishExam() {
    setExamFinishedAt(Date.now());
    setShowResults(true);
    const next = recordExamSession(deckKey, examScore.correct, examScore.total);
    setAnalytics(next);
  }

  function resetExam() {
    setExamAnswers({});
    setExamSubmitted({});
    setExamStartedAt(Date.now());
    setExamFinishedAt(null);
    setShowResults(false);
  }

  if (!keyConcepts.length && !questions.length && !examQuestions.length) {
    return null;
  }

  return (
    <OrganizerFloatPanel
      title="Repaso inteligente"
      hint="Métricas · evaluación · retroalimentación"
      icon={<HelpCircle size={17} />}
      span={12}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "metricas" as const, label: "Métricas" },
          { id: "conceptos" as const, label: "Conceptos" },
          { id: "preguntas" as const, label: "Preguntas" },
          { id: "examen" as const, label: "Modo examen" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === item.id
                ? item.id === "examen"
                  ? "bg-[rgba(255,138,0,0.18)] text-amber-200"
                  : "bg-[rgba(0,255,213,0.15)] text-[#00FFD5]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "metricas" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Racha", value: `${analytics.streak} días`, icon: Flame },
              { label: "Tiempo estudio", value: `${analytics.studyMinutes} min`, icon: Timer },
              { label: "Conceptos dominados", value: String(conceptsMastered), icon: Target },
              { label: "Temas débiles", value: String(weak.length), icon: XCircle },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="org-panel-stat p-3"
              >
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Icon size={11} className="text-[#00FFD5]" />
                  {label}
                </p>
                <p className="org-panel-title mt-1 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="org-panel-kicker mb-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
              Dominio por tema
            </p>
            <div className="space-y-3">
              {(masteryList.length ? masteryList : keyConcepts.map((topic) => ({ topic, mastery: 0, correct: 0, total: 0 }))).map(
                (item) => (
                  <div key={item.topic}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="org-panel-text-muted truncate">{item.topic}</span>
                      <span className="shrink-0 text-xs font-semibold text-[#00FFD5]">{item.mastery}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(0,255,213,0.08)]">
                      <motion.div
                        className={`h-full rounded-full ${
                          item.mastery >= 70
                            ? "bg-gradient-to-r from-[#00FFD5] to-[#00BFFF]"
                            : item.mastery >= 40
                              ? "bg-amber-400"
                              : "bg-red-400/80"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(item.mastery, item.total ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="org-panel-recommend p-4">
            <p className="org-panel-kicker text-[10px] font-semibold uppercase tracking-wider">
              Recomendaciones automáticas
            </p>
            <ul className="mt-2 space-y-1.5">
              {recommendations.map((rec) => (
                <li key={rec} className="org-panel-text-muted text-xs leading-5">
                  · {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "conceptos" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {keyConcepts.map((concept, index) => (
            <motion.button
              key={`${concept}-${index}`}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setSelectedConcept(selectedConcept === index ? null : index)}
              className={`org-panel-stat rounded-xl border p-3 text-left transition ${
                selectedConcept === index
                  ? "org-panel-card--active"
                  : "hover:border-[var(--org-accent-border-strong)]"
              }`}
            >
              <p className="org-panel-kicker flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                <Brain size={12} />
                Concepto {index + 1}
              </p>
              <p className="org-panel-text mt-2 text-sm leading-6">{concept}</p>
            </motion.button>
          ))}
        </div>
      ) : null}

      {tab === "preguntas" ? (
        <div className="space-y-4">
          {(["basico", "intermedio", "avanzado"] as const).map((level) => {
            const items = groupedQuestions[level];
            if (!items.length) return null;
            return (
              <div key={level}>
                <p className="org-panel-kicker mb-2 text-xs font-semibold uppercase tracking-[0.12em]">
                  {difficultyLabel[level]}
                </p>
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const globalIndex = `${level}-${index}`;
                    const isOpen = openIndex === globalIndex;
                    return (
                      <div
                        key={globalIndex}
                        className="org-panel-accordion"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="flex w-full items-start gap-2 px-3 py-3 text-left"
                        >
                          <span className="org-panel-chip flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </span>
                          <span className="org-panel-text flex-1 text-sm leading-6">{item.question}</span>
                          <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
                            <ChevronDown size={16} className="text-muted-foreground" />
                          </motion.span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="org-panel-accordion__divider overflow-hidden px-3 py-3"
                            >
                              <p className="org-panel-kicker text-xs font-semibold">Respuesta</p>
                              <p className="org-panel-text-muted mt-1 text-xs leading-6">{item.answer}</p>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "examen" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[rgba(255,138,0,0.2)] bg-[rgba(255,138,0,0.08)] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
              Modo examen · Evaluar conocimiento
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Responde cada pregunta y confirma antes de ver la retroalimentación. Sin respuestas anticipadas.
            </p>
          </div>

          {showResults ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="org-panel-detail p-6 text-center"
            >
              <Trophy size={32} className="org-panel-kicker mx-auto" />
              <p className="org-panel-title mt-3 text-2xl font-bold">
                {examScore.total ? Math.round((examScore.correct / examScore.total) * 100) : 0}%
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {examScore.correct} de {examScore.total} correctas · {examMinutes} min
              </p>
              {weak.length ? (
                <div className="mt-4 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Temas débiles
                  </p>
                  <ul className="mt-2 space-y-1">
                    {weak.map((t) => (
                      <li key={t.topic} className="text-xs text-muted-foreground">
                        · {t.topic} ({t.mastery}%)
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <ul className="mt-4 space-y-1 text-left">
                {recommendations.map((r) => (
                  <li key={r} className="text-xs text-[#F5F7FA]/85">
                    → {r}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={resetExam}
                className="mt-5 rounded-xl bg-[rgba(0,255,213,0.15)] px-5 py-2 text-sm font-semibold text-[#00FFD5]"
              >
                Reintentar examen
              </button>
            </motion.div>
          ) : (
            <>
              {examQuestions.map((item, index) => {
                const submitted = examSubmitted[index];
                const selected = examAnswers[index];
                const isCorrect =
                  item.type === "caso_practico"
                    ? Boolean(selected && selected.length > 20)
                    : selected === item.answer;

                return (
                  <div
                    key={`exam-${index}`}
                    className="org-panel-surface-soft p-4"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                      Pregunta {index + 1} · {item.type.replace("_", " ")}
                    </p>
                    <p className="org-panel-text mt-2 text-sm font-medium">{item.question}</p>

                    {item.type === "caso_practico" ? (
                      <textarea
                        className="org-panel-block mt-3 w-full rounded-lg px-3 py-2 text-xs disabled:opacity-60"
                        rows={3}
                        placeholder="Escribe tu solución..."
                        value={selected ?? ""}
                        disabled={submitted}
                        onChange={(e) =>
                          setExamAnswers((c) => ({ ...c, [index]: e.target.value }))
                        }
                      />
                    ) : item.options?.length ? (
                      <div className="mt-3 space-y-2">
                        {item.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            disabled={submitted}
                            onClick={() => setExamAnswers((c) => ({ ...c, [index]: option }))}
                            className={`block w-full rounded-lg border px-3 py-2 text-left text-xs transition disabled:cursor-default ${
                              selected === option
                                ? "border-[rgba(255,138,0,0.35)] bg-[rgba(255,138,0,0.12)] text-amber-100"
                                : "border-[rgba(0,255,213,0.1)] text-muted-foreground hover:border-[rgba(0,255,213,0.25)]"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {!submitted ? (
                      <button
                        type="button"
                        disabled={!selected}
                        onClick={() =>
                          submitExamAnswer(
                            index,
                            item.question,
                            item.type === "caso_practico"
                              ? Boolean(selected && selected.length > 20)
                              : selected === item.answer,
                          )
                        }
                        className="mt-3 rounded-lg bg-[rgba(255,138,0,0.15)] px-4 py-2 text-xs font-semibold text-amber-200 disabled:opacity-40"
                      >
                        Confirmar respuesta
                      </button>
                    ) : (
                      <div
                        className={`mt-3 flex items-start gap-2 rounded-lg border p-3 ${
                          isCorrect
                            ? "border-[rgba(0,255,213,0.3)] bg-[rgba(0,255,213,0.08)]"
                            : "border-red-400/30 bg-red-500/10"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 size={16} className="shrink-0 text-[#00FFD5]" />
                        ) : (
                          <XCircle size={16} className="shrink-0 text-red-300" />
                        )}
                        <div className="text-xs leading-5">
                          <p className={isCorrect ? "text-[#00FFD5]" : "text-red-200"}>
                            {isCorrect ? "Correcto" : "Incorrecto"}
                          </p>
                          {!isCorrect && item.type !== "caso_practico" ? (
                            <p className="mt-1 text-muted-foreground">
                              Respuesta correcta: <span className="org-panel-title">{item.answer}</span>
                            </p>
                          ) : null}
                          {item.explanation ? (
                            <p className="mt-2 text-muted-foreground">{item.explanation}</p>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {allSubmitted ? (
                <button
                  type="button"
                  onClick={finishExam}
                  className="w-full rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#FF5C00] py-3 text-sm font-semibold text-[#07131A]"
                >
                  Ver resultados finales
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <ClipboardCheck size={12} className="text-[#00FFD5]" />
        Estudio en flashcards · Evaluación en modo examen — herramientas separadas.
      </p>
    </OrganizerFloatPanel>
  );
}
