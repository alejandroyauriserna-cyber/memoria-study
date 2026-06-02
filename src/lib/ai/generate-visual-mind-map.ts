import { env } from "@/lib/env";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import { layoutVisualMindMap } from "@/lib/organizers/visual-mind-map-layout";
import {
  MAX_VISUAL_MIND_MAP_IMAGES,
  type VisualMindMap,
  type VisualMindMapCategory,
  type VisualMindMapNode,
} from "@/lib/organizers/visual-mind-map-types";

const ICONS = ["scale", "book", "gavel", "users", "landmark", "lightbulb", "target", "brain"] as const;
const CATEGORIES: VisualMindMapCategory[] = [
  "concept",
  "norm",
  "principle",
  "case",
  "example",
  "comparison",
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
      explanation?: string;
      example?: string;
      reviewQuestion?: string;
      icon?: string;
      category?: VisualMindMapCategory;
      imagePrompt?: string;
      relatedIds?: string[];
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
  topicIndex: number,
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

function buildHierarchy(centralTopic: string, branchLabels: string[], content: OrganizerContent): VisualMindMapNode[] {
  const nodes: VisualMindMapNode[] = [];
  const topicIds: string[] = [];

  nodes.push({
    id: "center",
    label: centralTopic,
    explanation: "",
    example: "",
    reviewQuestion: "",
    icon: "brain",
    category: "concept",
    tier: "center",
    relatedIds: [],
    x: 0,
    y: 0,
  });

  branchLabels.slice(0, 6).forEach((label, index) => {
    const id = `topic-${index}`;
    topicIds.push(id);

    nodes.push({
      id,
      label,
      explanation: "",
      example: "",
      reviewQuestion: "",
      icon: ICONS[index % ICONS.length]!,
      category: CATEGORIES[index % CATEGORIES.length]!,
      tier: "topic",
      parentId: "center",
      relatedIds: ["center"],
      x: 0,
      y: 0,
    });

    const detailLabels = findDetailLabels(label, content, index);
    detailLabels.forEach((detailLabel, dIndex) => {
      const detailId = `${id}-detail-${dIndex}`;
      nodes.push({
        id: detailId,
        label: detailLabel,
        explanation: "",
        example: "",
        reviewQuestion: "",
        icon: ICONS[(index + dIndex + 1) % ICONS.length]!,
        category: CATEGORIES[(index + dIndex + 2) % CATEGORIES.length]!,
        tier: "detail",
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

  const prompt = `Eres un diseñador de mapas mentales jurídicos premium para estudiantes de Derecho UNT (Perú).

Tema central: ${centralTopic}

Resumen:
${content.summary?.slice(0, 1800) ?? ""}

Nodos del mapa (jerarquía center → topic → detail):
${nodes.map((n) => `- id: ${n.id}, tier: ${n.tier}, label: ${n.label}, parentId: ${n.parentId ?? "none"}`).join("\n")}

Para CADA nodo devuelve enriquecimiento visual y pedagógico.

Categorías (category):
- concept: conceptos principales (turquesa)
- norm: normas legales (azul)
- principle: principios jurídicos (verde)
- case: casos (naranja)
- example: ejemplos (morado)
- comparison: comparaciones (amarillo)

imagePrompt: ilustración miniatura SIN TEXTO, estilo Napkin/MindMeister, metáfora visual clara.
Ej: Buena Fe → apretón de manos; Contrato → documento firmado; Código Civil → libro jurídico.

Devuelve SOLO JSON:
{
  "nodes": [
    {
      "id": "topic-0",
      "category": "concept",
      "explanation": "2 oraciones claras",
      "example": "ejemplo jurídico concreto Peru",
      "reviewQuestion": "pregunta de repaso",
      "icon": "scale|book|gavel|users|landmark|lightbulb|target|brain",
      "imagePrompt": "Minimal educational illustration...",
      "relatedIds": ["center", "topic-0-detail-0"]
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
    return {
      ...node,
      explanation: extra.explanation?.trim() || node.explanation,
      example: extra.example?.trim() || node.example,
      reviewQuestion: extra.reviewQuestion?.trim() || node.reviewQuestion,
      icon: extra.icon && ICONS.includes(extra.icon as (typeof ICONS)[number]) ? extra.icon : node.icon,
      category:
        extra.category && CATEGORIES.includes(extra.category) ? extra.category : node.category,
      imagePrompt: extra.imagePrompt?.trim() || node.imagePrompt,
      relatedIds: extra.relatedIds?.length ? extra.relatedIds : node.relatedIds,
    };
  });
}

function fillFallbacks(nodes: VisualMindMapNode[], content: OrganizerContent, centralTopic: string) {
  const center = nodes.find((n) => n.id === "center");
  if (center && !center.explanation) {
    center.explanation =
      content.simplifiedExplanation?.slice(0, 260) ||
      content.summary?.slice(0, 260) ||
      `Tema central del mapa: ${centralTopic}`;
    center.example =
      content.visualSummary?.conceptCards?.[0]?.description?.slice(0, 180) ?? "";
    center.reviewQuestion =
      content.reviewBundle?.questions?.[0]?.question ??
      `¿Cuál es la idea central de ${centralTopic}?`;
    center.imagePrompt =
      center.imagePrompt ??
      `Central mind map hub illustration for ${centralTopic}, legal education, glowing turquoise, no text`;
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
    if (!node.example) {
      node.example = `Ejemplo aplicado a ${node.label} en el contexto del derecho peruano.`;
    }
    if (!node.reviewQuestion) {
      node.reviewQuestion = `¿Cómo se relaciona ${node.label} con ${centralTopic}?`;
    }
    if (!node.imagePrompt) {
      node.imagePrompt = `Mini visual memory illustration for legal concept "${node.label}", flat iconographic, soft glow, no text, ${node.category} theme`;
    }
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
  if (node.tier === "center") return 100;
  if (node.tier === "topic" || node.tier === "subtopic") return 80;
  return 20;
}

export { MAX_VISUAL_MIND_MAP_IMAGES };
