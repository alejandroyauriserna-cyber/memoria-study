import { extractInfographicTopics } from "@/lib/ai/build-academic-infographic-prompt";
import type { OrganizerContent } from "@/lib/organizers/parse-content";

export type DiagramNode = { id: string; label: string };
export type DiagramEdge = { from: string; to: string; label?: string };

export type ConceptMapData = {
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

export type MindMapBranch = {
  id: string;
  label: string;
  children: string[];
};

export type MindMapData = {
  title: string;
  branches: MindMapBranch[];
};

export type TimelineDiagramEvent = {
  date?: string;
  label: string;
};

export type TimelineData = {
  title: string;
  events: TimelineDiagramEvent[];
};

export type ComparisonRow = {
  criterion: string;
  left: string;
  right: string;
};

export type ComparisonData = {
  title: string;
  leftTitle: string;
  rightTitle: string;
  rows: ComparisonRow[];
};

function slugId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

export function extractConceptMapData(content: OrganizerContent): ConceptMapData {
  const { centralTopic, subtopics } = extractInfographicTopics(content);

  if (content.flowProcess?.nodes?.length) {
    return {
      title: content.flowProcess.title?.trim() || centralTopic,
      nodes: content.flowProcess.nodes.map((n) => ({ id: n.id, label: n.label })),
      edges: (content.flowProcess.edges ?? []).map((e) => ({
        from: e.from,
        to: e.to,
        label: e.label,
      })),
    };
  }

  const rootId = "root";
  const nodes: DiagramNode[] = [{ id: rootId, label: centralTopic }];
  const edges: DiagramEdge[] = [];

  const branches =
    content.hierarchy?.branches?.filter(Boolean) ??
    content.conceptMap?.nodes?.filter(Boolean) ??
    subtopics;

  branches.slice(0, 8).forEach((label, index) => {
    const id = slugId("branch", index);
    nodes.push({ id, label });
    edges.push({ from: rootId, to: id, label: "incluye" });
  });

  const leafPool =
    content.conceptMap?.nodes?.filter(
      (n) => n && !branches.includes(n) && n.toLowerCase() !== centralTopic.toLowerCase(),
    ) ?? subtopics.filter((s) => !branches.includes(s));

  leafPool.slice(0, 8).forEach((label, index) => {
    const parent = edges[index % Math.max(branches.length, 1)];
    if (!parent) return;
    const id = slugId("leaf", index);
    nodes.push({ id, label });
    edges.push({ from: parent.to, to: id, label: "desarrolla" });
  });

  for (const relation of content.aiAnalysis?.relationsFound?.slice(0, 4) ?? []) {
    const parts = relation.split(/\s*(→|->|—|–|:)\s*/);
    if (parts.length >= 3) {
      const fromLabel = parts[0]?.trim();
      const toLabel = parts[parts.length - 1]?.trim();
      if (!fromLabel || !toLabel) continue;
      const from = nodes.find((n) => n.label.toLowerCase() === fromLabel.toLowerCase());
      const to = nodes.find((n) => n.label.toLowerCase() === toLabel.toLowerCase());
      if (from && to && from.id !== to.id) {
        edges.push({ from: from.id, to: to.id, label: "relación" });
      }
    }
  }

  return { title: content.conceptMap?.title?.trim() || centralTopic, nodes, edges };
}

export function extractMindMapData(content: OrganizerContent): MindMapData {
  const { centralTopic, subtopics } = extractInfographicTopics(content);

  const primary =
    content.hierarchy?.branches?.filter(Boolean) ??
    subtopics.slice(0, 6);

  const pool =
    content.conceptMap?.nodes?.filter(Boolean) ??
    content.reviewBundle?.keyConcepts?.filter(Boolean) ??
    subtopics;

  const branches: MindMapBranch[] = primary.slice(0, 6).map((label, index) => {
    const children = pool
      .filter((item) => item !== label && item.toLowerCase() !== centralTopic.toLowerCase())
      .filter((_, i) => i % Math.max(primary.length, 1) === index)
      .slice(0, 3);
    return { id: slugId("mind", index), label, children };
  });

  if (!branches.length) {
    return {
      title: centralTopic,
      branches: subtopics.slice(0, 5).map((label, index) => ({
        id: slugId("mind", index),
        label,
        children: [],
      })),
    };
  }

  return { title: centralTopic, branches };
}

export function extractTimelineData(content: OrganizerContent): TimelineData {
  const { centralTopic } = extractInfographicTopics(content);
  const events =
    content.timeline?.events
      ?.filter((e) => e.label?.trim())
      .map((e) => ({ date: e.date?.trim(), label: e.label!.trim() })) ?? [];

  if (events.length) {
    return { title: centralTopic, events: events.slice(0, 10) };
  }

  return {
    title: centralTopic,
    events: [
      { date: "Fase 1", label: "Origen y fundamentos doctrinales" },
      { date: "Fase 2", label: "Desarrollo normativo y jurisprudencia" },
      { date: "Fase 3", label: "Aplicación práctica y casos" },
      { date: "Fase 4", label: "Síntesis para examen" },
    ],
  };
}

export function extractComparisonData(content: OrganizerContent): ComparisonData {
  const { centralTopic, subtopics } = extractInfographicTopics(content);

  const fromSummary = content.visualSummary?.comparisons?.filter((c) => c.title && c.left && c.right);
  if (fromSummary?.length) {
    const first = fromSummary[0]!;
    return {
      title: centralTopic,
      leftTitle: first.title.split(/\s+vs\s+/i)[0]?.trim() || "Concepto A",
      rightTitle: first.title.split(/\s+vs\s+/i)[1]?.trim() || "Concepto B",
      rows: fromSummary.slice(0, 6).map((c) => ({
        criterion: c.title,
        left: c.left,
        right: c.right,
      })),
    };
  }

  const cards = content.visualSummary?.conceptCards?.slice(0, 4) ?? [];
  const leftTitle = subtopics[0] ?? "Concepto A";
  const rightTitle = subtopics[1] ?? "Concepto B";

  const rows: ComparisonRow[] = [];
  if (cards.length >= 2) {
    for (let i = 0; i < Math.min(cards.length, 4); i += 2) {
      const left = cards[i];
      const right = cards[i + 1];
      if (left && right) {
        rows.push({
          criterion: left.title,
          left: left.description,
          right: right.description,
        });
      }
    }
  }

  if (!rows.length && content.flashcards?.length) {
    for (let i = 0; i < Math.min(content.flashcards.length, 4); i += 2) {
      const left = content.flashcards[i];
      const right = content.flashcards[i + 1];
      if (left?.question && right?.question) {
        rows.push({
          criterion: "Definición",
          left: left.answer ?? left.question,
          right: right.answer ?? right.question,
        });
      }
    }
  }

  if (!rows.length) {
    rows.push(
      { criterion: "Definición", left: `${leftTitle}: concepto jurídico principal`, right: `${rightTitle}: concepto jurídico contrapuesto` },
      { criterion: "Naturaleza", left: "Régimen y efectos del primer instituto", right: "Régimen y efectos del segundo instituto" },
      { criterion: "Ejemplo", left: "Caso práctico A", right: "Caso práctico B" },
    );
  }

  return { title: centralTopic, leftTitle, rightTitle, rows };
}
