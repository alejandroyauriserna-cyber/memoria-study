import { describe, expect, it } from "vitest";
import {
  extractCorroboratedTimeline,
  isTimelineEventCorroborated,
} from "@/lib/organizers/extract-corroborated-timeline";

describe("extractCorroboratedTimeline", () => {
  it("extracts dated events only when they appear in organizer text", () => {
    const content = {
      summary:
        "El Código Civil italiano de 1942 introdujo la interpretación sistemática. En 1984 el Código peruano incorporó criterios teleológicos.",
      visualSummary: {
        conceptCards: [
          {
            title: "Código italiano",
            description: "Reforma del derecho civil italiano promulgada en 1942.",
          },
        ],
      },
    };

    const events = extractCorroboratedTimeline(content);

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.some((event) => event.date?.includes("1942"))).toBe(true);
    expect(events.some((event) => event.date?.includes("1984"))).toBe(true);
  });

  it("drops invented timeline events that are not corroborated", () => {
    const content = {
      summary: "La interpretación jurídica analiza el sentido de las normas.",
      timeline: {
        events: [{ date: "1900", label: "Evento histórico inventado sin respaldo en el PDF" }],
      },
    };

    const events = extractCorroboratedTimeline(content);
    expect(events).toHaveLength(0);
  });

  it("keeps AI timeline events when corroborated in corpus", () => {
    const corpus = [
      "El Decreto Legislativo 728 de 1991 reguló el despido arbitrario en el Perú.",
    ];
    const event = {
      date: "1991",
      label: "Decreto Legislativo 728 reguló el despido arbitrario en el Perú",
    };

    expect(isTimelineEventCorroborated(event, corpus)).toBe(true);
  });
});
