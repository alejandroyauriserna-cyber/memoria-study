const MAX_CONCEPT_NODES = 14;
const MAX_KEY_CONCEPTS = 8;

type StudyOrganizerContent = {
  conceptMap?: { title?: string; nodes?: string[] };
  hierarchy?: { root?: string; branches?: string[] };
  flowProcess?: { title?: string; nodes?: Array<{ label?: string }> };
  visualSummary?: { conceptCards?: Array<{ title: string; description: string }> };
  reviewBundle?: { keyConcepts?: string[] };
  aiAnalysis?: { conceptsDetected?: string[]; studyFocus?: string };
  flashcards?: Array<{ question?: string; answer?: string }>;
};

function normalizeConceptLabel(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

function addConcept(seen: Set<string>, list: string[], raw?: string | null) {
  const label = raw ? normalizeConceptLabel(raw) : "";
  if (label.length < 3) return;
  const key = label.toLowerCase();
  if (seen.has(key)) return;
  seen.add(key);
  list.push(label);
}

/** Unique study concepts from every organizer surface (map, repaso, resumen visual, IA). */
export function collectStudyConceptLabels(content: StudyOrganizerContent): string[] {
  const seen = new Set<string>();
  const concepts: string[] = [];

  content.conceptMap?.nodes?.forEach((node) => addConcept(seen, concepts, node));
  content.reviewBundle?.keyConcepts?.forEach((node) => addConcept(seen, concepts, node));
  content.visualSummary?.conceptCards?.forEach((card) => addConcept(seen, concepts, card.title));
  content.aiAnalysis?.conceptsDetected?.forEach((node) => addConcept(seen, concepts, node));
  content.flowProcess?.nodes?.forEach((node) => addConcept(seen, concepts, node.label));
  content.hierarchy?.branches?.forEach((node) => addConcept(seen, concepts, node));
  addConcept(seen, concepts, content.hierarchy?.root);
  content.flashcards?.forEach((card) => {
    addConcept(seen, concepts, card.question);
    addConcept(seen, concepts, card.answer);
  });

  return concepts.slice(0, MAX_CONCEPT_NODES);
}

function defaultConceptMapTitle(content: StudyOrganizerContent) {
  const title =
    content.conceptMap?.title?.trim() ||
    content.hierarchy?.root?.trim() ||
    content.flowProcess?.title?.trim() ||
    content.aiAnalysis?.studyFocus?.trim();

  if (title && title.length >= 3) return title;
  return "Mapa conceptual del material";
}

/**
 * Aligns concept map and repaso with visual/IA content so the card preview
 * matches what the student can actually study.
 */
export function enrichOrganizerStudySurfaces<T extends StudyOrganizerContent>(content: T): T {
  const concepts = collectStudyConceptLabels(content);
  if (concepts.length < 2) return content;

  const next = { ...content } as T & StudyOrganizerContent;

  if (!next.conceptMap?.nodes?.length) {
    next.conceptMap = {
      title: defaultConceptMapTitle(content),
      nodes: concepts,
    };
  } else {
    const existing = new Set(
      next.conceptMap.nodes.map((node) => normalizeConceptLabel(node).toLowerCase()),
    );
    const merged = [...next.conceptMap.nodes.map((node) => normalizeConceptLabel(node)).filter(Boolean)];
    for (const concept of concepts) {
      const key = concept.toLowerCase();
      if (existing.has(key) || merged.length >= MAX_CONCEPT_NODES) continue;
      existing.add(key);
      merged.push(concept);
    }
    next.conceptMap = {
      title: next.conceptMap.title?.trim() || defaultConceptMapTitle(content),
      nodes: merged,
    };
  }

  const review = { ...next.reviewBundle };
  const keySeen = new Set(
    (review.keyConcepts ?? []).map((item) => normalizeConceptLabel(item).toLowerCase()),
  );
  const keyConcepts = [
    ...(review.keyConcepts ?? []).map((item) => normalizeConceptLabel(item)).filter(Boolean),
  ];

  for (const concept of concepts) {
    const key = concept.toLowerCase();
    if (keySeen.has(key) || keyConcepts.length >= MAX_KEY_CONCEPTS) continue;
    keySeen.add(key);
    keyConcepts.push(concept);
  }

  if (keyConcepts.length) {
    next.reviewBundle = { ...review, keyConcepts };
  }

  return next;
}
