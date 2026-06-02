import { env } from "@/lib/env";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import {
  MIND_MAP_ICON_KEYS,
  oneLineSummary,
  resolveThematicIcon,
} from "@/lib/organizers/visual-mind-map-icons";
import { layoutVisualMindMap } from "@/lib/organizers/visual-mind-map-layout";
import {
  MAX_VISUAL_MIND_MAP_IMAGES,
  type VisualMindMap,
  type VisualMindMapCategory,
  type VisualMindMapImportance,
  type VisualMindMapNode,
} from "@/lib/organizers/visual-mind-map-types";

const CATEGORIES: VisualMindMapCategory[] = [
  "concept",
  "principle",
  "case",
  "example",
  "comparison",
  "article",
  "norm",
];

function parseJson(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("JSON inválido");
  return JSON.parse(cleaned.slice(start, end + 1)) as {
    nodes?: Array<{
      id: string;
      summary?: string;
      explanation?: string;
      example?: string;
      reviewQuestion?: string;
      icon?: string;
      emoji?: string;
      category?: VisualMindMapCategory;
      importance?: VisualMindMapImportance;
      imagePrompt?: string;
      relatedIds?: string[];
      legalReferences?: string[];
      jurisprudence?: string[];
    }>;
  };
}

export function buildVisualMindMapStructure(content: OrganizerContent): {
  centralTopic: string;
  branchLabels: string[];
} {
  const centralTopic =
    content.conceptMap?.title?.trim() ||
    content.hierarchy?.root?.trim() ||
    content.summary?.slice(0, 80) ||
    "Tema jurídico";

  const fromConcepts = content.conceptMap?.nodes?.filter(Boolean) ?? [];
  const fromHierarchy = content.hierarchy?.branches?.filter(Boolean) ?? [];
  const fromKeyConcepts = content.reviewBundle?.keyConcepts?.filter(Boolean) ?? [];

  const merged = [...new Set([...fromConcepts, ...fromHierarchy, ...fromKeyConcepts])]
    .filter((label) => label.toLowerCase() !== centralTopic.toLowerCase())
    .slice(0, 8);

  return {
    centralTopic,
    branchLabels:
      merged.length >= 2
        ? merged
        : ["Voluntad", "Objeto", "Forma", "Capacidad"],
  };
}

function findDetailLabels(
  topicLabel: string,
  content: OrganizerContent,
): string[] {
  const cards = content.visualSummary?.conceptCards ?? [];
  const matched = cards
    .filter(
      (c) =>
        c.title.toLowerCase().includes(topicLabel.toLowerCase()) ||
        topicLabel.toLowerCase().includes(c.title.toLowerCase()),
    )
    .map((c) => c.title)
    .slice(0, 2);

  if (matched.length) return matched;

  const flashcards = content.flashcards ?? [];
  const fromFlash = flashcards
    .filter((f) => f.question?.toLowerCase().includes(topicLabel.toLowerCase().slice(0, 6)))
    .map((f) => f.question!.slice(0, 48))
    .slice(0, 2);

  if (fromFlash.length) return fromFlash;

  return [`Aspecto clave de ${topicLabel}`, `Aplicación de ${topicLabel}`].slice(0, 2);
}

function inferCategory(label: string, index: number): VisualMindMapCategory {
  const normalized = label.toLowerCase();
  if (/art\.|artículo|articulo|inciso/.test(normalized)) return "article";
  if (/caso|jurisprudencia|precedente|fallo/.test(normalized)) return "case";
  if (/ejemplo|supuesto/.test(normalized)) return "example";
  if (/comparación|versus| vs /.test(normalized)) return "comparison";
  if (/principio|buena fe|legalidad|igualdad/.test(normalized)) return "principle";
  if (/ley|código|decreto|norma/.test(normalized)) return "norm";
  return CATEGORIES[index % CATEGORIES.length]!;
}

