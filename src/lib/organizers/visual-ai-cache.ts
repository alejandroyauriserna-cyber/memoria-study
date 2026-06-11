import { getVisualAiFormat } from "@/lib/organizers/visual-ai-formats";
import type { AcademicInfographic } from "@/lib/organizers/academic-infographic-types";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import type { VisualAiFormatId, VisualAiOutput, VisualAiOutputsCache } from "@/lib/organizers/visual-ai-types";

function legacyInfographicToOutput(infographic: AcademicInfographic): VisualAiOutput {
  return {
    formatId: "infographic",
    centralTopic: infographic.centralTopic,
    subtopics: infographic.subtopics,
    imageUrl: infographic.imageUrl,
    prompt: infographic.prompt,
    generatedAt: infographic.generatedAt,
    source: infographic.source,
    warning: infographic.warning,
    model: infographic.model,
  };
}

export function getVisualAiOutput(
  content: OrganizerContent,
  formatId: VisualAiFormatId,
): VisualAiOutput | null {
  const cached = content.visualAiOutputs?.[formatId];
  if (cached?.imageUrl) return cached;

  if (formatId === "infographic" && content.academicInfographic?.imageUrl) {
    return legacyInfographicToOutput(content.academicInfographic);
  }

  return null;
}

export function mergeVisualAiOutput(
  content: OrganizerContent,
  output: VisualAiOutput,
): OrganizerContent {
  const visualAiOutputs: VisualAiOutputsCache = {
    ...content.visualAiOutputs,
    [output.formatId]: output,
  };

  const next: OrganizerContent = { ...content, visualAiOutputs };

  if (output.formatId === "infographic") {
    const legacy: AcademicInfographic = {
      centralTopic: output.centralTopic,
      subtopics: output.subtopics,
      imageUrl: output.imageUrl,
      prompt: output.prompt,
      generatedAt: output.generatedAt,
      source: output.source,
      warning: output.warning,
      model: output.model,
    };
    next.academicInfographic = legacy;
  }

  return next;
}

export type RecentVisualAiItem = VisualAiOutput & {
  formatLabel: string;
  formatEmoji: string;
};

/** Visuales generados, ordenados por fecha (más reciente primero). */
export function listRecentVisualAiOutputs(content: OrganizerContent): RecentVisualAiItem[] {
  const items: RecentVisualAiItem[] = [];

  for (const format of [
    "infographic",
    "mindMap",
    "conceptMap",
    "comparisonTable",
    "timeline",
    "legalAtlas",
    "academicPoster",
    "presentation",
  ] as VisualAiFormatId[]) {
    const output = getVisualAiOutput(content, format);
    if (!output?.imageUrl) continue;
    const config = getVisualAiFormat(format);
    items.push({
      ...output,
      formatLabel: config.label,
      formatEmoji: config.emoji,
    });
  }

  return items.sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
}
