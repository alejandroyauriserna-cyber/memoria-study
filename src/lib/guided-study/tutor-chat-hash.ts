export function hashTutorQuestion(question: string): string {
  const normalized = question.trim().toLowerCase().replace(/\s+/g, " ");
  let hash = 5381;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i);
  }
  return `${Math.abs(hash >>> 0).toString(36)}-${normalized.length}`;
}
