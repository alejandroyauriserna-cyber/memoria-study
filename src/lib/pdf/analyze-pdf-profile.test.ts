import { describe, expect, it } from "vitest";
import {
  classifyPdfDocumentProfile,
  pickCompressPresetForProfile,
  shouldAttemptImageCompression,
} from "@/lib/pdf/analyze-pdf-profile";

describe("classifyPdfDocumentProfile", () => {
  it("detecta PDF escaneado por poco texto", () => {
    const profile = classifyPdfDocumentProfile({
      pageCount: 40,
      sampledPages: 6,
      sampledTextChars: 120,
      fileBytes: 18 * 1024 * 1024,
    });
    expect(profile.kind).toBe("scanned");
  });

  it("detecta PDF con texto seleccionable", () => {
    const profile = classifyPdfDocumentProfile({
      pageCount: 20,
      sampledPages: 6,
      sampledTextChars: 6 * 500,
      fileBytes: 2 * 1024 * 1024,
    });
    expect(profile.kind).toBe("text");
  });
});

describe("pickCompressPresetForProfile", () => {
  it("usa extrema en escaneos muy pesados", () => {
    const profile = classifyPdfDocumentProfile({
      pageCount: 80,
      sampledPages: 6,
      sampledTextChars: 40,
      fileBytes: 25 * 1024 * 1024,
    });
    expect(pickCompressPresetForProfile(profile, 25 * 1024 * 1024)).toBe("extreme");
  });
});

describe("shouldAttemptImageCompression", () => {
  it("comprime escaneos desde 1.5 MB", () => {
    const profile = classifyPdfDocumentProfile({
      pageCount: 10,
      sampledPages: 6,
      sampledTextChars: 30,
      fileBytes: 2 * 1024 * 1024,
    });
    expect(shouldAttemptImageCompression(profile, 2 * 1024 * 1024, 3 * 1024 * 1024)).toBe(
      true,
    );
  });

  it("no recomprime PDFs de solo texto livianos", () => {
    const profile = classifyPdfDocumentProfile({
      pageCount: 10,
      sampledPages: 6,
      sampledTextChars: 6 * 600,
      fileBytes: 2 * 1024 * 1024,
    });
    expect(shouldAttemptImageCompression(profile, 2 * 1024 * 1024, 3 * 1024 * 1024)).toBe(
      false,
    );
  });
});
