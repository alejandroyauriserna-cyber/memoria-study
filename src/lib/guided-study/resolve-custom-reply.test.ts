import { describe, expect, it } from "vitest";
import type { PageProfessorAnalysis } from "@/types/guided-legal-study";
import {
  buildCustomReplyFromAnalysis,
  extractPlainTextFallback,
  resolveCustomChatReply,
} from "@/lib/guided-study/resolve-custom-reply";

const sampleAnalysis: PageProfessorAnalysis = {
  pageFocus: "La condición puede ser objetiva o subjetiva según el criterio del acto.",
  secondaryMentions: [],
  keyLearning: [],
  highlights: [],
  conceptCards: [
    {
      id: "c1",
      concept: "Condición objetiva",
      explanation:
        "Es objetiva cuando depende de un hecho cierto e independiente de la voluntad de las partes.",
      example: "",
      examImportance: "",
    },
  ],
  examMode: {
    oral: [],
    desarrollo: [],
    test: [],
    memorableConcepts: [],
    commonErrors: [],
  },
  citations: [],
};

describe("resolveCustomChatReply", () => {
  it("prefers customReply when present", () => {
    expect(
      resolveCustomChatReply({ customReply: "Sí, tu lectura es correcta." }),
    ).toBe("Sí, tu lectura es correcta.");
  });

  it("builds chat text from analysis when customReply is missing", () => {
    const reply = resolveCustomChatReply(
      { analysis: sampleAnalysis },
      "condición objetiva subjetiva incertidumbre",
    );
    expect(reply).toContain("objetiva cuando depende");
  });

  it("extracts plain text fallback when model ignores JSON", () => {
    expect(
      extractPlainTextFallback(
        "Correcto: la incertidumbre no es un tipo aparte, sino el criterio de la condición.",
      ),
    ).toContain("incertidumbre");
  });
});

describe("buildCustomReplyFromAnalysis", () => {
  it("returns undefined for empty analysis", () => {
    expect(
      buildCustomReplyFromAnalysis({
        ...sampleAnalysis,
        pageFocus: "",
        conceptCards: [],
      }),
    ).toBeUndefined();
  });
});
