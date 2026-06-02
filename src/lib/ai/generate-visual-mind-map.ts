import { env } from "@/lib/env";
import type { OrganizerContent } from "@/lib/organizers/parse-content";
import {
  MAX_VISUAL_MIND_MAP_IMAGES,
  type VisualMindMap,
  type VisualMindMapNode,
} from "@/lib/organizers/visual-mind-map-types";

const ICONS = ["scale", "book", "gavel", "users", "landmark", "lightbulb", "target", "brain"] as const;

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
      icon?: string;
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
    .slice(0, 10);

  return {
    centralTopic,
    branchLabels: merged.length >= 2 ? merged : ["Concepto clave 1", "Concepto clave 2", "Concepto clave 3"],
  };
}

function layoutRadial(centralTopic: string, labels: string[]): VisualMindMap {
  const cx = 480;
  const cy = 360;
  const radius = Math.max(180, 130 + labels.length * 12);

  const centerNode: VisualMindMapNode = {
    id: "center",
    label: centralTopic,
    explanation: "",
    icon: "brain",
    relatedIds: labels.map((_, i) => `branch-${i}`),
    x: cx,
    y: cy,
    ring: "center",
  };

  const branchNodes: VisualMindMapNode[] = labels.map((label, index) => {
    const angle = (index / labels.length) * Math.PI * 2 - Math.PI / 2;
    return {
      id: `branch-${index}`,
      label,
      explanation: "",
      icon: ICONS[index % ICONS.length]!,
      relatedIds: ["center"],
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      ring: "branch",
    };
  });

  const pad = 120;
  const xs = [cx, ...branchNodes.map((n) => n.x)];
  const ys = [cy, ...branchNodes.map((n) => n.y)];

  return {
    centralTopic,
    generatedAt: new Date().toISOString(),
    nodes: [centerNode, ...branchNodes],
    width: Math.max(800, Math.max(...xs) - Math.min(...xs) + pad * 2),
    height: Math.max(600, Math.max(...ys) - Math.min(...ys) + pad * 2),
  };
}

async function enrichWithGemini(
  map: VisualMindMap,
  content: OrganizerContent,
): Promise<VisualMindMap> {
  if (!env.geminiApiKey) return map;

  const branchNodes = map.nodes.filter((n) => n.ring === "branch");
  const prompt = `Eres diseñador de mapas mentales jurídicos para estudiantes de Derecho UNT (Perú).

Tema central: ${map.centralTopic}

Resumen del material:
${content.summary?.slice(0, 1500) ?? ""}

Nodos a enriquecer:
${branchNodes.map((n) => `- id: ${n.id}, label: ${n.label}`).join("\n")}

Devuelve SOLO JSON:
{
  "nodes": [
    {
      "id": "branch-0",
      "explanation": "explicación breve 1-2 oraciones",
      "icon": "scale|book|gavel|users|landmark|lightbulb|target|brain",
      "imagePrompt": "Minimal flat educational illustration for [concept], legal study, cyan and dark blue palette, no text, iconographic",
      "relatedIds": ["center", "branch-1"]
    }
  ]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    }),
  });

  const payload = await response.json();
  if (!response.ok) return map;

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") return map;

  const enriched = parseJson(text);
  const byId = new Map(enriched.nodes?.map((n) => [n.id, n]) ?? []);

  return {
    ...map,
    nodes: map.nodes.map((node) => {
      const extra = byId.get(node.id);
      if (!extra) return node;
      return {
        ...node,
        explanation: extra.explanation?.trim() || node.explanation,
        icon: extra.icon && ICONS.includes(extra.icon as (typeof ICONS)[number]) ? extra.icon : node.icon,
        imagePrompt: extra.imagePrompt?.trim() || node.imagePrompt,
        relatedIds: extra.relatedIds?.length ? extra.relatedIds : node.relatedIds,
      };
    }),
  };
}

export async function generateVisualMindMap(content: OrganizerContent): Promise<VisualMindMap> {
  const { centralTopic, branchLabels } = buildVisualMindMapStructure(content);
  let map = layoutRadial(centralTopic, branchLabels.slice(0, 8));
  map = await enrichWithGemini(map, content);

  const center = map.nodes.find((n) => n.id === "center");
  if (center && !center.explanation) {
    center.explanation =
      content.simplifiedExplanation?.slice(0, 220) ||
      content.summary?.slice(0, 220) ||
      `Tema central: ${centralTopic}`;
  }

  for (const node of map.nodes) {
    if (node.ring === "branch" && !node.explanation) {
      const card = content.visualSummary?.conceptCards?.find(
        (c) =>
          c.title.toLowerCase().includes(node.label.toLowerCase()) ||
          node.label.toLowerCase().includes(c.title.toLowerCase()),
      );
      node.explanation = card?.description ?? `Concepto clave: ${node.label}`;
    }
    if (!node.imagePrompt) {
      node.imagePrompt = `Educational legal concept illustration: ${node.label}, minimal vector, cyan glow, dark background, no text`;
    }
  }

  return map;
}

export { MAX_VISUAL_MIND_MAP_IMAGES };
