import { z } from "zod";

const organizerFlashcardSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(5),
});

const organizerTimelineEventSchema = z.object({
  date: z.string().optional(),
  label: z.string().min(3),
});

export const organizerContentSchema = z.object({
  summary: z.string().min(20),
  simplifiedExplanation: z.string().min(20).optional(),
  conceptMap: z
    .object({
      title: z.string().min(3),
      nodes: z.array(z.string().min(2)).min(2).max(14),
    })
    .optional(),
  hierarchy: z
    .object({
      root: z.string().min(3),
      branches: z.array(z.string().min(2)).min(1).max(12),
    })
    .optional(),
  timeline: z
    .object({
      events: z.array(organizerTimelineEventSchema).min(1).max(10),
    })
    .optional(),
  flowChart: z
    .object({
      start: z.string().min(3),
      end: z.string().min(3),
      steps: z.array(z.string().min(3)).max(10).optional(),
    })
    .optional(),
  flashcards: z.array(organizerFlashcardSchema).min(2).max(12).optional(),
  reviewQuestions: z.array(z.string().min(10)).min(2).max(10).optional(),
});

export type OrganizerContentOutput = z.infer<typeof organizerContentSchema>;

export class MissingSummaryError extends Error {
  constructor() {
    super("El modelo no devolvió un resumen (summary) válido.");
    this.name = "MissingSummaryError";
  }
}

export function normalizeOrganizerContent(content: OrganizerContentOutput): OrganizerContentOutput {
  const normalized: OrganizerContentOutput = {
    summary: content.summary.trim(),
  };
  if (content.simplifiedExplanation?.trim()) {
    normalized.simplifiedExplanation = content.simplifiedExplanation.trim();
  }
  if (content.conceptMap?.nodes?.length) {
    normalized.conceptMap = {
      title: content.conceptMap.title.trim(),
      nodes: content.conceptMap.nodes.map((node) => node.trim()).filter(Boolean),
    };
  }
  if (content.hierarchy?.root && content.hierarchy.branches?.length) {
    normalized.hierarchy = {
      root: content.hierarchy.root.trim(),
      branches: content.hierarchy.branches.map((branch) => branch.trim()).filter(Boolean),
    };
  }
  if (content.timeline?.events?.length) {
    normalized.timeline = {
      events: content.timeline.events
        .map((event) => ({
          date: event.date?.trim(),
          label: event.label.trim(),
        }))
        .filter((event) => event.label),
    };
  }
  if (content.flowChart?.start && content.flowChart.end) {
    normalized.flowChart = {
      start: content.flowChart.start.trim(),
      end: content.flowChart.end.trim(),
      steps: content.flowChart.steps?.map((step) => step.trim()).filter(Boolean),
    };
  }
  if (content.flashcards?.length) {
    normalized.flashcards = content.flashcards
      .map((card) => ({
        question: card.question.trim(),
        answer: card.answer.trim(),
      }))
      .filter((card) => card.question && card.answer);
  }
  if (content.reviewQuestions?.length) {
    normalized.reviewQuestions = content.reviewQuestions.map((q) => q.trim()).filter(Boolean);
  }

  return normalized;
}

export function assertOrganizerHasContent(content: OrganizerContentOutput) {
  if (!content.summary?.trim() || content.summary.trim().length < 20) {
    throw new MissingSummaryError();
  }
}

export const ORGANIZER_JSON_SHAPE = `{
  "summary": "string (OBLIGATORIO, 3-6 oraciones)",
  "simplifiedExplanation": "string (opcional)",
  "conceptMap": { "title": "string", "nodes": ["string"] },
  "hierarchy": { "root": "string", "branches": ["string"] },
  "timeline": { "events": [{ "date": "string opcional", "label": "string" }] },
  "flowChart": { "start": "string", "end": "string", "steps": ["string"] },
  "flashcards": [{ "question": "string", "answer": "string" }],
  "reviewQuestions": ["string"]
}`;
