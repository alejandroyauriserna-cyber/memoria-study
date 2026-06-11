import { buildConceptDetailFromLabel } from "@/lib/organizers/study-content";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import type { LayoutNode } from "@/lib/organizers/visual-ai-diagram/compute-diagram-layout";

export type DiagramNodeDetail = {
  label: string;
  simpleExplanation: string;
  legalBasis: string;
  practicalExample: string;
  examQuestion: string;
  examAnswer: string;
  pdfSource: string;
  relatedConcepts: string[];
};

export function buildDiagramNodeDetail(
  node: LayoutNode,
  allNodes: LayoutNode[],
  content: OrganizerContent,
  organizerTitle: string,
): DiagramNodeDetail {
  const labels = allNodes.map((n) => n.label);
  const index = allNodes.findIndex((n) => n.id === node.id);
  const context = {
    centerTitle: organizerTitle,
    summary: content.summary,
    simplifiedExplanation: content.simplifiedExplanation,
    reviewBundle: content.reviewBundle,
    visualSummary: content.visualSummary,
    flashcards: content.flashcards,
    reviewQuestions: content.reviewQuestions,
    aiAnalysis: content.aiAnalysis,
  };

  const detail = buildConceptDetailFromLabel(
    node.label.replace(/^[\d\s·.-]+/, "").trim() || node.label,
    Math.max(0, index),
    labels,
    context,
  );

  const card = content.visualSummary?.conceptCards?.find(
    (c) => c.title.toLowerCase().includes(node.label.toLowerCase().slice(0, 12)),
  );

  return {
    label: node.label,
    simpleExplanation: detail.simpleExplanation,
    legalBasis: detail.summary || detail.legalExample,
    practicalExample: detail.legalExample,
    examQuestion: detail.examQuestion,
    examAnswer: detail.commonMistake
      ? `${detail.memoryTip} · Error frecuente: ${detail.commonMistake}`
      : detail.memoryTip,
    pdfSource:
      card?.description?.trim() ||
      content.summary?.slice(0, 320).trim() ||
      `Fragmento inferido del material «${organizerTitle}» vinculado al concepto «${node.label}».`,
    relatedConcepts: [...detail.relations, ...detail.derivedConcepts].filter(Boolean).slice(0, 6),
  };
}
