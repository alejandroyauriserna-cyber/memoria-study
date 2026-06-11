export function normalizeJurisprudenceText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeExpediente(expediente: string | null | undefined): string | null {
  const value = expediente?.trim();
  if (!value) return null;
  return value.replace(/\s+/g, " ").toUpperCase();
}
