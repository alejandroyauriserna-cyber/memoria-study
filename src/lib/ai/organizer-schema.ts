import { z } from "zod";

const MAX_CONCEPT_NODES = 14;
const MAX_HIERARCHY_BRANCHES = 12;
const MAX_TIMELINE_EVENTS = 10;
const MAX_FLOW_STEPS = 10;
const MAX_FLOW_NODES = 12;
const MAX_FLASHCARDS = 12;
const MAX_REVIEW_QUESTIONS = 10;
const MAX_KEY_CONCEPTS = 8;
const MAX_EXAM_QUESTIONS = 8;

const organizerFlashcardSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(5),
  difficulty: z.enum(["basico", "intermedio", "avanzado"]).nullable(),
});

const organizerTimelineEventSchema = z.object({
  date: z.string().nullable(),
  label: z.string().min(3),
});

const flowProcessNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(2),
  group: z.string().nullable(),
  explanation: z.string().min(10).nullable(),
  legalBasis: z.string().nullable(),
  example: z.string().nullable(),
  relatedConcepts: z.array(z.string()).nullable(),
});

const flowProcessEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().nullable(),
});

const reviewQuestionSchema = z.object({
  question: z.string().min(10),
  answer: z.string().min(10),
  difficulty: z.enum(["basico", "intermedio", "avanzado"]).nullable(),
  type: z.enum(["abierta", "opcion_multiple", "verdadero_falso", "caso_practico"]).nullable(),
  options: z.array(z.string()).nullable(),
});

const examQuestionSchema = z.object({
  question: z.string().min(10),
  type: z.enum(["opcion_multiple", "verdadero_falso", "caso_practico"]),
  options: z.array(z.string()).nullable(),
  answer: z.string().min(1),
  explanation: z.string().nullable(),
});

const aiAnalysisSchema = z.object({
  conceptsDetected: z.array(z.string()).nullable(),
  relationsFound: z.array(z.string()).nullable(),
  difficulty: z.enum(["basico", "intermedio", "avanzado"]).nullable(),
  recommendations: z.array(z.string()).nullable(),
  studyFocus: z.string().nullable(),
});

/** Compatible con OpenAI Structured Outputs: required + nullable, sin .optional(). */
export const organizerContentSchema = z.object({
  summary: z.string().min(20),
  simplifiedExplanation: z.string().min(20).nullable(),
  conceptMap: z
    .object({
      title: z.string().min(3),
      nodes: z.array(z.string().min(2)).min(2).max(MAX_CONCEPT_NODES),
    })
    .nullable(),
  hierarchy: z
    .object({
      root: z.string().min(3),
      branches: z.array(z.string().min(2)).min(1).max(MAX_HIERARCHY_BRANCHES),
    })
    .nullable(),
  timeline: z
    .object({
      events: z.array(organizerTimelineEventSchema).min(1).max(MAX_TIMELINE_EVENTS),
    })
    .nullable(),
  flowChart: z
    .object({
      start: z.string().min(3),
      end: z.string().min(3),
      steps: z.array(z.string().min(3)).max(MAX_FLOW_STEPS).nullable(),
    })
    .nullable(),
  flowProcess: z
    .object({
      title: z.string().min(3),
      nodes: z.array(flowProcessNodeSchema).min(2).max(MAX_FLOW_NODES),
      edges: z.array(flowProcessEdgeSchema).min(1).max(MAX_FLOW_NODES * 2),
    })
    .nullable(),
  visualSummary: z
    .object({
      conceptCards: z
        .array(
          z.object({
            title: z.string().min(2),
            description: z.string().min(10),
          }),
        )
        .max(MAX_KEY_CONCEPTS)
        .nullable(),
      comparisons: z
        .array(
          z.object({
            title: z.string().min(2),
            left: z.string().min(5),
            right: z.string().min(5),
          }),
        )
        .max(4)
        .nullable(),
      legalTables: z
        .array(
          z.object({
            title: z.string().min(2),
            headers: z.array(z.string()).min(2).max(5),
            rows: z.array(z.array(z.string())).min(1).max(8),
          }),
        )
        .max(3)
        .nullable(),
    })
    .nullable(),
  reviewBundle: z
    .object({
      keyConcepts: z.array(z.string().min(3)).max(MAX_KEY_CONCEPTS).nullable(),
      questions: z.array(reviewQuestionSchema).max(MAX_REVIEW_QUESTIONS).nullable(),
      examQuestions: z.array(examQuestionSchema).max(MAX_EXAM_QUESTIONS).nullable(),
    })
    .nullable(),
  aiAnalysis: aiAnalysisSchema.nullable(),
  flashcards: z.array(organizerFlashcardSchema).min(2).max(MAX_FLASHCARDS).nullable(),
  reviewQuestions: z.array(z.string().min(10)).min(2).max(MAX_REVIEW_QUESTIONS).nullable(),
});

