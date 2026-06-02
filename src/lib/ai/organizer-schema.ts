import { z } from "zod";

const MAX_CONCEPT_NODES = 14;
const MAX_HIERARCHY_BRANCHES = 12;
const MAX_TIMELINE_EVENTS = 10;
const MAX_FLOW_STEPS = 10;
const MAX_FLASHCARDS = 12;
const MAX_REVIEW_QUESTIONS = 10;

const organizerFlashcardSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(5),
});

const organizerTimelineEventSchema = z.object({
  date: z.string().nullable(),
  label: z.string().min(3),
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
  flashcards?: Array<{ question: string; answer: string }>;
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

/** Recorta arrays antes del parseo para tolerar respuestas que exceden límites. */
export function preprocessOrganizerPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }

  const input = raw as Record<string, unknown>;
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

  if (content.flashcards?.length) {
    normalized.flashcards = content.flashcards
      .slice(0, MAX_FLASHCARDS)
      .map((card) => ({
        question: card.question.trim(),
        answer: card.answer.trim(),
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
  "flashcards": [{ "question": "string", "answer": "string" }] | null,
  "reviewQuestions": ["string"] | null
}`;
