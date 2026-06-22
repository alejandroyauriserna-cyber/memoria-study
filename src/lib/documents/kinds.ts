export type StudyDocumentKind = "pdf" | "pptx";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const PPTM_MIME =
  "application/vnd.ms-powerpoint.presentation.macroEnabled.12";

function normalizeMimeType(mimeType?: string) {
  return mimeType?.trim().toLowerCase() ?? "";
}

export function isPptmMime(mimeType?: string) {
  return normalizeMimeType(mimeType) === PPTM_MIME.toLowerCase();
}

export function isPptxMime(mimeType?: string) {
  return normalizeMimeType(mimeType) === PPTX_MIME.toLowerCase();
}

export function isLegacyPptFile(fileName: string, mimeType?: string) {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".ppt") &&
    !lower.endsWith(".pptx") &&
    !lower.endsWith(".pptm") &&
    !isPptxMime(mimeType) &&
    !isPptmMime(mimeType)
  );
}

export function detectStudyDocumentKind(
  fileName: string,
  mimeType?: string,
): StudyDocumentKind | null {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".pdf") || mimeType === "application/pdf") {
    return "pdf";
  }

  if (
    lower.endsWith(".pptx") ||
    lower.endsWith(".pptm") ||
    isPptxMime(mimeType) ||
    isPptmMime(mimeType)
  ) {
    return "pptx";
  }

  return null;
}

export function isSupportedStudyDocument(fileName: string, mimeType?: string) {
  return detectStudyDocumentKind(fileName, mimeType) !== null;
}

export const STUDY_DOCUMENT_ACCEPT =
  ".pdf,application/pdf,.pptx,.pptm,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint.presentation.macroEnabled.12,application/zip";

export function studyDocumentContentType(fileName: string, mimeType?: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || normalizeMimeType(mimeType) === "application/pdf") {
    return "application/pdf";
  }
  if (lower.endsWith(".pptm") || isPptmMime(mimeType)) {
    return PPTM_MIME;
  }
  if (lower.endsWith(".pptx") || isPptxMime(mimeType)) {
    return PPTX_MIME;
  }
  const kind = detectStudyDocumentKind(fileName, mimeType);
  if (kind === "pdf") return "application/pdf";
  if (kind === "pptx") return PPTX_MIME;
  return mimeType || "application/octet-stream";
}

export function studyDocumentLabel(fileName: string, mimeType?: string) {
  const kind = detectStudyDocumentKind(fileName, mimeType);
  if (kind === "pptx") return "presentación PowerPoint";
  if (kind === "pdf") return "PDF";
  return "archivo";
}
