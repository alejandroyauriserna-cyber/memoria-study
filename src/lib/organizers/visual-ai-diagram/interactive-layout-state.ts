import type { DiagramLayout, LayoutNode } from "@/lib/organizers/visual-ai-diagram/compute-diagram-layout";
import type { InteractiveDiagramLayoutState } from "@/lib/organizers/visual-ai-types";

export function applyInteractiveLayout(
  base: DiagramLayout,
  state?: InteractiveDiagramLayoutState | null,
): DiagramLayout {
  if (!state?.positions && !state?.collapsedGroups?.length) return base;

  const collapsed = new Set(state.collapsedGroups ?? []);
  const hidden = new Set<string>();

  for (const groupId of collapsed) {
    const branchChildren = base.edges.filter((e) => e.from === groupId).map((e) => e.to);
    for (const child of branchChildren) {
      hidden.add(child);
      base.edges
        .filter((e) => e.from === child)
        .map((e) => e.to)
        .forEach((id) => hidden.add(id));
    }
  }

  const nodes: LayoutNode[] = base.nodes
    .filter((n) => !hidden.has(n.id))
    .map((node) => {
      const saved = state.positions?.[node.id];
      if (!saved) return node;
      return { ...node, x: saved.x, y: saved.y };
    });

  const visibleIds = new Set(nodes.map((n) => n.id));
  const edges = base.edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to));

  return { ...base, nodes, edges };
}

export function buildLayoutStateFromNodes(
  nodes: LayoutNode[],
  collapsedGroups: string[],
): InteractiveDiagramLayoutState {
  const positions: InteractiveDiagramLayoutState["positions"] = {};
  for (const node of nodes) {
    positions[node.id] = { x: node.x, y: node.y };
  }
  return {
    positions,
    collapsedGroups,
    updatedAt: new Date().toISOString(),
  };
}
