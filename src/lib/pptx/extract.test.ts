import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { extractPptxFromBuffer, extractTextFromOfficeXml } from "@/lib/pptx/extract";

const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Derecho Constitucional - Artículo 135</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>
</p:sld>`;

async function buildSamplePptxBuffer() {
  const zip = new JSZip();
  zip.file("ppt/slides/slide1.xml", slideXml);
  zip.file("ppt/notesSlides/notesSlide1.xml", slideXml);
  return zip.generateAsync({ type: "nodebuffer" });
}

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

describe("extractPptxFromBuffer", () => {
  it("lee diapositivas y notas desde un pptx mínimo", async () => {
    const buffer = await buildSamplePptxBuffer();
    const text = await extractPptxFromBuffer(buffer);

    expect(text).toContain("Diapositiva 1");
    expect(text).toContain("Artículo 135");
    expect(text).toContain("Notas del presentador");
  });

  it("tolera rutas con barras invertidas", async () => {
    const zip = new JSZip();
    zip.file("ppt\\slides\\slide1.xml", slideXml);
    const buffer = await zip.generateAsync({ type: "nodebuffer" });
    const text = await extractPptxFromBuffer(buffer);

    expect(text).toContain("Artículo 135");
  });
});
