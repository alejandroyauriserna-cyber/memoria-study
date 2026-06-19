export function sanitizeMaterialFileName(fileName: string): string {
  const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lastDotIndex = normalized.lastIndexOf(".");
  const nameWithoutExt = lastDotIndex > 0 ? normalized.substring(0, lastDotIndex) : normalized;
  const extension = lastDotIndex > 0 ? normalized.substring(lastDotIndex + 1) : "pdf";

  const sanitizedName = nameWithoutExt
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const sanitizedExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  const finalName = sanitizedName || "archivo";
  const finalExtension = sanitizedExtension ? `.${sanitizedExtension}` : ".pdf";

  return `${finalName}${finalExtension}`;
}
