import type { OrganizerContent } from "@/lib/organizers/parse-content";
import type { InteractiveDiagramLayoutState, VisualAiFormatId } from "@/lib/organizers/visual-ai-types";

export function mergeInteractiveDiagramLayout(
  content: OrganizerContent,
  formatId: VisualAiFormatId,
  interactiveLayout: InteractiveDiagramLayoutState,
): OrganizerContent {
  const current = content.visualAiOutputs?.[formatId];
  if (!current) return content;

  return {
    ...content,
    visualAiOutputs: {
      ...content.visualAiOutputs,
      [formatId]: {
        ...current,
        interactiveLayout,
      },
    },
  };
}
