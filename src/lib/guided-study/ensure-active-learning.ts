import type {
  ActiveLearningBlock,
  ApplyConceptCase,
  PageProfessorAnalysis,
  SurpriseQuestion,
} from "@/types/guided-legal-study";
import { narrativePhaseForPage } from "@/lib/guided-study/case-narrative";

function primaryConcept(analysis: PageProfessorAnalysis): string {
  const essential = analysis.conceptCards.find((c) => c.essential) ?? analysis.conceptCards[0];
  return essential?.concept?.trim() || analysis.pageFocus.slice(0, 80) || "Concepto de la página";
}

function buildApplyFallback(analysis: PageProfessorAnalysis, pageNumber?: number): ApplyConceptCase {
  const concept = primaryConcept(analysis);
  const card = analysis.conceptCards[0];
  const phase = pageNumber ? narrativePhaseForPage(pageNumber) : undefined;
  const scenario =
    card?.example?.trim() ||
    `Situación académica donde debes aplicar «${concept}» en un caso del ordenamiento peruano.`;

  return {
    studiedConcept: concept,
    scenario,
    prompt: `¿Cómo aplicarías «${concept}» en este caso?`,
    options: [
      { id: "a", label: "Aplicar el criterio doctrinal principal del instituto" },
      { id: "b", label: "Descartar el instituto y usar solo analogía" },
      { id: "c", label: "Aplicar una excepción sin verificar requisitos" },
    ],
    correctOptionId: "a",
    modelAnswer:
      card?.explanation?.slice(0, 280) ||
      "Debes identificar el instituto, sus requisitos y aplicarlo al supuesto con criterio jurídico.",
    feedbackCorrect: "Correcto: priorizaste el criterio doctrinal central del instituto.",
    feedbackIncorrect:
      "Revisa los requisitos del instituto antes de aplicar excepciones o analogías.",
    narrativePhase: phase,
  };
}

function buildRetrievalFallback(analysis: PageProfessorAnalysis): ActiveLearningBlock["retrieval"] {
  const concept = primaryConcept(analysis);
  const legacy = analysis.comprehensionQuestion?.trim();

  return {
    question:
      legacy ||
      `Sin mirar el texto: ¿cuál es la idea central de «${concept}» y para qué sirve en el examen?`,
    hint: "Piensa en definición + función jurídica.",
  };
}

function buildFeynmanFallback(analysis: PageProfessorAnalysis): ActiveLearningBlock["feynman"] {
  const concept = primaryConcept(analysis);
  return {
    concept,
    audiencePrompt: "Explícale este concepto a un estudiante de primer ciclo.",
  };
}

function buildSurpriseFallback(analysis: PageProfessorAnalysis): SurpriseQuestion {
  const concept = primaryConcept(analysis);
  return {
    question: `En 10 segundos: menciona un elemento esencial de «${concept}».`,
    timeLimitSec: 10,
  };
}

export function ensureActiveLearning(analysis: PageProfessorAnalysis): PageProfessorAnalysis {
  const activeLearning: ActiveLearningBlock = {
    applyConcept: analysis.activeLearning?.applyConcept ?? buildApplyFallback(analysis),
    retrieval: analysis.activeLearning?.retrieval ?? buildRetrievalFallback(analysis),
    feynman: analysis.activeLearning?.feynman ?? buildFeynmanFallback(analysis),
  };

  const surpriseQuestion =
    analysis.surpriseQuestion?.question?.trim()
      ? {
          question: analysis.surpriseQuestion.question.trim(),
          timeLimitSec: analysis.surpriseQuestion.timeLimitSec || 10,
        }
      : buildSurpriseFallback(analysis);

  const oralExamSeed =
    analysis.oralExamSeed?.question?.trim()
      ? analysis.oralExamSeed
      : analysis.examMode.oral[0]
        ? {
            question: analysis.examMode.oral[0].question,
            gradingPoints: analysis.examMode.oral[0].gradingPoints,
            followUpQuestions: [],
          }
        : {
            question: `Defiende oralmente tu comprensión de «${primaryConcept(analysis)}».`,
            gradingPoints: ["Define el instituto", "Menciona requisitos o efectos", "Aplica a un caso breve"],
            followUpQuestions: ["¿Qué error cometería un estudiante al responder esto?"],
          };

  return {
    ...analysis,
    activeLearning,
    surpriseQuestion,
    oralExamSeed,
    comprehensionQuestion: analysis.comprehensionQuestion ?? activeLearning.retrieval.question,
  };
}
