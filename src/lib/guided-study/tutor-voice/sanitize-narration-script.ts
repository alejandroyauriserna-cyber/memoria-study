/** Limpia guion para TTS continuo. */
export function sanitizeNarrationScript(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/…/g, ".")
    .replace(/\s+([,.;:!?])/g, "$1");
}