function buildHierarchy(centralTopic: string, branchLabels: string[], content: OrganizerContent): VisualMindMapNode[] {
  const nodes: VisualMindMapNode[] = [];
  const topicIds: string[] = [];
  const centerIcon = resolveThematicIcon(centralTopic, "concept");

  nodes.push({
    id: "center",
    label: centralTopic,
    summary: "",
    explanation: "",
    example: "",
    reviewQuestion: "",
    icon: centerIcon.key,
    emoji: centerIcon.emoji,
    category: "concept",
    tier: "center",
    importance: "essential",
    relatedIds: [],
    x: 0,
    y: 0,
  });

  branchLabels.slice(0, 6).forEach((label, index) => {
    const id = `topic-${index}`;
    topicIds.push(id);
    const category = inferCategory(label, index);
    const thematic = resolveThematicIcon(label, category);

    nodes.push({
      id,
      label,
      summary: "",
      explanation: "",
      example: "",
      reviewQuestion: "",
      icon: thematic.key,
      emoji: thematic.emoji,
      category,
      tier: "topic",
      importance: "essential",
      parentId: "center",
      relatedIds: ["center"],
      x: 0,
      y: 0,
    });

    const detailLabels = findDetailLabels(label, content);
    detailLabels.forEach((detailLabel, dIndex) => {
      const detailId = `${id}-detail-${dIndex}`;
      const detailCategory = inferCategory(detailLabel, index + dIndex + 1);
      const detailIcon = resolveThematicIcon(detailLabel, detailCategory);

      nodes.push({
        id: detailId,
        label: detailLabel,
        summary: "",
        explanation: "",
        example: "",
        reviewQuestion: "",
        icon: detailIcon.key,
        emoji: detailIcon.emoji,
        category: detailCategory,
        tier: "detail",
        importance: dIndex === 0 ? "important" : "supporting",
        parentId: id,
        relatedIds: [id, "center"],
        x: 0,
        y: 0,
      });
    });
  });

  const center = nodes.find((n) => n.id === "center");
  if (center) center.relatedIds = topicIds;

  for (const topic of nodes.filter((n) => n.tier === "topic")) {
    const childIds = nodes.filter((n) => n.parentId === topic.id).map((n) => n.id);
    topic.relatedIds = ["center", ...childIds];
  }

  return nodes;
}

