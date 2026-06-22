import { detectStudyDocumentKind, studyDocumentLabel } from "@/lib/documents/kinds";

export function materialViewerPath(materialId: string) {
  return `/materials/${materialId}/viewer`;
}

export function materialFileApiPath(
  materialId: string,
  disposition: "inline" | "attachment" = "inline",
) {
  return `/api/materials/${materialId}/file?disposition=${disposition}`;
}

export function materialViewButtonLabel(fileName: string) {
  const kind = detectStudyDocumentKind(fileName);
  if (kind === "pptx") return "Ver presentación";
  if (kind === "pdf") return "Ver PDF";
  return "Ver documento";
}

export function materialDownloadButtonLabel(fileName: string) {
  const kind = detectStudyDocumentKind(fileName);
  if (kind === "pptx") return "Descargar presentación";
  if (kind === "pdf") return "Descargar PDF";
  return `Descargar ${studyDocumentLabel(fileName)}`;
}
