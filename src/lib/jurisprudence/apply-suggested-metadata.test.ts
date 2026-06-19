import { describe, expect, it } from "vitest";
import {
  buildOrganoFromSuggested,
  markAiFilledFields,
  suggestedToContributionForm,
} from "@/lib/jurisprudence/apply-suggested-metadata";
import type { JurisprudenceSuggestedMetadata } from "@/types/jurisprudence-ingest";

const sample: JurisprudenceSuggestedMetadata = {
  title: "Casación 1465-2007-Lima",
  tipo: "casacion",
  year: 2007,
  organo: "Corte Suprema de Justicia de la República",
  sala: "Sala Civil Permanente",
  materia: "civil",
  submateria: "Simulación absoluta",
  keywords: ["simulación", "acto jurídico"],
  summary: "La Corte Suprema analiza la simulación absoluta en contratos.",
  expediente: "1465-2007-Lima",
};

describe("suggestedToContributionForm", () => {
  it("maps suggested metadata to form fields", () => {
    const form = suggestedToContributionForm(sample);
    expect(form.title).toBe(sample.title);
    expect(form.expediente).toBe("1465-2007-Lima");
    expect(form.keywords).toBe("simulación, acto jurídico");
    expect(form.year).toBe("2007");
  });
});

describe("buildOrganoFromSuggested", () => {
  it("joins sala, organo and distrito", () => {
    expect(buildOrganoFromSuggested(sample)).toContain("Sala Civil Permanente");
    expect(buildOrganoFromSuggested(sample)).toContain("Corte Suprema");
  });
});

describe("markAiFilledFields", () => {
  it("marks fields with confidence >= 0.5", () => {
    const filled = markAiFilledFields({
      title: 0.9,
      summary: 0.4,
      materia: 0.8,
    });
    expect(filled.title).toBe(true);
    expect(filled.summary).toBe(false);
    expect(filled.materia).toBe(true);
  });
});
