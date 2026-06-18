import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import { buildPedagogicalReviewQuestions } from "@/lib/organizers/pedagogical-questions";

type ReviewBundle = NonNullable<StoredOrganizerContent["reviewBundle"]>;

export function buildReviewBundleFallback(input: {
  summary?: string;
  simplifiedExplanation?: string;
  flashcards?: Array<{ question?: string; answer?: string }>;
  reviewQuestions?: string[];
  conceptNodes?: string[];
  visualConceptTitles?: string[];
  detectedConcepts?: string[];
  reviewBundle?: ReviewBundle;
}): ReviewBundle {
  if (input.reviewBundle?.examQuestions?.length) {
    return input.reviewBundle;
  }

  const keyConcepts =
    input.reviewBundle?.keyConcepts?.length
      ? input.reviewBundle.keyConcepts
      : input.conceptNodes?.slice(0, 12) ??
        input.visualConceptTitles?.slice(0, 12) ??
        input.detectedConcepts?.slice(0, 12) ??
        input.flashcards?.slice(0, 8).map((c) => c.question ?? c.answer ?? "").filter(Boolean) ??
        splitSummaryConcepts(input.summary);

  const mapTitle =
    input.conceptNodes?.[0] ??
    input.visualConceptTitles?.[0] ??
    "este organizador";

  const questions =
    input.reviewBundle?.questions?.length
      ? input.reviewBundle.questions
      : buildQuestionsFromLegacy(
          input.reviewQuestions,
          input.flashcards,
          keyConcepts,
          mapTitle,
          input.summary,
        );

  const examQuestions =
    input.reviewBundle?.examQuestions?.length
      ? input.reviewBundle.examQuestions
      : buildExamQuestions(input.flashcards, input.reviewQuestions, keyConcepts, input.summary);

  return {
    keyConcepts,
    questions,
    examQuestions,
  };
}

function splitSummaryConcepts(summary?: string): string[] {
  if (!summary) return [];
  return summary
    .split(/[,;.]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12)
    .slice(0, 6);
}

function buildQuestionsFromLegacy(
  legacy: string[] | undefined,
  flashcards: Array<{ question?: string; answer?: string }> | undefined,
  keyConcepts: string[],
  mapTitle: string,
  summary?: string,
): ReviewBundle["questions"] {
  const fromLegacy = (legacy ?? []).map((question, index) => ({
    question,
    answer:
      flashcards?.[index]?.answer ??
      "Repasa la definición en el mapa conceptual y verifica con tus apuntes del PDF.",
    difficulty: (index % 3 === 0 ? "basico" : index % 3 === 1 ? "intermedio" : "avanzado") as
      | "basico"
      | "intermedio"
      | "avanzado",
    type: "abierta" as const,
    options: undefined,
  }));

  const fromFlashcards = (flashcards ?? []).slice(0, 10).map((card, index) => ({
    question:
      card.question?.trim() ||
      `Recuperación: resume en tus palabras «${card.answer?.slice(0, 48) ?? "este concepto"}».`,
    answer: card.answer ?? "Consulta el organizador visual y el PDF para la respuesta completa.",
    difficulty: (index % 3 === 0 ? "basico" : index % 3 === 1 ? "intermedio" : "avanzado") as
      | "basico"
      | "intermedio"
      | "avanzado",
    type: "abierta" as const,
    options: undefined,
  }));

  const merged = [...fromLegacy, ...fromFlashcards];
  const seen = new Set<string>();
  const deduped: NonNullable<ReviewBundle["questions"]> = merged.filter((item) => {
    if (seen.has(item.question)) return false;
    seen.add(item.question);
    return true;
  });

  if (deduped.length >= 8 || keyConcepts.length < 2) {
    return deduped.slice(0, 16);
  }

  const descriptions = new Map<string, string>();
  for (const card of flashcards ?? []) {
    if (card.question && card.answer) {
      descriptions.set(card.question, card.answer);
    }
  }

  const pedagogical = buildPedagogicalReviewQuestions({
    concepts: keyConcepts,
    mapTitle,
    descriptions,
    summary,
    maxQuestions: 16,
  });

  for (const item of pedagogical) {
    if (deduped.length >= 16) break;
    if (seen.has(item.question)) continue;
    seen.add(item.question);
    deduped.push({
      question: item.question,
      answer: item.answer,
      difficulty: item.difficulty,
      type: item.type,
      options: undefined,
    });
  }

  return deduped.slice(0, 16);
}

function buildExamQuestions(
  flashcards: Array<{ question?: string; answer?: string }> | undefined,
  legacy: string[] | undefined,
  keyConcepts: string[],
  summary?: string,
): NonNullable<ReviewBundle["examQuestions"]> {
  const exam: NonNullable<ReviewBundle["examQuestions"]> = [];

  for (const card of flashcards ?? []) {
    if (!card.question || !card.answer || exam.length >= 10) break;
    const wrong = keyConcepts.filter((c) => c !== card.answer).slice(0, 2);
    exam.push({
      question: card.question,
      type: "opcion_multiple",
      options: shuffle([card.answer, ...wrong, "Ninguna de las anteriores"]).slice(0, 4),
      answer: card.answer,
      explanation: `La respuesta correcta se fundamenta en el contenido del PDF sobre «${card.answer.slice(0, 48)}».`,
    });
  }

  for (const q of legacy ?? []) {
    if (exam.length >= 12) break;
    exam.push({
      question: q,
      type: "verdadero_falso",
      options: ["Verdadero", "Falso"],
      answer: "Verdadero",
      explanation: "Evalúa si la afirmación coincide con el documento fuente.",
    });
  }

  if (exam.length < 3 && summary) {
    exam.push({
      question: `Caso práctico: aplica un concepto del tema «${keyConcepts[0] ?? "principal"}» a un supuesto similar al del PDF.`,
      type: "caso_practico",
      options: undefined,
      answer: "Identificar hechos, norma aplicable, conclusión jurídica.",
      explanation: summary.slice(0, 180),
    });
  }

  return exam.slice(0, 12);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function mergeReviewContent(parsed: OrganizerContent): ReviewBundle {
  return buildReviewBundleFallback({
    summary: parsed.summary,
    simplifiedExplanation: parsed.simplifiedExplanation,
    flashcards: parsed.flashcards,
    reviewQuestions: parsed.reviewQuestions,
    conceptNodes: parsed.conceptMap?.nodes,
    visualConceptTitles: parsed.visualSummary?.conceptCards?.map((card) => card.title),
    detectedConcepts: parsed.aiAnalysis?.conceptsDetected,
    reviewBundle: parsed.reviewBundle,
  });
}
