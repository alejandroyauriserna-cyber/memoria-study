import { describe, expect, it } from "vitest";
import {
  detectStudyDocumentKind,
  isLegacyPptFile,
  isSupportedStudyDocument,
} from "@/lib/documents/kinds";

describe("study document kinds", () => {
  it("detecta PDF y PPTX", () => {
    expect(detectStudyDocumentKind("apuntes.pdf")).toBe("pdf");
    expect(detectStudyDocumentKind("clase.pptx")).toBe("pptx");
    expect(detectStudyDocumentKind("clase.pptm")).toBe("pptx");
  });

  it("rechaza ppt legado", () => {
    expect(isLegacyPptFile("viejo.ppt")).toBe(true);
    expect(isSupportedStudyDocument("viejo.ppt")).toBe(false);
  });
});
