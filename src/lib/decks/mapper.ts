import type { AcademicSelection } from "@/types/academic";
import type { DeckRecord, StudyDeck } from "@/types/study";

export function recordToDeck(record: DeckRecord): StudyDeck {
  return {
    id: record.id,
    title: record.title,
    sourceName: record.source_name,
    summary: record.summary,
    difficulty: record.difficulty,
    estimatedMinutes: record.estimated_minutes,
    flashcards: record.flashcards,
    fillBlanks: record.fill_blanks,
    quiz: record.quiz,
    definitionCards: record.definition_cards ?? [],
    matchingPairs: record.matching_pairs ?? [],
    academic: record.academic_context ?? undefined,
    isPublic: record.is_public,
    createdAt: record.created_at,
  };
}

export function deckToInsert(deck: StudyDeck, userId: string | null) {
  return {
    user_id: userId,
    title: deck.title,
    source_name: deck.sourceName,
    summary: deck.summary,
    difficulty: deck.difficulty,
    estimated_minutes: deck.estimatedMinutes,
    flashcards: deck.flashcards,
    fill_blanks: deck.fillBlanks,
    quiz: deck.quiz,
    definition_cards: deck.definitionCards ?? [],
    matching_pairs: deck.matchingPairs ?? [],
    academic_context: (deck.academic ?? null) as AcademicSelection | null,
    is_public: Boolean(deck.isPublic),
  };
}
