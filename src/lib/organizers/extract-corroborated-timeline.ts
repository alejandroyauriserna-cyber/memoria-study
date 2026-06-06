export type CorroboratedTimelineEvent = {
  date?: string;
  label: string;
};

const MAX_TIMELINE_EVENTS = 10;
const MIN_LABEL_LENGTH = 12;
const MAX_LABEL_LENGTH = 200;

const MONTHS =
  "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre";

type StudyTimelineSource = {
  summary?: string;
  simplifiedExplanation?: string;
  visualSummary?: {
    conceptCards?: Array<{ title?: string; description?: string }>;
    comparisons?: Array<{ title?: string; left?: string; right?: string }>;
    legalTables?: Array<{ title?: string; rows?: string[][] }>;
  };
  flowProcess?: {
    nodes?: Array<{
      label?: string;
      explanation?: string | null;
      legalBasis?: string | null;
      example?: string | null;
    }>;
  };
  reviewBundle?: {
    questions?: Array<{ question?: string; answer?: string }>;
  };
  flashcards?: Array<{ question?: string; answer?: string }>;
  timeline?: { events?: Array<{ date?: string | null; label?: string }> };
};

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function collectCorpusChunks(content: StudyTimelineSource): string[] {
  const chunks: string[] = [];

  if (content.summary) chunks.push(content.summary);
  if (content.simplifiedExplanation) chunks.push(content.simplifiedExplanation);

  for (const card of content.visualSummary?.conceptCards ?? []) {
    if (card.title) chunks.push(card.title);
    if (card.description) chunks.push(card.description);
  }

  for (const comparison of content.visualSummary?.comparisons ?? []) {
    if (comparison.title) chunks.push(comparison.title);
    if (comparison.left) chunks.push(comparison.left);
    if (comparison.right) chunks.push(comparison.right);
  }

  for (const table of content.visualSummary?.legalTables ?? []) {
    if (table.title) chunks.push(table.title);
    for (const row of table.rows ?? []) {
      chunks.push(row.join(" "));
    }
  }

  for (const node of content.flowProcess?.nodes ?? []) {
    if (node.label) chunks.push(node.label);
    if (node.explanation) chunks.push(node.explanation);
    if (node.legalBasis) chunks.push(node.legalBasis);
    if (node.example) chunks.push(node.example);
  }

  for (const item of content.reviewBundle?.questions ?? []) {
    if (item.question) chunks.push(item.question);
    if (item.answer) chunks.push(item.answer);
  }

  for (const card of content.flashcards ?? []) {
    if (card.question) chunks.push(card.question);
    if (card.answer) chunks.push(card.answer);
  }

  return chunks.map((chunk) => normalizeWhitespace(chunk)).filter((chunk) => chunk.length >= 8);
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((part) => normalizeWhitespace(part))
    .filter((part) => part.length >= MIN_LABEL_LENGTH);
}

function extractDatesFromSentence(sentence: string): string[] {
  const patterns: RegExp[] = [
    new RegExp(`\\b(\\d{1,2}\\s+de\\s+(?:${MONTHS})\\s+de\\s+\\d{4})\\b`, "gi"),
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/g,
    /\b(siglo\s+(?:X{1,3}|[IVXLC]+|\d{1,2}(?:\s*º)?))\b/gi,
    /\b((?:año|anos?|en|de)\s+((?:1[89]|20)\d{2}))\b/gi,
    /\b((?:1[89]|20)\d{2})\b/g,
  ];

  const dates: string[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    for (const match of sentence.matchAll(pattern)) {
      const raw = normalizeWhitespace(match[1] ?? match[0]);
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      dates.push(raw);
    }
  }

  return dates;
}

function labelFromSentence(sentence: string, date?: string) {
  let label = sentence;
  if (date) {
    label = label.replace(date, "").replace(/\s+/g, " ").trim();
  }
  label = label.replace(/^[\s,.;:-]+/, "").trim();
  if (label.length < MIN_LABEL_LENGTH) return sentence.slice(0, MAX_LABEL_LENGTH);
  return label.slice(0, MAX_LABEL_LENGTH);
}

function eventKey(event: CorroboratedTimelineEvent) {
  return `${(event.date ?? "").toLowerCase()}|${event.label.toLowerCase()}`;
}

