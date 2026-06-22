import {
  PDF_HEAVY_BYTES_PER_PAGE,
  PDF_SCANNED_TEXT_CHARS_PER_PAGE,
} from "@/lib/pdf/compress-presets";

export type PdfDocumentKind = "text" | "mixed" | "scanned";

export type PdfDocumentProfile = {
  pageCount: number;
  sampledPages: number;
  sampledTextChars: number;
  bytesPerPage: number;
  kind: PdfDocumentKind;
};

export function classifyPdfDocumentProfile(input: {
  pageCount: number;
  sampledPages: number;
  sampledTextChars: number;
  fileBytes: number;
}): PdfDocumentProfile {
  const pageCount = Math.max(1, input.pageCount);
  const sampledPages = Math.max(1, input.sampledPages);
  const bytesPerPage = input.fileBytes / pageCount;
  const textPerPage = input.sampledTextChars / sampledPages;

  let kind: PdfDocumentKind = "mixed";
  if (textPerPage < PDF_SCANNED_TEXT_CHARS_PER_PAGE || bytesPerPage > PDF_HEAVY_BYTES_PER_PAGE) {
    kind = "scanned";
  } else if (textPerPage > 380 && bytesPerPage < 120_000) {
    kind = "text";
  }

  return {
    pageCount,
    sampledPages,
    sampledTextChars: input.sampledTextChars,
    bytesPerPage,
    kind,
  };
}

export function pickCompressPresetForProfile(
  profile: PdfDocumentProfile,
  fileBytes: number,
): "recommended" | "extreme" | "light" {
  if (profile.kind === "text" && fileBytes < 8 * 1024 * 1024) {
    return "light";
  }
  if (profile.kind === "scanned" && fileBytes > 12 * 1024 * 1024) {
    return "extreme";
  }
  if (profile.bytesPerPage > 400_000) {
    return "extreme";
  }
  return "recommended";
}

export function shouldAttemptImageCompression(
  profile: PdfDocumentProfile,
  fileBytes: number,
  thresholdBytes: number,
): boolean {
  if (profile.kind === "scanned") {
    return fileBytes >= 1.5 * 1024 * 1024;
  }
  if (profile.kind === "mixed") {
    return fileBytes >= thresholdBytes;
  }
  return false;
}
