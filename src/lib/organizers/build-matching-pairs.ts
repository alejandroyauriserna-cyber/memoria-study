import type { OrganizerMatchingPair } from "@/types/organizer-matching-pairs";

const MIN_DEFINITION_LEN = 12;
const MAX_DEFINITION_LEN = 280;
const MAX_CONCEPT_LEN = 80;
const DEFAULT_MAX_PAIRS = 12;

function normalizeKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function clip(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** Extrae el término de preguntas tipo «¿Qué es «X»?» o «Define X». */
export function extractConceptFromQuestion(question: string): string | null {
  const quoted = question.match(/[«"']([^»"']{2,80})[»"']/);
  if (quoted?.[1]) return quoted[1].trim();

  const whatIs = question.match(/(?:qué es|que es|define|concepto)\s+(.+?)\??$/i);
  if (whatIs?.[1]) return clip(whatIs[1].replace(/[?.!]+$/, ""), MAX_CONCEPT_LEN);

  if (question.length <= MAX_CONCEPT_LEN) return question.replace(/\?+$/, "").trim();
  return null;
}

export function buildOrganizerMatchingPairs(input: {
  flashcards?: Array<{ question?: string; answer?: string }>;
  visualSummary?: {
    conceptCards?: Array<{ title: string; description: string }>;
  };
  reviewBundle?: {
    keyConcepts?: string[];
    questions?: Array<{ question: string; answer: string }>;
  };
  flowProcess?: {
    nodes?: Array<{ id?: string; label?: string; explanation?: string | null }>;
  };
  maxPairs?: number;
}): OrganizerMatchingPair[] {
  const maxPairs = input.maxPairs ?? DEFAULT_MAX_PAIRS;
  const seen = new Set<string>();
  const pairs: OrganizerMatchingPair[] = [];

  function push(pair: OrganizerMatchingPair) {
    const conceptKey = normalizeKey(pair.concept);
    const defKey = normalizeKey(pair.definition);
    if (conceptKey.length < 2 || defKey.length < MIN_DEFINITION_LEN) return;
    if (seen.has(conceptKey)) return;
    if (pair.definition.length > MAX_DEFINITION_LEN) {
      pair = { ...pair, definition: clip(pair.definition, MAX_DEFINITION_LEN) };
    }
    seen.add(conceptKey);
    pairs.push({
      ...pair,
      concept: clip(pair.concept, MAX_CONCEPT_LEN),
    });
  }

  for (const card of input.visualSummary?.conceptCards ?? []) {
    if (pairs.length >= maxPairs) break;
    if (!card.title?.trim() || !card.description?.trim()) continue;
    push({
      id: `card-${pairs.length + 1}`,
      concept: card.title.trim(),
      definition: card.description.trim(),
      source: "concept_card",
    });
  }

  for (const card of input.flashcards ?? []) {
    if (pairs.length >= maxPairs) break;
    const answer = card.answer?.trim();
    if (!answer || answer.length < MIN_DEFINITION_LEN) continue;

    const fromQuestion = card.question ? extractConceptFromQuestion(card.question) : null;
    const concept = fromQuestion ?? clip(answer.split(/[,.;]/)[0] ?? answer, 48);
    if (!concept) continue;

    push({
      id: `fc-${pairs.length + 1}`,
      concept,
      definition: answer,
      hint: card.question?.trim(),
      source: "flashcard",
    });
  }

  for (const item of input.reviewBundle?.questions ?? []) {
    if (pairs.length >= maxPairs) break;
    const concept = extractConceptFromQuestion(item.question);
    const answer = item.answer?.trim();
    if (!concept || !answer || answer.length < MIN_DEFINITION_LEN) continue;

    push({
      id: `rv-${pairs.length + 1}`,
      concept,
      definition: answer,
      source: "review",
    });
  }

  for (const node of input.flowProcess?.nodes ?? []) {
    if (pairs.length >= maxPairs) break;
    const label = node.label?.trim();
    const explanation = node.explanation?.trim();
    if (!label || !explanation || explanation.length < MIN_DEFINITION_LEN) continue;

    push({
      id: `flow-${node.id ?? pairs.length + 1}`,
      concept: label,
      definition: explanation,
      source: "flow",
    });
  }

  for (const concept of input.reviewBundle?.keyConcepts ?? []) {
    if (pairs.length >= maxPairs) break;
    const label = concept.trim();
    if (label.length < 3) continue;

    const reviewAnswer = input.reviewBundle?.questions?.find((q) =>
      q.question.toLowerCase().includes(label.toLowerCase().slice(0, 10)),
    )?.answer;

    if (!reviewAnswer || reviewAnswer.length < MIN_DEFINITION_LEN) continue;

    push({
      id: `key-${pairs.length + 1}`,
      concept: label,
      definition: reviewAnswer,
      source: "review",
    });
  }

  return pairs.slice(0, maxPairs);
}
