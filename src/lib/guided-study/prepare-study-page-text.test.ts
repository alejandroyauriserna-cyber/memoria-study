import { describe, expect, it } from "vitest";
import {
  cleanPageTextForStudy,
  isBibliographicSentence,
  looksLikeBibliography,
} from "@/lib/guided-study/prepare-study-page-text";

describe("cleanPageTextForStudy", () => {
  it("removes footnote bibliography and keeps doctrinal body text", () => {
    const raw = `
      CAPÍTULO VI: Elementos accidentales del acto jurídico. Los elementos accidentales
      son el modo, el plazo, la condición y el título. Modifican los efectos del acto
      sin alterar su esencia jurídica ni su existencia.
      (1) Emilio BETTI, Teoria generale del negocio giuridico, Torino, 1959.
      (2) En este sentido, Francesco GALGANO, Diritto civile e commerciale, Milán, 1996.
      (3) Luis DIEZ-PICAZO y Antonio GULLÓN, Sistema de Derecho Civil, Madrid, 1992.
      (4) Francesco GAZZONI, Manuale di Diritto Privato, Napoli, 2006.
    `;

    const cleaned = cleanPageTextForStudy(raw);

    expect(cleaned).toMatch(/elementos accidentales/i);
    expect(cleaned).toMatch(/modo|plazo|condici[oó]n/i);
    expect(cleaned).not.toMatch(/GAZZONI|DIEZ-PICAZO|Manuale di Diritto Privato/i);
    expect(looksLikeBibliography(cleaned)).toBe(false);
  });

  it("detects inline publisher citations without numbered footnotes", () => {
    const bib =
      "4 ed., Tecnos, Madrid, 1982, 578. Francesco GALGANO, Il negozio giuridico, segunda edición, Giuffrè, Revista de Derecho Privado. Teoría general del negocio jurídico.";

    expect(isBibliographicSentence(bib)).toBe(true);
    expect(looksLikeBibliography(bib)).toBe(true);
    expect(cleanPageTextForStudy(bib)).toBe("");
  });

  it("keeps doctrinal introduction when footnotes appear after the body", () => {
    const raw = `
      CAPÍTULO VI: Elementos accidentales del acto jurídico
      1. INTRODUCCIÓN
      Los elementos accidentales del acto jurídico son el modo, el plazo, la condición y el título.
      Modifican los efectos sin alterar la esencia del negocio jurídico.
      4 ed., Tecnos, Madrid, 1982, 578. Francesco GALGANO, Il negozio giuridico.
    `;

    const cleaned = cleanPageTextForStudy(raw);
    expect(cleaned).toMatch(/elementos accidentales/i);
    expect(cleaned).not.toMatch(/Tecnos|Madrid|GALGANO/i);
  });
});
