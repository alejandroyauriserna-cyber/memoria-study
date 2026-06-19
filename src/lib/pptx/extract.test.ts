import { describe, expect, it } from "vitest";
import { extractTextFromOfficeXml } from "@/lib/pptx/extract";

describe("extractTextFromOfficeXml", () => {
  it("extrae texto de etiquetas a:t", () => {
    const xml = `
      <p:sp>
        <a:t>Artículo 135</a:t>
        <a:t> de la Constitución</a:t>
      </p:sp>
    `;

    expect(extractTextFromOfficeXml(xml)).toBe("Artículo 135 de la Constitución");
  });

  it("decodifica entidades XML", () => {
    const xml = `<a:t>Derecho &amp; obligaciones</a:t>`;
    expect(extractTextFromOfficeXml(xml)).toBe("Derecho & obligaciones");
  });
});
