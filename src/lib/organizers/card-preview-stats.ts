import type { OrganizerContent } from "@/lib/organizers/parse-content";
import type { OrganizerTypeBadgeVariant } from "@/lib/organizers/type-badge";
import { layoutStudyMapNodes } from "@/lib/organizers/concept-map-study";

export type OrganizerCardPreviewStats = {
  label: string;
  count: number;
  unit: string;
  variant: OrganizerTypeBadgeVariant;
};

function pluralize(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

function rutaCount(parsed: OrganizerContent) {
  const branches = parsed.hierarchy?.branches?.filter(Boolean).length ?? 0;
  const steps = parsed.flowChart?.steps?.filter(Boolean).length ?? 0;
  const processNodes = parsed.flowProcess?.nodes?.length ?? 0;
  const hasFlowChart = parsed.flowChart?.start || parsed.flowChart?.end ? 1 : 0;
  return Math.max(branches, steps, processNodes, hasFlowChart ? 2 : 0);
}

function repasoCount(parsed: OrganizerContent) {
  const review = parsed.reviewQuestions?.filter(Boolean).length ?? 0;
  const bundle = parsed.reviewBundle?.questions?.length ?? 0;
  const exam = parsed.reviewBundle?.examQuestions?.length ?? 0;
  return review + bundle + exam;
}

function juridicoCount(parsed: OrganizerContent) {
  let count = 0;
  if (parsed.summary?.trim()) count += 1;
  count += parsed.visualSummary?.conceptCards?.length ?? 0;
  count += parsed.visualSummary?.comparisons?.length ?? 0;
  count += parsed.visualSummary?.legalTables?.length ?? 0;
  count += parsed.reviewBundle?.keyConcepts?.length ?? 0;
  if (parsed.simplifiedExplanation?.trim()) count += 1;
  if (parsed.aiAnalysis?.conceptsDetected?.length) {
    count += parsed.aiAnalysis.conceptsDetected.length;
  }
  return count;
}

export function resolveOrganizerCardPreview(
  parsed: OrganizerContent,
): OrganizerCardPreviewStats | null {
  const candidates: Array<OrganizerCardPreviewStats & { score: number }> = [];

  const flashcards = parsed.flashcards?.length ?? 0;
  if (flashcards > 0) {
    candidates.push({
      label: "FLASHCARDS",
      count: flashcards,
      unit: pluralize(flashcards, "tarjeta", "tarjetas"),
      variant: "flashcards",
      score: flashcards * 100,
    });
  }

  const events = parsed.timeline?.events?.length ?? 0;
  if (events > 0) {
    candidates.push({
      label: "TIMELINE",
      count: events,
      unit: pluralize(events, "evento", "eventos"),
      variant: "timeline",
      score: events * 90,
    });
  }

  const ruta = rutaCount(parsed);
  if (ruta > 0) {
    candidates.push({
      label: "RUTA",
      count: ruta,
      unit: pluralize(ruta, "etapa", "etapas"),
      variant: "ruta",
      score: ruta * 85,
    });
  }

  const repaso = repasoCount(parsed);
  if (repaso > 0) {
    candidates.push({
      label: "REPASO",
      count: repaso,
      unit: pluralize(repaso, "pregunta", "preguntas"),
      variant: "repaso",
      score: repaso * 80,
    });
  }

  const mindMapNodes = parsed.visualMindMap?.nodes?.length ?? 0;
  if (mindMapNodes > 0) {
    candidates.push({
      label: "MAPA VISUAL",
      count: mindMapNodes,
      unit: pluralize(mindMapNodes, "nodo", "nodos"),
      variant: "mapa",
      score: mindMapNodes * 75,
    });
  }

  const juridico = juridicoCount(parsed);
  if (juridico > 0) {
    candidates.push({
      label: "JURÍDICO",
      count: juridico,
      unit: pluralize(juridico, "sección", "secciones"),
      variant: "juridico",
      score: juridico * 70,
    });
  }

  if (!candidates.length) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return {
    label: best.label,
    count: best.count,
    unit: best.unit,
    variant: best.variant,
  };
}

export function previewBlockFill(count: number, blocks = 8) {
  const normalized = Math.min(count, 64);
  return Math.min(blocks, Math.max(2, Math.ceil((normalized / 64) * blocks)));
}

export type OrganizerCardMeta = {
  conceptCount: number;
  branchCount: number;
  hasConceptMap: boolean;
};

export function resolveOrganizerCardMeta(parsed: OrganizerContent): OrganizerCardMeta {
  const rawNodes = parsed.conceptMap?.nodes?.filter(Boolean) ?? [];

  if (rawNodes.length > 0) {
    const layout = layoutStudyMapNodes(parsed.conceptMap?.title, rawNodes);
    const branchIds = new Set(layout.nodes.map((node) => node.branchId));

    return {
      conceptCount: rawNodes.length,
      branchCount: branchIds.size,
      hasConceptMap: true,
    };
  }

  let branchCount = parsed.hierarchy?.branches?.filter(Boolean).length ?? 0;

  return {
    conceptCount: 0,
    branchCount,
    hasConceptMap: false,
  };
}
