import { describe, expect, it } from "vitest";
import type { LegalArticleRecord } from "@/lib/guided-study/legal-base";
import { mergeLegalArticleRecords } from "@/lib/legal-sources/parse-lp-html";

function sampleArticle(number: string, text: string, sourceUrl: string): LegalArticleRecord {
  return {
    id: `source-art-${number.toLowerCase()}`,
    norm: "Código Civil",
    normShort: "CC",
    article: `Artículo ${number} — Ejemplo`,
    title: "Ejemplo",
    text,
    keywords: [],
    updatedAt: "2026-06-13T00:00:00.000Z",
    syncSourceId: "source",
    syncSourceUrl: sourceUrl,
    syncProvider: "LP Derecho",
  };
}

describe("mergeLegalArticleRecords", () => {
  it("keeps distinct article numbers from one LP page", () => {
    const merged = mergeLegalArticleRecords([
      [
        sampleArticle("1", "Texto del artículo uno con suficiente longitud.", "https://lpderecho.pe/a/"),
        sampleArticle("2", "Texto del artículo dos con suficiente longitud.", "https://lpderecho.pe/a/"),
        sampleArticle("646", "Texto del artículo seiscientos cuarenta y seis.", "https://lpderecho.pe/a/"),
      ],
    ]);

    expect(merged).toHaveLength(3);
  });

  it("merges continuations from multiple LP URLs without collapsing to one", () => {
    const partOne = sampleArticle("646", "Versión corta del artículo 646.", "https://lpderecho.pe/parte-1/");
    const partTwo = sampleArticle("647", "Texto del artículo 647 en la segunda parte.", "https://lpderecho.pe/parte-2/");
    const duplicate646 = {
      ...sampleArticle("646", "Versión más completa del artículo 646 en la segunda URL.", "https://lpderecho.pe/parte-2/"),
    };

    const merged = mergeLegalArticleRecords([[partOne], [duplicate646, partTwo]]);

    expect(merged).toHaveLength(2);
    expect(merged.find((a) => a.id.endsWith("-646"))?.text).toContain("más completa");
  });
});
