import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";
import type { FlowProcessNode } from "@/lib/organizers/flow-map-layout";
import {
  buildNodeStudyDetail,
  type NodeStudyDetail,
  type OrganizerStudyContext,
  type StudyMapNode,
} from "@/lib/organizers/concept-map-study";

export type EnrichedStudyContext = OrganizerStudyContext & {
  centerTitle?: string;
  reviewBundle?: NonNullable<StoredOrganizerContent["reviewBundle"]>;
  visualSummary?: StoredOrganizerContent["visualSummary"];
  aiAnalysis?: StoredOrganizerContent["aiAnalysis"];
};

export type FlowStepStudyDetail = {
  simpleExplanation: string;
  legalBasis: string;
  practicalExample: string;
  examQuestion: string;
  examAnswer: string;
  reasoningPrompt: string;
};

export type PathNodeStudyDetail = NodeStudyDetail & {
  difficulty: "basico" | "intermedio" | "avanzado";
  importance: "alta" | "media" | "baja";
};

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function includesTerm(text: string, term: string) {
  const hay = normalize(text);
  const needle = normalize(term);
  if (needle.length < 4) return hay.includes(needle);
  const words = needle.split(/\s+/).filter((w) => w.length > 3);
  return words.length ? words.some((w) => hay.includes(w)) : hay.includes(needle);
}

function extractSentence(text: string | undefined, term: string) {
  if (!text) return "";
  const parts = text.split(/(?<=[.!?])\s+/);
  const hit = parts.find((p) => includesTerm(p, term));
  return hit?.trim() ?? "";
}

function findReviewQuestion(context: EnrichedStudyContext, label: string) {
  const fromBundle = context.reviewBundle?.questions?.find(
    (q) => includesTerm(q.question, label) || includesTerm(q.answer, label),
  );
  if (fromBundle) return { question: fromBundle.question, answer: fromBundle.answer };

  const fromExam = context.reviewBundle?.examQuestions?.find(
    (q) => includesTerm(q.question, label) || includesTerm(q.answer, label),
  );
  if (fromExam) {
    return {
      question: fromExam.question,
      answer: fromExam.explanation ?? fromExam.answer,
    };
  }

  const legacy = context.reviewQuestions?.find((q) => includesTerm(q, label));
  if (legacy) {
    return {
      question: legacy,
      answer: "Repasa la definición en el organizador y verifica con el PDF original.",
    };
  }

  return null;
}

function findConceptCard(context: EnrichedStudyContext, label: string) {
  return context.visualSummary?.conceptCards?.find(
    (c) => includesTerm(c.title, label) || includesTerm(c.description, label),
  );
}

export function buildFlowStepDetail(
  step: FlowProcessNode,
  stepIndex: number,
  totalSteps: number,
  context: EnrichedStudyContext,
): FlowStepStudyDetail {
  const label = step.label;
  const matched = findReviewQuestion(context, label);
  const conceptCard = findConceptCard(context, label);
  const flashcard = context.flashcards?.find(
    (c) => includesTerm(c.question ?? "", label) || includesTerm(c.answer ?? "", label),
  );

  const simpleExplanation =
    step.explanation?.trim() ||
    extractSentence(context.simplifiedExplanation, label) ||
    flashcard?.question?.trim() ||
    conceptCard?.description?.trim() ||
    `En este paso del razonamiento jurídico interviene «${label}». Piensa qué hecho o acto lo activa y qué consecuencia produce en el proceso.`;

  const legalBasis =
    step.legalBasis?.trim() ||
    extractSentence(context.summary, label) ||
    flashcard?.answer?.trim()?.slice(0, 280) ||
    `Fundamento vinculado a «${label}» según el contenido del documento analizado.`;

  const practicalExample =
    step.example?.trim() ||
    matched?.answer?.trim() ||
    `Supuesto práctico: aplica «${label}» a un caso del PDF. ¿Qué parte del proceso se cumple o se incumple en este paso?`;

  const examQuestion =
    matched?.question ||
    `¿Cuál es el rol de «${label}» (paso ${stepIndex + 1}/${totalSteps}) dentro del proceso jurídico?`;

  const examAnswer =
    matched?.answer ||
    step.explanation?.trim() ||
    conceptCard?.description?.trim() ||
    `«${label}» conecta la etapa anterior con la siguiente dentro del razonamiento jurídico del tema.`;

  const reasoningPrompt =
    stepIndex === 0
      ? `¿Por qué el proceso comienza con «${label}» y no con otro acto?`
      : stepIndex === totalSteps - 1
        ? `¿Qué efecto jurídico final produce «${label}» al cerrar el proceso?`
        : `¿Qué condición debe cumplirse para pasar de la etapa anterior a «${label}»?`;

  return {
    simpleExplanation,
    legalBasis,
    practicalExample,
    examQuestion,
    examAnswer,
    reasoningPrompt,
  };
}

export function pathNodeDifficulty(index: number, total: number): "basico" | "intermedio" | "avanzado" {
  const ratio = total <= 1 ? 0 : index / (total - 1);
  if (ratio < 0.34) return "basico";
  if (ratio < 0.67) return "intermedio";
  return "avanzado";
}

export function pathNodeImportance(index: number, total: number): "alta" | "media" | "baja" {
  if (index === 0 || index === total - 1) return "alta";
  if (index % 2 === 0) return "media";
  return "baja";
}

export function buildPathNodeDetail(
  label: string,
  index: number,
  total: number,
  context: EnrichedStudyContext,
): PathNodeStudyDetail {
  const pseudoNode: StudyMapNode = {
    id: `path-${index}`,
    label,
    x: 0,
    y: 0,
    branchId: index % 6,
    branchIndex: 0,
    ring: index < total / 2 ? 1 : 2,
    globalIndex: index,
  };

  const base = buildNodeStudyDetail(
    pseudoNode,
    Array.from({ length: total }, (_, i) => ({
      ...pseudoNode,
      id: `path-${i}`,
      label: context.reviewBundle?.keyConcepts?.[i] ?? label,
      globalIndex: i,
      branchId: i % 6,
    })),
    context.centerTitle,
    context,
  );

  return {
    ...base,
    difficulty: pathNodeDifficulty(index, total),
    importance: pathNodeImportance(index, total),
  };
}

export function buildConceptDetailFromLabel(
  label: string,
  index: number,
  allLabels: string[],
  context: EnrichedStudyContext,
): NodeStudyDetail {
  const pseudoNode: StudyMapNode = {
    id: `concept-${index}`,
    label,
    x: 0,
    y: 0,
    branchId: index % 6,
    branchIndex: 0,
    ring: 1,
    globalIndex: index,
  };

  const allNodes = allLabels.map((l, i) => ({
    ...pseudoNode,
    id: `concept-${i}`,
    label: l,
    globalIndex: i,
    branchId: i % 6,
  }));

  return buildNodeStudyDetail(pseudoNode, allNodes, context.centerTitle, context);
}
