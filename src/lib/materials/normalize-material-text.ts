export function normalizeMaterialText(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMaterialFileName(raw: string): string {
  return normalizeMaterialText(raw.replace(/\.[^.]+$/, ""));
}
