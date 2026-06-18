import { describe, expect, it } from "vitest";
import { buildOrganizerMatchingPairs, extractConceptFromQuestion } from "@/lib/organizers/build-matching-pairs";
import {
  createMatchingGameState,
  pickMatchingTile,
  resolveMatchingTurn,
} from "@/lib/organizers/matching-pairs-engine";

describe("buildOrganizerMatchingPairs", () => {
  it("prioriza conceptCards y flashcards", () => {
    const pairs = buildOrganizerMatchingPairs({
      visualSummary: {
        conceptCards: [
          { title: "Hermenéutica", description: "Teoría general de la interpretación jurídica." },
          { title: "Literal", description: "Sentido gramatical de las palabras de la norma." },
        ],
      },
      flashcards: [
        {
          question: "¿Qué es «Teleológica»?",
          answer: "Interpretación según la finalidad de la norma y el legislador.",
        },
      ],
    });

    expect(pairs.length).toBeGreaterThanOrEqual(3);
    expect(pairs[0]?.concept).toBe("Hermenéutica");
    expect(pairs.some((p) => p.concept === "Teleológica")).toBe(true);
  });

  it("extrae conceptos de preguntas con comillas", () => {
    expect(extractConceptFromQuestion("¿Qué es «buena fe»?")).toBe("buena fe");
  });
});

describe("matching-pairs-engine", () => {
  const pairs = [
    { id: "a", concept: "Acto jurídico", definition: "Manifestación de voluntad con efectos jurídicos." },
    { id: "b", concept: "Nulidad", definition: "Sanción que priva de efectos a un acto inválido." },
  ];

  it("detecta par correcto concepto + definición", () => {
    let state = createMatchingGameState(pairs, 2);
    const conceptTile = state.tiles.find((t) => t.pairId === "a" && t.kind === "concept")!;
    const defTile = state.tiles.find((t) => t.pairId === "a" && t.kind === "definition")!;

    state = pickMatchingTile(state, conceptTile.id);
    state = pickMatchingTile(state, defTile.id);
    expect(state.matchedPairIds).toContain("a");
    expect(state.moves).toBe(1);

    state = resolveMatchingTurn(state);
    expect(state.openTileIds).toHaveLength(0);
  });
});
