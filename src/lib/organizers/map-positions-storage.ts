const STORAGE_PREFIX = "memoria-map-positions:";

export type SavedMapPositions = Record<string, { x: number; y: number }>;

export function loadMapPositions(mapKey: string): SavedMapPositions {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${mapKey}`);
    return raw ? (JSON.parse(raw) as SavedMapPositions) : {};
  } catch {
    return {};
  }
}

export function saveMapPositions(mapKey: string, positions: SavedMapPositions) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORAGE_PREFIX}${mapKey}`, JSON.stringify(positions));
}

export function clearMapPositions(mapKey: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_PREFIX}${mapKey}`);
}
