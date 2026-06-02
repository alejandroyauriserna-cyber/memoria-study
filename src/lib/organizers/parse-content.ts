export type OrganizerFlashcard = {
  question?: string;
  answer?: string;
};

export type OrganizerContent = {
  summary?: string;
  conceptMap?: {
    title?: string;
    nodes?: string[];
  };
  hierarchy?: {
    root?: string;
    branches?: string[];
  };
  timeline?: {
    events?: Array<{ date?: string; label?: string }>;
  };
  flowChart?: {
    start?: string;
    end?: string;
    steps?: string[];
  };
  flashcards?: OrganizerFlashcard[];
  reviewQuestions?: string[];
  simplifiedExplanation?: string;
};

export function parseOrganizerContent(content: unknown): OrganizerContent {
  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as OrganizerContent;
  } catch {
    return {};
  }
}

export function hasOrganizerSections(content: OrganizerContent) {
  return Boolean(
    content.summary ||
      content.conceptMap?.nodes?.length ||
      content.conceptMap?.title ||
      content.hierarchy?.root ||
      content.hierarchy?.branches?.length ||
      content.timeline?.events?.length ||
      content.flowChart?.start ||
      content.flowChart?.end ||
      content.flowChart?.steps?.length ||
      content.flashcards?.length ||
      content.reviewQuestions?.length ||
      content.simplifiedExplanation,
  );
}