export type OrganizerContentOutput = z.infer<typeof organizerContentSchema>;

export type StoredOrganizerContent = {
  summary: string;
  simplifiedExplanation?: string;
  conceptMap?: {
    title: string;
    nodes: string[];
  };
  hierarchy?: {
    root: string;
    branches: string[];
  };
  timeline?: {
    events: Array<{ date?: string; label: string }>;
  };
  flowChart?: {
    start: string;
    end: string;
    steps?: string[];
  };
  flowProcess?: {
    title: string;
    nodes: Array<{
      id: string;
      label: string;
      group?: string;
      explanation?: string;
      legalBasis?: string;
      example?: string;
      relatedConcepts?: string[];
    }>;
    edges: Array<{ from: string; to: string; label?: string }>;
  };
  visualSummary?: {
    conceptCards?: Array<{ title: string; description: string }>;
    comparisons?: Array<{ title: string; left: string; right: string }>;
    legalTables?: Array<{ title: string; headers: string[]; rows: string[][] }>;
  };
  reviewBundle?: {
    keyConcepts?: string[];
    questions?: Array<{
      question: string;
      answer: string;
      difficulty?: "basico" | "intermedio" | "avanzado";
      type?: "abierta" | "opcion_multiple" | "verdadero_falso" | "caso_practico";
      options?: string[];
    }>;
    examQuestions?: Array<{
      question: string;
      type: "opcion_multiple" | "verdadero_falso" | "caso_practico";
      options?: string[];
      answer: string;
      explanation?: string;
    }>;
  };
  aiAnalysis?: {
    conceptsDetected?: string[];
    relationsFound?: string[];
    difficulty?: "basico" | "intermedio" | "avanzado";
    recommendations?: string[];
    studyFocus?: string;
  };
  flashcards?: Array<{ question: string; answer: string; difficulty?: "basico" | "intermedio" | "avanzado" }>;
  reviewQuestions?: string[];
};

export class MissingSummaryError extends Error {
  constructor() {
    super("El modelo no devolvió un resumen (summary) válido.");
    this.name = "MissingSummaryError";
  }
}

function truncateStrings(items: unknown, max: number): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function withNullDefaults<T extends Record<string, unknown>>(item: T, keys: Array<keyof T>) {
  const next = { ...item };
  for (const key of keys) {
    if (next[key] === undefined) {
      next[key] = null as T[keyof T];
    }
  }
  return next;
}

