import { describe, expect, it } from "vitest";
import {
  extractComparisonData,
  extractConceptMapData,
  extractMindMapData,
  extractTimelineData,
} from "@/lib/organizers/visual-ai-diagram/extract-diagram-data";
import { renderStructuredVisualAi } from "@/lib/organizers/visual-ai-diagram/render-structured-visual-ai";
import type { OrganizerContent } from "@/lib/organizers/parse-content";

const sampleContent: OrganizerContent = {
  summary: "Estudio sobre nulidad y anulabilidad en el Código Civil peruano.",
  conceptMap: {
    title: "Nulidad y Anulabilidad",
    nodes: ["Nulidad absoluta", "Nulidad relativa", "Prescripción", "Convalidación"],
  },
  hierarchy: {
    root: "Nulidad y Anulabilidad",
    branches: ["Nulidad absoluta", "Nulidad relativa", "Efectos"],
  },
  timeline: {
    events: [
      { date: "1984", label: "Código Civil vigente" },
      { date: "2010", label: "Jurisprudencia unificada" },
    ],
  },
  visualSummary: {
    comparisons: [
      {
        title: "Nulidad vs Anulabilidad",
        left: "Ineficacia radical e ipso iure",
        right: "Ineficacia anulable a instancia de parte",
      },
    ],
  },
};

describe("structured visual ai", () => {
  it("extracts concept map nodes and edges from organizer", () => {
    const data = extractConceptMapData(sampleContent);
    expect(data.nodes.length).toBeGreaterThan(2);
    expect(data.edges.length).toBeGreaterThan(1);
  });

  it("renders SVG diagrams with exact organizer labels", () => {
    for (const formatId of ["conceptMap", "mindMap", "timeline", "comparisonTable"] as const) {
      const { svg, description } = renderStructuredVisualAi(formatId, sampleContent);
      expect(svg).toContain("<svg");
      expect(svg).toContain("Nulidad");
      expect(description.length).toBeGreaterThan(10);
    }
  });

  it("renders timeline from events", () => {
    const data = extractTimelineData(sampleContent);
    expect(data.events).toHaveLength(2);
    const { svg } = renderStructuredVisualAi("timeline", sampleContent);
    expect(svg).toContain("1984");
    expect(svg).toContain("Código Civil vigente");
  });

  it("renders comparison from visualSummary", () => {
    const data = extractComparisonData(sampleContent);
    expect(data.rows[0]?.left).toContain("Ineficacia radical");
    const { svg } = renderStructuredVisualAi("comparisonTable", sampleContent);
    expect(svg).toContain("Ineficacia radical");
  });

  it("renders mind map branches", () => {
    const data = extractMindMapData(sampleContent);
    expect(data.branches.length).toBeGreaterThan(0);
    const { svg } = renderStructuredVisualAi("mindMap", sampleContent);
    expect(svg).toContain("MEMORIASTUDY");
  });
});