async function enrichWithGemini(
  nodes: VisualMindMapNode[],
  centralTopic: string,
  content: OrganizerContent,
): Promise<VisualMindMapNode[]> {
  if (!env.geminiApiKey) return nodes;

  const iconList = MIND_MAP_ICON_KEYS.join("|");

  const prompt = `Eres un diseñador pedagógico premium de mapas mentales jurídicos para estudiantes de Derecho UNT (Perú).

Tema central: ${centralTopic}

Resumen del material:
${content.summary?.slice(0, 1800) ?? ""}

Nodos del mapa:
${nodes.map((n) => `- id: ${n.id}, tier: ${n.tier}, label: ${n.label}`).join("\n")}

Para CADA nodo devuelve contenido educativo rico. Reglas estrictas:

1. summary: UNA sola línea (máx 90 caracteres) que enseñe algo concreto. Ej: "Actuar con honestidad durante toda la relación jurídica."
2. explanation: 2 oraciones claras para el panel de estudio.
3. category: concept|principle|case|example|comparison|article|norm
4. importance: essential|important|supporting
5. icon: clave temática (${iconList}) — NO repetir iconos genéricos si hay uno más específico.
6. emoji: emoji temático (📄⚖️📚🤝🏢👤🔍📜 etc.)
7. imagePrompt: mini ilustración SIN TEXTO para Gemini. Metáfora visual clara.
8. legalReferences: artículos del CC, CP, Ley peruana relevantes
9. jurisprudence: fallos o precedentes si aplica

Devuelve SOLO JSON:
{
  "nodes": [
    {
      "id": "topic-0",
      "summary": "Actuar con honestidad durante toda la relación jurídica.",
      "category": "principle",
      "importance": "essential",
      "explanation": "...",
      "example": "ejemplo concreto Perú",
      "reviewQuestion": "pregunta de repaso",
      "icon": "good_faith",
      "emoji": "🤝",
      "imagePrompt": "Handshake illustration, legal trust, no text",
      "relatedIds": ["center"],
      "legalReferences": ["Art. 1362 CC"],
      "jurisprudence": ["STC relevante si aplica"]
    }
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.35 },
    }),
  });

  const payload = await response.json();
  if (!response.ok) return nodes;

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") return nodes;

  const enriched = parseJson(text);
  const byId = new Map(enriched.nodes?.map((n) => [n.id, n]) ?? []);

  return nodes.map((node) => {
    const extra = byId.get(node.id);
    if (!extra) return node;

    const category =
      extra.category && CATEGORIES.includes(extra.category) ? extra.category : node.category;
    const thematic = resolveThematicIcon(node.label, category, extra.icon);

    return {
      ...node,
      summary: oneLineSummary(extra.summary?.trim() || node.summary),
      explanation: extra.explanation?.trim() || node.explanation,
      example: extra.example?.trim() || node.example,
      reviewQuestion: extra.reviewQuestion?.trim() || node.reviewQuestion,
      icon: extra.icon && MIND_MAP_ICON_KEYS.includes(extra.icon as (typeof MIND_MAP_ICON_KEYS)[number])
        ? extra.icon
        : thematic.key,
      emoji: extra.emoji?.trim() || thematic.emoji,
      category,
      importance: extra.importance ?? node.importance,
      imagePrompt: extra.imagePrompt?.trim() || node.imagePrompt,
      relatedIds: extra.relatedIds?.length ? extra.relatedIds : node.relatedIds,
      legalReferences: extra.legalReferences?.filter(Boolean).length
        ? extra.legalReferences.filter(Boolean)
        : node.legalReferences,
      jurisprudence: extra.jurisprudence?.filter(Boolean).length
        ? extra.jurisprudence.filter(Boolean)
        : node.jurisprudence,
    };
  });
}

function fillFallbacks(nodes: VisualMindMapNode[], content: OrganizerContent, centralTopic: string) {
  const center = nodes.find((n) => n.id === "center");
  if (center) {
    if (!center.explanation) {
      center.explanation =
        content.simplifiedExplanation?.slice(0, 260) ||
        content.summary?.slice(0, 260) ||
        `Tema central del mapa: ${centralTopic}`;
    }
    if (!center.summary) {
      center.summary = oneLineSummary(center.explanation);
    }
    if (!center.example) {
      center.example =
        content.visualSummary?.conceptCards?.[0]?.description?.slice(0, 180) ?? "";
    }
    if (!center.reviewQuestion) {
      center.reviewQuestion =
        content.reviewBundle?.questions?.[0]?.question ??
        `¿Cuál es la idea central de ${centralTopic}?`;
    }
    if (!center.imagePrompt) {
      center.imagePrompt = `Educational legal mind map hub for "${centralTopic}", Peruvian law, professional infographic style, no text`;
    }
    const thematic = resolveThematicIcon(center.label, center.category, center.icon);
    center.icon = thematic.key;
    center.emoji = center.emoji || thematic.emoji;
  }

  for (const node of nodes) {
    if (node.tier !== "center" && !node.explanation) {
      const card = content.visualSummary?.conceptCards?.find(
        (c) =>
          c.title.toLowerCase().includes(node.label.toLowerCase()) ||
          node.label.toLowerCase().includes(c.title.toLowerCase()),
      );
      node.explanation = card?.description ?? `${node.label}: concepto clave en ${centralTopic}.`;
    }
    if (!node.summary) {
      node.summary = oneLineSummary(node.explanation);
    }
    if (!node.example) {
      node.example = `Ejemplo aplicado a ${node.label} en el contexto del derecho peruano.`;
    }
    if (!node.reviewQuestion) {
      node.reviewQuestion = `¿Cómo se relaciona ${node.label} con ${centralTopic}?`;
    }
    if (!node.imagePrompt) {
      node.imagePrompt = `Elegant legal education thumbnail for "${node.label}", ${node.category} theme, rounded illustration, no text, Peruvian law context`;
    }
    const thematic = resolveThematicIcon(node.label, node.category, node.icon);
    node.icon = thematic.key;
    node.emoji = node.emoji || thematic.emoji;
  }
}

export async function generateVisualMindMap(content: OrganizerContent): Promise<VisualMindMap> {
  const { centralTopic, branchLabels } = buildVisualMindMapStructure(content);
  let nodes = buildHierarchy(centralTopic, branchLabels, content);
  nodes = await enrichWithGemini(nodes, centralTopic, content);
  fillFallbacks(nodes, content, centralTopic);

  const layout = layoutVisualMindMap(nodes);

  return {
    centralTopic,
    generatedAt: new Date().toISOString(),
    ...layout,
  };
}

export function imagePriorityForNode(node: VisualMindMapNode): number {
  let score = 0;
  if (node.tier === "center") score += 100;
  else if (node.tier === "topic") score += 80;
  else if (node.tier === "subtopic") score += 50;
  else score += 20;

  if (node.category === "case" || node.category === "example") score += 15;
  if (node.importance === "essential") score += 10;
  return score;
}

export { MAX_VISUAL_MIND_MAP_IMAGES };
