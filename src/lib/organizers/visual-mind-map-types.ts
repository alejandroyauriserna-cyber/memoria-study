export type VisualMindMapCategory =
  | "concept"
  | "norm"
  | "principle"
  | "case"
  | "example"
  | "comparison";

export type VisualMindMapTier = "center" | "topic" | "subtopic" | "detail";

export type VisualMindMapNode = {
  id: string;
  label: string;
  explanation: string;
  example?: string;
  reviewQuestion?: string;
  icon: string;
  category: VisualMindMapCategory;
  tier: VisualMindMapTier;
  parentId?: string;
  imageUrl?: string | null;
  imagePrompt?: string;
  relatedIds: string[];
  legalReferences?: string[];
  x: number;
  y: number;
  /** @deprecated — use tier */
  ring?: "center" | "branch";
};

export type VisualMindMap = {
  centralTopic: string;
  generatedAt: string;
  nodes: VisualMindMapNode[];
  width: number;
  height: number;
  illustratedImageUrl?: string | null;
};

export const MAX_VISUAL_MIND_MAP_IMAGES = 8;

export function normalizeVisualMindMapNode(
  node: VisualMindMapNode & { ring?: "center" | "branch" },
): VisualMindMapNode {
  const tier =
    node.tier ??
    (node.ring === "center" ? "center" : node.parentId ? "detail" : "topic");

  return {
    ...node,
    tier,
    category: node.category ?? "concept",
    example: node.example ?? "",
    reviewQuestion: node.reviewQuestion ?? "",
    parentId:
      node.parentId ??
      (tier === "center" ? undefined : tier === "topic" ? "center" : undefined),
  };
}

export function normalizeVisualMindMap(map: VisualMindMap): VisualMindMap {
  return {
    ...map,
    nodes: map.nodes.map(normalizeVisualMindMapNode),
  };
}
