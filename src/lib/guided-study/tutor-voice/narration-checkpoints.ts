import { ensureActiveLearning } from "@/lib/guided-study/ensure-active-learning";
import type { PageProfessorAnalysis } from "@/types/guided-legal-study";
import type { NarrationClassMode, NarrationStyle } from "@/types/tutor-voice";

export type NarrationCheckpointType = "recall" | "retrieval" | "feynman";

export type NarrationCheckpoint = {
  id: string;
  atPercent: number;
  type: NarrationCheckpointType;
  prompt: string;
  hint?: string;
  concept?: string;
  audiencePrompt?: string;
};

export function buildNarrationCheckpoints(
  analysis: PageProfessorAnalysis,
  style: NarrationStyle,
  mode: NarrationClassMode,
): NarrationCheckpoint[] {
  if (mode !== "practice") return [];

  const enriched = ensureActiveLearning(analysis);
  const learning = enriched.activeLearning!;
  const cards = enriched.conceptCards;
  const primary = cards[0]?.concept?.trim() || enriched.pageFocus;
  const secondary = cards[1]?.concept?.trim() || primary;

  if (style === "quick") {
    return [
      {
        id: "cp-recall-mid",
        atPercent: 55,
        type: "recall",
        prompt: `En una o dos frases: ¿en qué consiste «${primary}»?`,
        hint: learning.retrieval.hint,
        concept: primary,
      },
    ];
  }

  if (style === "normal") {
    return [
      {
        id: "cp-retrieval",
        atPercent: 42,
        type: "retrieval",
        prompt: learning.retrieval.question,
        hint: learning.retrieval.hint,
        concept: primary,
      },
      {
        id: "cp-recall",
        atPercent: 78,
        type: "recall",
        prompt: `Sin mirar notas: resume «${secondary}» y por qué importa en el examen.`,
        hint: "Definición breve + relevancia práctica.",
        concept: secondary,
      },
    ];
  }

  return [
    {
      id: "cp-retrieval",
      atPercent: 33,
      type: "retrieval",
      prompt: learning.retrieval.question,
      hint: learning.retrieval.hint,
      concept: primary,
    },
    {
      id: "cp-feynman",
      atPercent: 62,
      type: "feynman",
      prompt: `${learning.feynman.audiencePrompt} Concepto: «${learning.feynman.concept}».`,
      concept: learning.feynman.concept,
      audiencePrompt: learning.feynman.audiencePrompt,
    },
    {
      id: "cp-recall-final",
      atPercent: 88,
      type: "recall",
      prompt:
        enriched.comprehensionQuestion?.trim() ||
        `¿Qué llevarías al examen sobre «${primary}»?`,
      concept: primary,
    },
  ];
}
