export type VisualMindMapCategory =
  | "concept"
  | "norm"
  | "principle"
  | "case"
  | "example"
  | "comparison"
  | "article";

export type VisualMindMapTier = "center" | "topic" | "subtopic" | "detail";

export type VisualMindMapImportance = "essential" | "important" | "supporting";

export type VisualMindMapNode = {
  id: string;
  label: string;
  /** Resumen de una línea visible en el nodo */
  summary: string;
  explanation: string;
  example?: string;
  reviewQuestion?: string;
  icon: string;
  emoji?: string;
  category: VisualMindMapCategory;
  tier: VisualMindMapTier;
  importance: VisualMindMapImportance;
  parentId?: string;
  imageUrl?: string | null;
  imagePrompt?: string;
  relatedIds: string[];
  legalReferences?: string[];
  jurisprudence?: string[];
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

export const MAX_VISUAL_MIND_MAP_IMAGES = 10;

function defaultImportance(tier: VisualMindMapTier): VisualMindMapImportance {
  if (tier === "center" || tier === "topic") return "essential";
  if (tier === "subtopic") return "important";
  return "supporting";
}

export function normalizeVisualMindMapNode(
  node: VisualMindMapNode & { ring?: "center" | "branch" },
): VisualMindMapNode {
  const tier =
    node.tier ??
    (node.ring === "center" ? "center" : node.parentId ? "detail" : "topic");

  const explanation = node.explanation ?? "";
  const summary =
    node.summary?.trim() ||
    (explanation ? explanation.split(/(?<=[.!?])\s+/)[0]?.slice(0, 96) ?? "" : "");

  return {
    ...node,
    tier,
    summary,
    category: node.category ?? "concept",
    importance: node.importance ?? defaultImportance(tier),
    example: node.example ?? "",
    reviewQuestion: node.reviewQuestion ?? "",
    jurisprudence: node.jurisprudence ?? [],
    legalReferences: node.legalReferences ?? [],
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
