import { pickDailyConcept } from "@/lib/micro-study/legal-concepts-seed";
import type { DailyConcept } from "@/types/micro-study";
import type { ProfessorConceptCard } from "@/types/guided-legal-study";

type TutorCacheRow = {
  material_id: string;
  result: {
    analysis?: {
      conceptCards?: ProfessorConceptCard[];
    };
  };
};

type MaterialRow = {
  course_name: string;
};

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function firstSentence(text: string, max = 160): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  const sentence = match?.[0]?.trim() ?? text.trim();
  return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence;
}

export function pickDailyConceptFromUserMaterials(input: {
  userId: string;
  dateKey: string;
  tutorCacheRows: TutorCacheRow[];
  materials: MaterialRow[];
}): DailyConcept {
  const seed = hashString(`${input.userId}:${input.dateKey}:daily-concept`);
  const cards: Array<ProfessorConceptCard & { courseName: string }> = [];

  for (const row of input.tutorCacheRows) {
    const conceptCards = row.result?.analysis?.conceptCards ?? [];
    for (const card of conceptCards) {
      cards.push({ ...card, courseName: "Tu material" });
    }
  }

  if (!cards.length) {
    return pickDailyConcept(seed);
  }

  const index = Math.abs(seed) % cards.length;
  const card = cards[index]!;
  const courseName =
    input.materials[0]?.course_name ??
    cards[index]?.courseName ??
    "Tu biblioteca";

  return {
    id: card.id || `user-concept-${index}`,
    title: card.concept,
    definition: firstSentence(card.explanation, 180),
    example: card.example?.trim() || firstSentence(card.explanation, 120),
    explanation: card.explanation,
    courseName,
    estimatedMinutes: 1,
  };
}