/** Gemini y otros proveedores omiten campos null; Zod nullable() exige null explícito. */
function coerceProviderNullables(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    return raw.map(coerceProviderNullables);
  }

  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const input = raw as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    output[key] = value === undefined ? null : coerceProviderNullables(value);
  }

  if (Array.isArray(output.questions)) {
    output.questions = output.questions.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? withNullDefaults(item as Record<string, unknown>, ["difficulty", "type", "options"])
        : item,
    );
  }

  if (Array.isArray(output.examQuestions)) {
    output.examQuestions = output.examQuestions.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? withNullDefaults(item as Record<string, unknown>, ["options", "explanation"])
        : item,
    );
  }

  if (Array.isArray(output.flashcards)) {
    output.flashcards = output.flashcards.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? withNullDefaults(item as Record<string, unknown>, ["difficulty"])
        : item,
    );
  }

  if (Array.isArray(output.nodes)) {
    output.nodes = output.nodes.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? withNullDefaults(item as Record<string, unknown>, [
            "group",
            "explanation",
            "legalBasis",
            "example",
            "relatedConcepts",
          ])
        : item,
    );
  }

  if (Array.isArray(output.edges)) {
    output.edges = output.edges.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? withNullDefaults(item as Record<string, unknown>, ["label"])
        : item,
    );
  }

  if (Array.isArray(output.events)) {
    output.events = output.events.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? withNullDefaults(item as Record<string, unknown>, ["date"])
        : item,
    );
  }

  return output;
}

/** Recorta arrays antes del parseo para tolerar respuestas que exceden límites. */
export function preprocessOrganizerPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const input = coerceProviderNullables(raw) as Record<string, unknown>;
  const output: Record<string, unknown> = { ...input };

  if (output.conceptMap && typeof output.conceptMap === "object" && !Array.isArray(output.conceptMap)) {
    const conceptMap = { ...(output.conceptMap as Record<string, unknown>) };
    const nodes = truncateStrings(conceptMap.nodes, MAX_CONCEPT_NODES);
    conceptMap.nodes = nodes.length >= 2 ? nodes : null;
    output.conceptMap =
      typeof conceptMap.title === "string" && conceptMap.title.trim() && nodes.length >= 2
        ? conceptMap
        : null;
  }

  if (output.hierarchy && typeof output.hierarchy === "object" && !Array.isArray(output.hierarchy)) {
    const hierarchy = { ...(output.hierarchy as Record<string, unknown>) };
    const branches = truncateStrings(hierarchy.branches, MAX_HIERARCHY_BRANCHES);
    hierarchy.branches = branches.length >= 1 ? branches : null;
    output.hierarchy =
      typeof hierarchy.root === "string" && hierarchy.root.trim() && branches.length >= 1
        ? hierarchy
        : null;
  }

  if (output.timeline && typeof output.timeline === "object" && !Array.isArray(output.timeline)) {
    const timeline = { ...(output.timeline as Record<string, unknown>) };
    const events = Array.isArray(timeline.events) ? timeline.events.slice(0, MAX_TIMELINE_EVENTS) : [];
    timeline.events = events.length >= 1 ? events : null;
    output.timeline = events.length >= 1 ? timeline : null;
  }

  if (output.flowChart && typeof output.flowChart === "object" && !Array.isArray(output.flowChart)) {
    const flowChart = { ...(output.flowChart as Record<string, unknown>) };
    const steps = truncateStrings(flowChart.steps, MAX_FLOW_STEPS);
    flowChart.steps = steps.length > 0 ? steps : null;
    output.flowChart =
      typeof flowChart.start === "string" &&
      flowChart.start.trim() &&
      typeof flowChart.end === "string" &&
      flowChart.end.trim()
        ? flowChart
        : null;
  }

  const flashcards = Array.isArray(output.flashcards)
    ? output.flashcards.slice(0, MAX_FLASHCARDS)
    : null;
  output.flashcards = flashcards && flashcards.length >= 2 ? flashcards : null;

  const reviewQuestions = truncateStrings(output.reviewQuestions, MAX_REVIEW_QUESTIONS);
  output.reviewQuestions = reviewQuestions.length >= 2 ? reviewQuestions : null;

  if (output.simplifiedExplanation === "" || output.simplifiedExplanation === undefined) {
    output.simplifiedExplanation = null;
  }

  return output;
}

export function parseOrganizerContent(raw: unknown): OrganizerContentOutput {
  return organizerContentSchema.parse(preprocessOrganizerPayload(raw));
}

