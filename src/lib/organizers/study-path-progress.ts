const PREFIX = "memoria-study-path:";

export function loadPathProgress(pathKey: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${PREFIX}${pathKey}`);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function savePathProgress(pathKey: string, progress: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${pathKey}`, JSON.stringify(progress));
  } catch {
    /* ignore quota */
  }
}

export function markPathNodeComplete(pathKey: string, nodeId: string) {
  const current = loadPathProgress(pathKey);
  savePathProgress(pathKey, { ...current, [nodeId]: true });
}
