/** Logs de depuración: ?cnDebug=1 o localStorage cn-debug=1 */
export function isCnDebug(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("cn-debug") === "1") return true;
    return new URLSearchParams(window.location.search).has("cnDebug");
  } catch {
    return false;
  }
}

export function cnDebug(tag: string, payload?: unknown): void {
  if (!isCnDebug()) return;
  if (payload !== undefined) {
    console.log(`[cuaderno:${tag}]`, payload);
  } else {
    console.log(`[cuaderno:${tag}]`);
  }
}
