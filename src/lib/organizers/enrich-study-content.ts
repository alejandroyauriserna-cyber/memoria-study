const MAX_CONCEPT_NODES = 14;
const MAX_KEY_CONCEPTS = 8;
const MIN_STUDY_FLASHCARDS = 8;
const MAX_STUDY_FLASHCARDS = 12;

type StudyOrganizerContent = {
  summary?: string;
  simplifiedExplanation?: string;
  conceptMap?: { title?: string; nodes?: string[] };
  hierarchy?: { root?: string; branches?: string[] };
  flowProcess?: {
    title?: string;
    nodes?: Array<{
      id?: string;
      label?: string;
      explanation?: string | null;
      legalBasis?: string | null;
      example?: string | null;
      relatedConcepts?: string[] | null;
    }>;
    edges?: Array<{ from: string; to: string; label?: string | null }>;
  };
  visualSummary?: {
    conceptCards?: Array<{ title: string; description: string }>;
    comparisons?: Array<{ title: string; left: string; right: string }>;
  };
  reviewBundle?: {
    keyConcepts?: string[];
    questions?: Array<{
      question: string;
      answer: string;
      difficulty?: "basico" | "intermedio" | "avanzado";
      type?: "abierta" | "opcion_multiple" | "verdadero_falso" | "caso_practico";
    }>;
  };
  aiAnalysis?: {
    conceptsDetected?: string[];
    relationsFound?: string[];
    studyFocus?: string;
    recommendations?: string[];
  };
  flashcards?: Array<{
    question?: string;
    answer?: string;
    difficulty?: "basico" | "intermedio" | "avanzado";
  }>;
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

function isSameConcept(a: string, b: string) {
  return normalizeConceptLabel(a).toLowerCase() === normalizeConceptLabel(b).toLowerCase();
}

function studyNodesForMap(content: StudyOrganizerContent, concepts: string[]) {
  const title = content.conceptMap?.title?.trim() ?? "";
  const root = content.hierarchy?.root?.trim() ?? "";
  return concepts.filter(
    (node) => !(title && isSameConcept(node, title)) && !(root && isSameConcept(node, root)),
  );
}

function conceptDescriptionMap(content: StudyOrganizerContent) {
  const map = new Map<string, string>();
  for (const card of content.visualSummary?.conceptCards ?? []) {
    if (card.title && card.description) {
      map.set(normalizeConceptLabel(card.title), card.description.trim());
    }
  }
  for (const card of content.flashcards ?? []) {
    if (card.question && card.answer && card.answer.length >= 10) {
      const key = normalizeConceptLabel(card.question);
      if (!map.has(key)) map.set(key, card.answer.trim());
    }
  }
  return map;
}

function fallbackDescription(concept: string, mapTitle: string, summary?: string) {
  const fromSummary = summary
    ?.split(/(?<=[.!?])\s+/)
    .find((sentence) => sentence.toLowerCase().includes(concept.toLowerCase().slice(0, 12)));
  if (fromSummary && fromSummary.length >= 20) return fromSummary.trim();
  return `Concepto clave de «${mapTitle}»: ${concept}. Repásalo en el mapa, el flujo y tus apuntes del PDF.`;
}

function difficultyAt(index: number): "basico" | "intermedio" | "avanzado" {
  if (index % 3 === 0) return "basico";
  if (index % 3 === 1) return "intermedio";
  return "avanzado";
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
  content.flashcards?.forEach((card) => {
    addConcept(seen, concepts, card.question);
    if (card.answer && card.answer.length <= 80) addConcept(seen, concepts, card.answer);
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

function synthesizeFlowProcess(
  nodes: string[],
  mapTitle: string,
  descriptions: Map<string, string>,
  summary?: string,
): NonNullable<StudyOrganizerContent["flowProcess"]> {
  const labels = nodes.slice(0, 10);
  const flowNodes = labels.map((label, index) => ({
    id: `step-${index + 1}`,
    label,
    group: null,
    explanation:
      descriptions.get(label) ??
      fallbackDescription(label, mapTitle, summary).slice(0, 280),
    legalBasis: null,
    example: `Supuesto: identifica en el PDF un caso donde intervenga «${label}».`,
    relatedConcepts: labels.filter((_, j) => j !== index).slice(0, 3),
  }));

  const edges = flowNodes.slice(0, -1).map((node, index) => ({
    from: node.id,
    to: flowNodes[index + 1]!.id,
    label: index === 0 ? "inicio" : "siguiente",
  }));

  return {
    title: `Razonamiento jurídico · ${mapTitle}`,
    nodes: flowNodes,
    edges,
  };
}

function synthesizeFlashcards(
  nodes: string[],
  mapTitle: string,
  descriptions: Map<string, string>,
  summary: string | undefined,
  existing: NonNullable<StudyOrganizerContent["flashcards"]>,
) {
  const cards = [...existing];
  const seen = new Set(
    cards.map((card) => normalizeConceptLabel(card.question ?? "").toLowerCase()).filter(Boolean),
  );

  const templates = [
    (concept: string) => `¿Qué es «${concept}» en ${mapTitle}?`,
    (concept: string) => `¿Cómo se relaciona «${concept}» con el tema principal?`,
    (concept: string) => `Menciona un supuesto donde aplique «${concept}».`,
  ];

  for (const concept of nodes) {
    if (cards.length >= MAX_STUDY_FLASHCARDS) break;

    for (const buildQuestion of templates) {
      if (cards.length >= MIN_STUDY_FLASHCARDS && cards.length >= nodes.length) break;
      const question = buildQuestion(concept);
      const key = question.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push({
        question,
        answer:
          descriptions.get(concept) ?? fallbackDescription(concept, mapTitle, summary),
        difficulty: difficultyAt(cards.length),
      });
    }
  }

  return cards.slice(0, MAX_STUDY_FLASHCARDS);
}

function synthesizeReviewQuestions(
  nodes: string[],
  mapTitle: string,
  descriptions: Map<string, string>,
  summary: string | undefined,
) {
  return nodes.slice(0, MAX_KEY_CONCEPTS).map((concept, index) => ({
    question: `Explica «${concept}» y su importancia dentro de ${mapTitle}.`,
    answer:
      descriptions.get(concept) ?? fallbackDescription(concept, mapTitle, summary),
    difficulty: difficultyAt(index),
    type: "abierta" as const,
  }));
}

/**
 * Aligns concept map, repaso, flujo, ruta, estudio y resumen con los mismos conceptos del PDF.
 */
export function enrichOrganizerStudySurfaces<T extends StudyOrganizerContent>(content: T): T {
  const concepts = collectStudyConceptLabels(content);
  if (concepts.length < 2) return content;

  const next = { ...content } as T & StudyOrganizerContent;
  const mapTitle = defaultConceptMapTitle(next);
  const descriptions = conceptDescriptionMap(next);
  const studyNodes = studyNodesForMap(next, concepts);

  if (!next.conceptMap?.nodes?.length) {
    next.conceptMap = { title: mapTitle, nodes: studyNodes.length ? studyNodes : concepts };
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
      title: next.conceptMap.title?.trim() || mapTitle,
      nodes: studyNodesForMap(next, merged),
    };
  }

  const finalNodes = next.conceptMap?.nodes?.length
    ? next.conceptMap.nodes
    : studyNodes.length
      ? studyNodes
      : concepts;

  if (!next.visualSummary?.conceptCards?.length && finalNodes.length >= 2) {
    next.visualSummary = {
      ...next.visualSummary,
      conceptCards: finalNodes.slice(0, MAX_KEY_CONCEPTS).map((title) => ({
        title,
        description:
          descriptions.get(title) ??
          fallbackDescription(title, mapTitle, next.summary),
      })),
    };
  }

  if (!next.aiAnalysis?.conceptsDetected?.length) {
    next.aiAnalysis = {
      ...next.aiAnalysis,
      conceptsDetected: finalNodes.slice(0, MAX_KEY_CONCEPTS),
      studyFocus: next.aiAnalysis?.studyFocus ?? mapTitle,
    };
  } else {
    const detected = new Set(
      next.aiAnalysis.conceptsDetected.map((item) => normalizeConceptLabel(item).toLowerCase()),
    );
    const mergedDetected = [...next.aiAnalysis.conceptsDetected];
    for (const concept of finalNodes) {
      const key = concept.toLowerCase();
      if (detected.has(key) || mergedDetected.length >= MAX_KEY_CONCEPTS) continue;
      detected.add(key);
      mergedDetected.push(concept);
    }
    next.aiAnalysis = { ...next.aiAnalysis, conceptsDetected: mergedDetected };
  }

  if (!next.hierarchy?.root || !(next.hierarchy.branches?.length ?? 0)) {
    next.hierarchy = {
      root: mapTitle,
      branches: finalNodes.slice(0, 12),
    };
  } else if ((next.hierarchy.branches?.length ?? 0) < finalNodes.length) {
    const branchSeen = new Set(
      (next.hierarchy.branches ?? []).map((b) => normalizeConceptLabel(b).toLowerCase()),
    );
    const branches = [...(next.hierarchy.branches ?? [])];
    for (const concept of finalNodes) {
      const key = concept.toLowerCase();
      if (branchSeen.has(key) || branches.length >= 12) continue;
      branchSeen.add(key);
      branches.push(concept);
    }
    next.hierarchy = { root: next.hierarchy.root || mapTitle, branches };
  }

  if (!next.flowProcess?.nodes?.length || !(next.flowProcess.edges?.length ?? 0)) {
    next.flowProcess = synthesizeFlowProcess(
      finalNodes,
      mapTitle,
      descriptions,
      next.summary,
    );
  }

  const existingFlashcards =
    next.flashcards?.filter((card) => card.question?.trim() && card.answer?.trim()) ?? [];
  if (existingFlashcards.length < MIN_STUDY_FLASHCARDS) {
    next.flashcards = synthesizeFlashcards(
      finalNodes,
      mapTitle,
      descriptions,
      next.summary,
      existingFlashcards,
    );
  }

  const review = { ...next.reviewBundle };
  const keySeen = new Set(
    (review.keyConcepts ?? []).map((item) => normalizeConceptLabel(item).toLowerCase()),
  );
  const keyConcepts = [
    ...(review.keyConcepts ?? []).map((item) => normalizeConceptLabel(item)).filter(Boolean),
  ];

  for (const concept of finalNodes) {
    const key = concept.toLowerCase();
    if (keySeen.has(key) || keyConcepts.length >= MAX_KEY_CONCEPTS) continue;
    keySeen.add(key);
    keyConcepts.push(concept);
  }

  const synthesizedQuestions = synthesizeReviewQuestions(
    finalNodes,
    mapTitle,
    descriptions,
    next.summary,
  );
  const existingQuestions = review.questions ?? [];
  const questionSeen = new Set(existingQuestions.map((q) => q.question.toLowerCase()));
  const mergedQuestions = [...existingQuestions];
  for (const item of synthesizedQuestions) {
    if (mergedQuestions.length >= MAX_KEY_CONCEPTS) break;
    if (questionSeen.has(item.question.toLowerCase())) continue;
    questionSeen.add(item.question.toLowerCase());
    mergedQuestions.push(item);
  }

  next.reviewBundle = {
    ...review,
    keyConcepts: keyConcepts.length ? keyConcepts : finalNodes.slice(0, MAX_KEY_CONCEPTS),
    questions: mergedQuestions.length ? mergedQuestions : synthesizedQuestions,
  };

  return next;
}