export function normalizeOrganizerContent(content: OrganizerContentOutput): StoredOrganizerContent {
  const normalized: StoredOrganizerContent = {
    summary: content.summary.trim(),
  };

  if (content.simplifiedExplanation?.trim()) {
    normalized.simplifiedExplanation = content.simplifiedExplanation.trim();
  }

  if (content.conceptMap?.nodes?.length) {
    normalized.conceptMap = {
      title: content.conceptMap.title.trim(),
      nodes: content.conceptMap.nodes.map((node) => node.trim()).filter(Boolean).slice(0, MAX_CONCEPT_NODES),
    };
  }

  if (content.hierarchy?.root && content.hierarchy.branches?.length) {
    normalized.hierarchy = {
      root: content.hierarchy.root.trim(),
      branches: content.hierarchy.branches
        .map((branch) => branch.trim())
        .filter(Boolean)
        .slice(0, MAX_HIERARCHY_BRANCHES),
    };
  }

  if (content.timeline?.events?.length) {
    normalized.timeline = {
      events: content.timeline.events
        .slice(0, MAX_TIMELINE_EVENTS)
        .map((event) => ({
          date: event.date?.trim() || undefined,
          label: event.label.trim(),
        }))
        .filter((event) => event.label),
    };
  }

  if (content.flowChart?.start && content.flowChart.end) {
    normalized.flowChart = {
      start: content.flowChart.start.trim(),
      end: content.flowChart.end.trim(),
      steps: content.flowChart.steps?.map((step) => step.trim()).filter(Boolean).slice(0, MAX_FLOW_STEPS),
    };
  }

  if (content.flowProcess?.nodes?.length && content.flowProcess.edges?.length) {
    normalized.flowProcess = {
      title: content.flowProcess.title.trim(),
      nodes: content.flowProcess.nodes.slice(0, MAX_FLOW_NODES).map((node) => ({
        id: node.id.trim(),
        label: node.label.trim(),
        group: node.group?.trim() || undefined,
        explanation: node.explanation?.trim() || undefined,
        legalBasis: node.legalBasis?.trim() || undefined,
        example: node.example?.trim() || undefined,
        relatedConcepts: node.relatedConcepts?.map((item) => item.trim()).filter(Boolean) || undefined,
      })),
      edges: content.flowProcess.edges.slice(0, MAX_FLOW_NODES * 2).map((edge) => ({
        from: edge.from.trim(),
        to: edge.to.trim(),
        label: edge.label?.trim() || undefined,
      })),
    };
  }

  if (content.visualSummary) {
    normalized.visualSummary = {
      conceptCards: content.visualSummary.conceptCards
        ?.map((card) => ({ title: card.title.trim(), description: card.description.trim() }))
        .filter((card) => card.title && card.description)
        .slice(0, MAX_KEY_CONCEPTS),
      comparisons: content.visualSummary.comparisons
        ?.map((item) => ({
          title: item.title.trim(),
          left: item.left.trim(),
          right: item.right.trim(),
        }))
        .filter((item) => item.title && item.left && item.right)
        .slice(0, 4),
      legalTables: content.visualSummary.legalTables
        ?.map((table) => ({
          title: table.title.trim(),
          headers: table.headers.map((header) => header.trim()).filter(Boolean),
          rows: table.rows.map((row) => row.map((cell) => cell.trim())).filter((row) => row.some(Boolean)),
        }))
        .filter((table) => table.title && table.headers.length >= 2 && table.rows.length >= 1)
        .slice(0, 3),
    };
  }

  if (content.reviewBundle) {
    normalized.reviewBundle = {
      keyConcepts: content.reviewBundle.keyConcepts
        ?.map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_KEY_CONCEPTS),
      questions: content.reviewBundle.questions
        ?.slice(0, MAX_REVIEW_QUESTIONS)
        .map((item) => ({
          question: item.question.trim(),
          answer: item.answer.trim(),
          difficulty: item.difficulty ?? undefined,
          type: item.type ?? undefined,
          options: item.options?.map((option) => option.trim()).filter(Boolean) || undefined,
        }))
        .filter((item) => item.question && item.answer),
      examQuestions: content.reviewBundle.examQuestions
        ?.slice(0, MAX_EXAM_QUESTIONS)
        .map((item) => ({
          question: item.question.trim(),
          type: item.type,
          options: item.options?.map((option) => option.trim()).filter(Boolean) || undefined,
          answer: item.answer.trim(),
          explanation: item.explanation?.trim() || undefined,
        }))
        .filter((item) => item.question && item.answer),
    };
  }

  if (content.aiAnalysis) {
    normalized.aiAnalysis = {
      conceptsDetected: content.aiAnalysis.conceptsDetected
        ?.map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_KEY_CONCEPTS),
      relationsFound: content.aiAnalysis.relationsFound
        ?.map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8),
      difficulty: content.aiAnalysis.difficulty ?? undefined,
      recommendations: content.aiAnalysis.recommendations
        ?.map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5),
      studyFocus: content.aiAnalysis.studyFocus?.trim() || undefined,
    };
  }

  if (content.flashcards?.length) {
    normalized.flashcards = content.flashcards
      .slice(0, MAX_FLASHCARDS)
      .map((card) => ({
        question: card.question.trim(),
        answer: card.answer.trim(),
        difficulty: card.difficulty ?? undefined,
      }))
      .filter((card) => card.question && card.answer);
  }

  if (content.reviewQuestions?.length) {
    normalized.reviewQuestions = content.reviewQuestions
      .map((question) => question.trim())
      .filter(Boolean)
      .slice(0, MAX_REVIEW_QUESTIONS);
  }

  return normalized;
}

