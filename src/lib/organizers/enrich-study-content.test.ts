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
});
