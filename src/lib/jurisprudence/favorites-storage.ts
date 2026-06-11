const FAVORITES_KEY = "memoria-jurisprudence-favorites";

function readIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function getJurisprudenceFavoriteIds(): string[] {
  return readIds();
}

export function isJurisprudenceFavorite(id: string): boolean {
  return readIds().includes(id);
}

export function toggleJurisprudenceFavorite(id: string): boolean {
  const current = readIds();
  const exists = current.includes(id);
  const next = exists ? current.filter((item) => item !== id) : [...current, id];
  writeIds(next);
  return !exists;
}

export async function syncJurisprudenceFavoritesFromApi(): Promise<string[]> {
  try {
    const response = await fetch("/api/jurisprudence/favorites");
    if (!response.ok) return readIds();
    const payload = (await response.json()) as { ids?: string[] };
    const ids = payload.ids ?? [];
    writeIds(ids);
    return ids;
  } catch {
    return readIds();
  }
}

export async function persistJurisprudenceFavorite(
  id: string,
  saved: boolean,
): Promise<void> {
  try {
    await fetch("/api/jurisprudence/favorites", {
      method: saved ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch {
    // Offline: localStorage ya refleja el estado
  }
}
