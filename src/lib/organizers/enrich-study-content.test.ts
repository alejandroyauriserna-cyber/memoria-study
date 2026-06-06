import { describe, expect, it } from "vitest";
import {
  collectStudyConceptLabels,
  enrichOrganizerStudySurfaces,
} from "@/lib/organizers/enrich-study-content";

describe("enrichOrganizerStudySurfaces", () => {
  it("builds concept map and repaso from visual summary without double counting", () => {
    const input = {
      summary: "Resumen del tema de interpretación jurídica en el material.",
      visualSummary: {
        conceptCards: [
          { title: "Hermenéutica", description: "Teoría general de la interpretación." },
          { title: "Literal", description: "Sentido gramatical de la norma." },
          { title: "Sistemática", description: "Interpretación en el conjunto del ordenamiento." },
          { title: "Teleológica", description: "Finalidad de la norma." },
        ],
      },
      aiAnalysis: {
        conceptsDetected: ["Hermenéutica", "Literal", "Finalismo", "Integración"],
      },
      reviewBundle: {
        keyConcepts: ["Hermenéutica", "Literal"],
      },
    };

    const enriched = enrichOrganizerStudySurfaces(input);

    expect(collectStudyConceptLabels(enriched).length).toBeGreaterThanOrEqual(5);
    expect(enriched.conceptMap?.nodes?.length).toBeGreaterThanOrEqual(5);
    expect(enriched.reviewBundle?.keyConcepts?.length).toBeGreaterThanOrEqual(5);
  });

  it("synthesizes flow, hierarchy, flashcards and identified topics when missing", () => {
    const input = {
      summary: "La interpretación jurídica comprende métodos literal, sistemático y teleológico.",
      conceptMap: {
        title: "Interpretación jurídica",
        nodes: ["Literal", "Sistemática", "Teleológica", "Histórica", "Integración"],
      },
      visualSummary: {
        conceptCards: [
          { title: "Literal", description: "Sentido de las palabras de la norma." },
          { title: "Sistemática", description: "Norma en el conjunto del ordenamiento." },
          { title: "Teleológica", description: "Finalidad perseguida por el legislador." },
          { title: "Histórica", description: "Contexto de elaboración de la norma." },
          { title: "Integración", description: "Complemento de lagunas normativas." },
        ],
      },
    };

    const enriched = enrichOrganizerStudySurfaces(input);

    expect(enriched.hierarchy?.root).toBe("Interpretación jurídica");
    expect(enriched.hierarchy?.branches?.length).toBeGreaterThanOrEqual(5);
    expect(enriched.flowProcess?.nodes?.length).toBeGreaterThanOrEqual(4);
    expect(enriched.flowProcess?.edges?.length).toBeGreaterThanOrEqual(3);
    expect(enriched.flashcards?.length).toBeGreaterThanOrEqual(8);
    expect(enriched.aiAnalysis?.conceptsDetected?.length).toBeGreaterThanOrEqual(5);
    expect(enriched.reviewBundle?.questions?.length).toBeGreaterThanOrEqual(5);
  });

  it("adds corroborated timeline when dates exist in summary", () => {
    const input = {
      summary:
        "El Código Civil italiano de 1942 y el Código peruano de 1984 son referencias para la interpretación contractual.",
      conceptMap: {
        title: "Interpretación",
        nodes: ["Literal", "Sistemática", "Teleológica", "Histórica"],
      },
    };

    const enriched = enrichOrganizerStudySurfaces(input);

    expect(enriched.timeline?.events?.length).toBeGreaterThanOrEqual(2);
  });
});
