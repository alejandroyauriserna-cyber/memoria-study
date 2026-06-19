export type StudyDocumentKind = "pdf" | "pptx";

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

const PPTM_MIME =
  "application/vnd.ms-powerpoint.presentation.macroEnabled.12";

export function isLegacyPptFile(fileName: string, mimeType?: string) {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".ppt") &&
    !lower.endsWith(".pptx") &&
    !lower.endsWith(".pptm") &&
    mimeType !== PPTX_MIME &&
    mimeType !== PPTM_MIME
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
    mimeType === PPTX_MIME ||
    mimeType === PPTM_MIME
  ) {
    return "pptx";
  }

  return null;
}

export function isSupportedStudyDocument(fileName: string, mimeType?: string) {
  return detectStudyDocumentKind(fileName, mimeType) !== null;
}

export const STUDY_DOCUMENT_ACCEPT =
  ".pdf,application/pdf,.pptx,.pptm,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip";

export function studyDocumentContentType(fileName: string, mimeType?: string) {
  const kind = detectStudyDocumentKind(fileName, mimeType);
  if (kind === "pptx") return PPTX_MIME;
  if (kind === "pdf") return "application/pdf";
  return mimeType || "application/octet-stream";
}

export function studyDocumentLabel(fileName: string, mimeType?: string) {
  const kind = detectStudyDocumentKind(fileName, mimeType);
  if (kind === "pptx") return "presentación PowerPoint";
  if (kind === "pdf") return "PDF";
  return "archivo";
}
