import { describe, expect, it } from "vitest";
import {
  cleanPageTextForStudy,
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

  it("detects bibliography-heavy excerpts", () => {
    const bib =
      "(4) Francesco GAZZONI, Manuale di Diritto Privato, Napoli, 2006. (3) Luis DIEZ-PICAZO y Antonio GULLÓN.";

    expect(looksLikeBibliography(bib)).toBe(true);
  });
});
