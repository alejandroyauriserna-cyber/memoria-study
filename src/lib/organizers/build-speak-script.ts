import type { NodeStudyDetail } from "@/lib/organizers/concept-map-study";

export function buildNodeSpeakScript(detail: NodeStudyDetail): string {
  const parts = [
    detail.summary,
    detail.simpleExplanation,
    detail.examImportance,
    detail.legalExample,
    detail.examQuestion,
    detail.memoryTip,
  ].filter(Boolean);

  return parts.join(" ");
}

export function buildOrganizerSpeakScript(input: {
  title?: string;
  summary?: string;
  simplifiedExplanation?: string;
}): string {
  const parts = [
    input.title ? `Tema: ${input.title}.` : "",
    input.summary,
    input.simplifiedExplanation,
  ].filter(Boolean);

  return parts.join(" ");
}
