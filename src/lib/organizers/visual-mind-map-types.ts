export type VisualMindMapNode = {
  id: string;
  label: string;
  explanation: string;
  icon: string;
  imageUrl?: string | null;
  imagePrompt?: string;
  relatedIds: string[];
  x: number;
  y: number;
  ring: "center" | "branch";
};

export type VisualMindMap = {
  centralTopic: string;
  generatedAt: string;
  nodes: VisualMindMapNode[];
  width: number;
  height: number;
};

export const MAX_VISUAL_MIND_MAP_IMAGES = 6;
