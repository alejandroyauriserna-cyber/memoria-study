import { describe, expect, it } from "vitest";
import {
  normalizeTipo,
  pickJurisprudenceCatalogSample,
  reconcileSuggestedTipo,
  textSuggestsCasacion,
} from "@/lib/jurisprudence/ai-extract-metadata";

describe("normalizeTipo", () => {
  it("maps sentencia de casación to casacion", () => {
    expect(normalizeTipo("sentencia de casación")).toBe("casacion");
    expect(normalizeTipo("Sentencia de Casacion")).toBe("casacion");
  });

  it("keeps plain sentencia as sentencia", () => {
    expect(normalizeTipo("sentencia")).toBe("sentencia");
    expect(normalizeTipo("Sentencia de primera instancia")).toBe("sentencia");
  });

  it("maps casacion explicitly", () => {
    expect(normalizeTipo("casacion")).toBe("casacion");
  });
});

describe("textSuggestsCasacion", () => {
  it("detects casación in title", () => {
    expect(
      textSuggestsCasacion(
        "Sentencia de Casación sobre la Acción Pauliana y la Ineficacia de Actos Jurídicos Onerosos",
      ),
    ).toBe(true);
  });

  it("detects recurso de casación in summary", () => {
    expect(
      textSuggestsCasacion(
        "Fallo civil",
        "La Corte Suprema resuelve un recurso de casación sobre la acción pauliana.",
      ),
    ).toBe(true);
  });

  it("returns false for ordinary first-instance sentences", () => {
    expect(
      textSuggestsCasacion(
        "Sentencia N.º 12-2020",
        "El juzgado civil resolvió el fondo del litigio sobre obligaciones.",
      ),
    ).toBe(false);
  });
});

describe("reconcileSuggestedTipo", () => {
  it("corrects sentencia to casacion when title mentions casación", () => {
    expect(
      reconcileSuggestedTipo({
        title: "Sentencia de Casación sobre la Acción Pauliana",
        tipo: "sentencia",
        summary:
          "La Corte Suprema analiza la procedencia de la acción pauliana y la ineficacia del acto jurídico.",
        asuntoPrincipal: "Acción pauliana",
        organo: "Corte Suprema de Justicia de la República",
        keywords: ["acción pauliana", "acto jurídico"],
      }),
    ).toBe("casacion");
  });

  it("leaves casacion unchanged", () => {
    expect(
      reconcileSuggestedTipo({
        title: "Casación 1465-2007-Lima",
        tipo: "casacion",
        summary: "La Corte Suprema analiza la simulación absoluta.",
        organo: "Corte Suprema de Justicia de la República",
        keywords: ["simulación"],
      }),
    ).toBe("casacion");
  });

  it("leaves ordinary sentencia unchanged", () => {
    expect(
      reconcileSuggestedTipo({
        title: "Sentencia sobre obligaciones de dar suma de dinero",
        tipo: "sentencia",
        summary: "El juzgado especializado resolvió la demanda de cumplimiento.",
        organo: "Primer Juzgado Civil de Lima",
        keywords: ["obligaciones"],
      }),
    ).toBe("sentencia");
  });
});

describe("pickJurisprudenceCatalogSample", () => {
  it("includes head and tail for casación, omitting the middle", () => {
    const head = "SENTENCIA DE CASACIÓN\nASUNTO: Acción pauliana y simulación absoluta.\n";
    const middle = "M".repeat(20_000);
    const tail = "RESOLUCIÓN: SE CONFIRMA la sentencia apelada en el extremo impugnado.";
    const sample = pickJurisprudenceCatalogSample(`${head}${middle}${tail}`, "casacion.pdf");

    expect(sample).toMatch(/CASACIÓN/i);
    expect(sample).toMatch(/ASUNTO: Acción pauliana/i);
    expect(sample).toMatch(/RESOLUCIÓN: SE CONFIRMA/i);
    expect(sample).toMatch(/desarrollo omitido/i);
    expect(sample.length).toBeLessThan(head.length + middle.length + tail.length);
  });

  it("keeps samples within the catalog char budget", () => {
    const longText = `${"INICIO ".repeat(800)}${"MEDIO ".repeat(4_000)}${"FINAL ".repeat(800)}`;
    const sample = pickJurisprudenceCatalogSample(longText, "doc.pdf", 4_500);
    expect(sample.length).toBeLessThan(6_500);
    expect(sample).toMatch(/INICIO/);
    expect(sample).toMatch(/FINAL/);
  });
});