export function assertOrganizerHasContent(content: StoredOrganizerContent) {
  if (!content.summary?.trim() || content.summary.trim().length < 20) {
    throw new MissingSummaryError();
  }
}

export const ORGANIZER_JSON_SHAPE = `{
  "summary": "string (OBLIGATORIO, 3-6 oraciones)",
  "simplifiedExplanation": "string | null",
  "conceptMap": { "title": "string", "nodes": ["string (máx. 14)"] } | null,
  "hierarchy": { "root": "string", "branches": ["string (máx. 12)"] } | null,
  "timeline": { "events": [{ "date": "string | null", "label": "string" }] } | null,
  "flowChart": { "start": "string", "end": "string", "steps": ["string (máx. 10)"] | null } | null,
  "flowProcess": {
    "title": "string",
    "nodes": [{ "id": "string", "label": "string", "group": "string | null", "explanation": "string | null", "legalBasis": "string | null", "example": "string | null", "relatedConcepts": ["string"] | null }],
    "edges": [{ "from": "string", "to": "string", "label": "string | null" }]
  } | null,
  "visualSummary": {
    "conceptCards": [{ "title": "string", "description": "string" }] | null,
    "comparisons": [{ "title": "string", "left": "string", "right": "string" }] | null,
    "legalTables": [{ "title": "string", "headers": ["string"], "rows": [["string"]] }] | null
  } | null,
  "reviewBundle": {
    "keyConcepts": ["string"] | null,
    "questions": [{ "question": "string", "answer": "string", "difficulty": "basico|intermedio|avanzado | null", "type": "abierta|opcion_multiple|verdadero_falso|caso_practico | null", "options": ["string"] | null }] | null,
    "examQuestions": [{ "question": "string", "type": "opcion_multiple|verdadero_falso|caso_practico", "options": ["string"] | null, "answer": "string", "explanation": "string | null" }] | null
  } | null,
  "aiAnalysis": {
    "conceptsDetected": ["string"] | null,
    "relationsFound": ["string"] | null,
    "difficulty": "basico|intermedio|avanzado | null",
    "recommendations": ["string"] | null,
    "studyFocus": "string | null"
  } | null,
  "flashcards": [{ "question": "string", "answer": "string", "difficulty": "basico|intermedio|avanzado | null" }] | null,
  "reviewQuestions": ["string"] | null
}`;