function parseYear(date?: string) {
  if (!date) return Number.POSITIVE_INFINITY;
  const century = date.match(/siglo\s+([IVXLC]+|\d{1,2})/i);
  if (century) {
    const roman: Record<string, number> = { X: 10, XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15 };
    const token = century[1]!.toUpperCase();
    if (roman[token]) return (roman[token] - 1) * 100;
    const numeric = Number.parseInt(token, 10);
    if (!Number.isNaN(numeric)) return (numeric - 1) * 100;
  }
  const year = date.match(/\b((?:1[89]|20)\d{2})\b/);
  return year ? Number.parseInt(year[1]!, 10) : Number.POSITIVE_INFINITY;
}

function sortTimeline(events: CorroboratedTimelineEvent[]) {
  return [...events].sort((a, b) => {
    const yearDiff = parseYear(a.date) - parseYear(b.date);
    if (yearDiff !== 0) return yearDiff;
    return a.label.localeCompare(b.label, "es");
  });
}

function significantTokens(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-záéíóúñü0-9]+/i)
    .filter((token) => token.length >= 5);
}

/** Verifies that an event label and date appear in the organizer corpus (derived from the PDF). */
export function isTimelineEventCorroborated(
  event: CorroboratedTimelineEvent,
  corpusChunks: string[],
): boolean {
  const corpus = corpusChunks.join(" ").toLowerCase();
  const label = event.label.trim();
  if (label.length < MIN_LABEL_LENGTH) return false;

  const tokens = significantTokens(label);
  if (!tokens.length) return false;

  const matchedTokens = tokens.filter((token) => corpus.includes(token)).length;
  if (matchedTokens < Math.min(2, tokens.length)) return false;

  if (event.date) {
    const year = event.date.match(/\b((?:1[89]|20)\d{2})\b/);
    if (year && !corpus.includes(year[1]!)) return false;
    if (!year && !corpus.includes(event.date.toLowerCase())) return false;
  }

  return corpusChunks.some((chunk) => chunk.toLowerCase().includes(label.slice(0, 24).toLowerCase()));
}

function extractDatedEventsFromCorpus(corpusChunks: string[]): CorroboratedTimelineEvent[] {
  const seen = new Set<string>();
  const events: CorroboratedTimelineEvent[] = [];

  for (const chunk of corpusChunks) {
    for (const sentence of splitSentences(chunk)) {
      const dates = extractDatesFromSentence(sentence);
      if (!dates.length) continue;

      for (const date of dates) {
        const label = labelFromSentence(sentence, date);
        const event = { date, label };
        const key = eventKey(event);
        if (seen.has(key)) continue;

        if (!isTimelineEventCorroborated(event, corpusChunks)) continue;

        seen.add(key);
        events.push(event);
        if (events.length >= MAX_TIMELINE_EVENTS) return sortTimeline(events);
      }
    }
  }

  return sortTimeline(events);
}

function sanitizeExistingEvents(
  events: Array<{ date?: string | null; label?: string }>,
  corpusChunks: string[],
): CorroboratedTimelineEvent[] {
  return events
    .map((event) => ({
      date: event.date?.trim() || undefined,
      label: normalizeWhitespace(event.label ?? ""),
    }))
    .filter((event) => event.label.length >= MIN_LABEL_LENGTH)
    .filter((event) => isTimelineEventCorroborated(event, corpusChunks));
}

/**
 * Builds a timeline only from dates and events that can be traced to organizer text.
 * Never invents dates or milestones absent from the source material.
 */
export function extractCorroboratedTimeline(
  content: StudyTimelineSource,
): CorroboratedTimelineEvent[] {
  const corpusChunks = collectCorpusChunks(content);
  if (!corpusChunks.length) return [];

  const extracted = extractDatedEventsFromCorpus(corpusChunks);
  const existing = sanitizeExistingEvents(content.timeline?.events ?? [], corpusChunks);

  const seen = new Set<string>();
  const merged: CorroboratedTimelineEvent[] = [];

  for (const event of [...existing, ...extracted]) {
    const key = eventKey(event);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(event);
    if (merged.length >= MAX_TIMELINE_EVENTS) break;
  }

  return sortTimeline(merged);
}
