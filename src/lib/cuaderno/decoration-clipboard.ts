const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export function readImageFileFromClipboard(
  clipboard: DataTransfer | null,
): File | null {
  if (!clipboard) return null;
  for (const item of Array.from(clipboard.items)) {
    if (item.kind === "file" && IMAGE_TYPES.some((t) => item.type === t || item.type.startsWith("image/"))) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}

export function readImageFileFromDataTransfer(dataTransfer: DataTransfer): File | null {
  const files = Array.from(dataTransfer.files);
  return files.find((f) => f.type.startsWith("image/")) ?? null;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });
}
