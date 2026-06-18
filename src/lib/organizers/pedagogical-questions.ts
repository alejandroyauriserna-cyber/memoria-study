export type PedagogicalDifficulty = "basico" | "intermedio" | "avanzado";
export type PedagogicalQuestionType =
  | "abierta"
  | "opcion_multiple"
  | "verdadero_falso"
  | "caso_practico";

export type PedagogicalReviewQuestion = {
  question: string;
  answer: string;
  difficulty: PedagogicalDifficulty;
  type: PedagogicalQuestionType;
};

export type PedagogicalFlashcard = {
  question: string;
  answer: string;
  difficulty: PedagogicalDifficulty;
};

function pickPeerConcept(concepts: string[], current: string, offset: number): string | null {
  const others = concepts.filter((c) => c.toLowerCase() !== current.toLowerCase());
  if (!others.length) return null;
  return others[offset % others.length] ?? null;
}

function clip(text: string, max = 320): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/**
 * Preguntas de repaso con variedad pedagógica (recuperación, aplicación, distinción, examen).
 * Evita plantillas repetitivas del tipo «Explica X y su importancia».
 */
export function buildPedagogicalReviewQuestions(input: {
  concepts: string[];
  mapTitle: string;
  descriptions: Map<string, string>;
  summary?: string;
  maxQuestions?: number;
}): PedagogicalReviewQuestion[] {
  const max = input.maxQuestions ?? 16;
  const { concepts, mapTitle, descriptions, summary } = input;
  const seen = new Set<string>();
  const out: PedagogicalReviewQuestion[] = [];

  function push(item: PedagogicalReviewQuestion) {
    const key = item.question.toLowerCase();
    if (seen.has(key) || out.length >= max) return;
    seen.add(key);
    out.push(item);
  }

  for (let i = 0; i < concepts.length && out.length < max; i += 1) {
    const concept = concepts[i]!;
    const answer =
      descriptions.get(concept) ??
      clip(
        summary?.split(/(?<=[.!?])\s+/).find((s) => s.toLowerCase().includes(concept.toLowerCase().slice(0, 10))) ??
          `Repasa «${concept}» en el mapa, el flujo y el PDF fuente de ${mapTitle}.`,
      );
    const peer = pickPeerConcept(concepts, concept, i);

    push({
      question: `Sin mirar apuntes: ¿cuál es la definición jurídica de «${concept}» según el material?`,
      answer,
      difficulty: "basico",
      type: "abierta",
    });

    if (out.length >= max) break;

    push({
      question: `Caso práctico: plantea un supuesto breve donde intervenga «${concept}» y explica la solución jurídica.`,
      answer: clip(
        `${answer} Aplica el concepto identificando hechos relevantes, norma aplicable y conclusión.`,
        400,
      ),
      difficulty: "intermedio",
      type: "caso_practico",
    });

    if (out.length >= max) break;

    if (peer) {
      push({
        question: `¿En qué se diferencia «${concept}» de «${peer}»? Señala requisitos, efectos o ámbito.`,
        answer: clip(
          `«${concept}»: ${answer}. Contrasta con «${peer}» usando el PDF — no los confundas en examen.`,
          420,
        ),
        difficulty: "avanzado",
        type: "abierta",
      });
    }

    if (out.length >= max) break;

    push({
      question: `¿Por qué «${concept}» suele evaluarse en examen de ${mapTitle}? Indica un error frecuente al responderlo.`,
      answer: clip(
        `${answer} Error típico: definirlo sin ejemplo del PDF o mezclarlo con conceptos vecinos sin distinguir efectos.`,
        400,
      ),
      difficulty: i % 2 === 0 ? "intermedio" : "avanzado",
      type: "abierta",
    });
  }

  return out;
}

/**
 * Flashcards con enfoque de recuperación activa (no solo «¿Qué es X?»).
 */
export function buildPedagogicalFlashcards(input: {
  concepts: string[];
  mapTitle: string;
  descriptions: Map<string, string>;
  summary?: string;
  existing: PedagogicalFlashcard[];
  minCards?: number;
  maxCards?: number;
}): PedagogicalFlashcard[] {
  const minCards = input.minCards ?? 10;
  const maxCards = input.maxCards ?? 16;
  const cards = [...input.existing];
  const seen = new Set(
    cards.map((c) => c.question.trim().toLowerCase()).filter(Boolean),
  );

  const builders: Array<(concept: string, peer: string | null) => PedagogicalFlashcard | null> = [
    (concept) => ({
      question: `Recuperación: define «${concept}» en una frase jurídica precisa.`,
      answer:
        input.descriptions.get(concept) ??
        `Concepto central de ${input.mapTitle}. Verifica la definición en el PDF.`,
      difficulty: "basico",
    }),
    (concept) => ({
      question: `Aplicación: ¿cómo se manifiesta «${concept}» en un ejemplo del documento?`,
      answer:
        input.descriptions.get(concept) ??
        `Busca en el PDF un supuesto o doctrina donde aparezca «${concept}».`,
      difficulty: "intermedio",
    }),
    (concept, peer) =>
      peer
        ? {
            question: `Distinción: ¿«${concept}» y «${peer}» son lo mismo? ¿Por qué?`,
            answer: `No necesariamente. «${concept}»: ${
              input.descriptions.get(concept) ?? "repasa en el mapa"
            }. Contrasta con «${peer}».`,
            difficulty: "avanzado",
          }
        : null,
    (concept) => ({
      question: `Examen oral: si el profesor pregunta por «${concept}», ¿qué tres ideas no puedes omitir?`,
      answer: clip(
        `${input.descriptions.get(concept) ?? `«${concept}» en ${input.mapTitle}`}. Incluye definición, fundamento del PDF y ejemplo breve.`,
        360,
      ),
      difficulty: "intermedio",
    }),
    (concept) => ({
      question: `Verificación: cita un fragmento o idea del PDF que sustente «${concept}».`,
      answer:
        input.descriptions.get(concept) ??
        `Localiza en el material la sección donde se desarrolla «${concept}».`,
      difficulty: "basico",
    }),
  ];

  for (let i = 0; i < input.concepts.length; i += 1) {
    if (cards.length >= maxCards) break;
    const concept = input.concepts[i]!;
    const peer = pickPeerConcept(input.concepts, concept, i);

    for (const build of builders) {
      if (cards.length >= maxCards) break;
      if (cards.length >= minCards && cards.length >= input.concepts.length * 2) break;
      const card = build(concept, peer);
      if (!card) continue;
      const key = card.question.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push(card);
    }
  }

  return cards.slice(0, maxCards);
}
