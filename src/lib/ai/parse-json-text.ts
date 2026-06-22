/** Extrae JSON de respuestas que vienen con fences markdown o texto alrededor. */
export function parseJsonText(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    return cleaned;
  }

  return cleaned.slice(jsonStart, jsonEnd + 1);
}
