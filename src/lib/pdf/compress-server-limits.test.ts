import { describe, expect, it } from "vitest";
import {
  PDF_SERVER_COMPRESS_HEAVY_BYTES,
  PDF_SERVER_COMPRESS_MIN_BYTES,
  PDF_SERVER_COMPRESS_MIN_PAGES,
  shouldUseServerCompression,
} from "@/lib/pdf/compress-server-limits";

describe("shouldUseServerCompression", () => {
  it("no usa servidor en PDFs pequeños", () => {
    expect(shouldUseServerCompression(10, PDF_SERVER_COMPRESS_MIN_BYTES - 1, "scanned")).toBe(
      false,
    );
  });

  it("usa servidor en PDFs muy pesados", () => {
    expect(shouldUseServerCompression(10, PDF_SERVER_COMPRESS_HEAVY_BYTES, "mixed")).toBe(true);
  });

  it("usa servidor con muchas páginas", () => {
    expect(shouldUseServerCompression(PDF_SERVER_COMPRESS_MIN_PAGES, 5 * 1024 * 1024, "text")).toBe(
      true,
    );
  });
});
