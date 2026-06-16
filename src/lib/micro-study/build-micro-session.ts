import { pickDailyConcept } from "@/lib/micro-study/legal-concepts-seed";
import type {
  MicroSessionConcept,
  MicroSessionFlashcard,
  MicroSessionPack,
  MicroSessionQuiz,
} from "@/types/micro-study";
import type { Flashcard, QuizQuestion } from "@/types/study";
import type { ProfessorConceptCard } from "@/types/guided-legal-study";

type DeckRow = {
  id: string;
  title: string;
  course_name?: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
};

type TutorCacheRow = {
  material_id: string;
  result: {
    analysis?: {
      conceptCards?: ProfessorConceptCard[];
    };
  };
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = Math.abs(seed) || 1;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function conceptsFromCache(rows: TutorCacheRow[]): MicroSessionConcept[] {
  const out: MicroSessionConcept[] = [];
  for (const row of rows) {
    const cards = row.result?.analysis?.conceptCards ?? [];
    for (const card of cards) {
      out.push({
        id: card.id,
        concept: card.concept,
        explanation: card.explanation,
        example: card.example,
      });
    }
  }
  return out;
}

function flashcardsFromDecks(decks: DeckRow[]): MicroSessionFlashcard[] {
  const out: MicroSessionFlashcard[] = [];
  for (const deck of decks) {
    for (const fc of deck.flashcards ?? []) {
      out.push({ id: fc.id, front: fc.front, back: fc.back });
    }
  }
  return out;
}

function quizFromDecks(decks: DeckRow[]): MicroSessionQuiz | null {
  for (const deck of decks) {
    const q = deck.quiz?.[0];
    if (q) {
      return {
        id: q.id,
        question: q.question,
        options: q.options,
        answerIndex: q.answerIndex,
        explanation: q.explanation,
      };
    }
  }
  return null;
}

function fallbackQuiz(concepts: MicroSessionConcept[]): MicroSessionQuiz | null {
  const concept = concepts[0];
  if (!concept) return null;
  return {
    id: `quiz-${concept.id}`,
    question: `¿Cuál es la definición correcta de «${concept.concept}»?`,
    options: [
      concept.explanation.slice(0, 80),
      "Concepto sin relevancia jurídica en el ordenamiento peruano.",
      "Principio aplicable únicamente al derecho penal internacional.",
      "Norma procesal de aplicación general sin fundamento civil.",
    ],
    answerIndex: 0,
    explanation: concept.explanation,
  };
}

/** Sesión de 5 min: 3 conceptos + 2 flashcards + 1 pregunta rápida */
export function buildMicroSessionPack(input: {
  userId: string;
  dateKey: string;
  tutorCacheRows: TutorCacheRow[];
  deckRows: DeckRow[];
  focusCourseName?: string | null;
}): MicroSessionPack {
  const seed = hashString(`${input.userId}:${input.dateKey}:micro-session`);
  const userConcepts = conceptsFromCache(input.tutorCacheRows);
  const dailyFallback = pickDailyConcept(seed);

  let concepts: MicroSessionConcept[] = shuffleWithSeed(userConcepts, seed).slice(0, 3);
  if (concepts.length < 3) {
    const needed = 3 - concepts.length;
    concepts = [
      ...concepts,
      ...Array.from({ length: needed }, (_, i) => ({
        id: `${dailyFallback.id}-${i}`,
        concept: dailyFallback.title,
        explanation: dailyFallback.explanation,
        example: dailyFallback.example,
      })),
    ].slice(0, 3);
  }

  const allFlashcards = flashcardsFromDecks(input.deckRows);
  let flashcards = shuffleWithSeed(allFlashcards, seed + 1).slice(0, 2);
  if (flashcards.length < 2) {
    flashcards = concepts.slice(0, 2).map((c, i) => ({
      id: `fc-${c.id}-${i}`,
      front: c.concept,
      back: c.explanation,
    }));
  }

  const quiz = quizFromDecks(input.deckRows) ?? fallbackQuiz(concepts);

  const sourceCourse =
    input.focusCourseName ??
    input.deckRows[0]?.course_name ??
    input.deckRows[0]?.title ??
    null;

  return {
    id: `micro-${input.dateKey}-${Math.abs(seed)}`,
    title: input.focusCourseName
      ? `Repaso rápido · ${input.focusCourseName}`
      : "Tengo 5 minutos",
    estimatedMinutes: 5,
    concepts,
    flashcards,
    quiz,
    sourceCourse,
  };
}

export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
