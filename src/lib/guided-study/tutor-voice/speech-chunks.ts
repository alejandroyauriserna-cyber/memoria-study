/**
 * Agrupa el guion en pocos bloques largos para evitar pausas entre oraciones.
 * Cada SpeechSynthesisUtterance separado genera un silencio en Chrome/Safari.
 */

/** La mayoría de guiones narrados caben en un solo utterance (~480 palabras). */
const SINGLE_UTTERANCE_MAX = 4_500;
/** Bloques largos si el guion supera el límite anterior. */
const CHUNK_MAX_CHARS = 2_000;

export function normalizeSpeechScript(text: string): string {
  return text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\.{2,}/g, ".")
    .replace(/…/g, ".")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;:])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * ≤4 500 caracteres → un solo utterance (flujo continuo).
 * Más largo → bloques de ~2 000 caracteres cortando en fin de oración.
 */
export function buildSpeechChunks(text: string): string[] {
  const normalized = normalizeSpeechScript(text);
  if (!normalized) return [];

  if (normalized.length <= SINGLE_UTTERANCE_MAX) {
    return [normalized];
  }

  const sentences = splitSentences(normalized);
  if (sentences.length <= 1) {
    return [normalized];
  }

  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    const candidate = buffer ? `${buffer} ${sentence}` : sentence;

    if (candidate.length <= CHUNK_MAX_CHARS) {
      buffer = candidate;
      continue;
    }

    if (buffer) chunks.push(buffer);

    if (sentence.length <= CHUNK_MAX_CHARS) {
      buffer = sentence;
    } else {
      chunks.push(sentence.slice(0, CHUNK_MAX_CHARS));
      buffer = sentence.slice(CHUNK_MAX_CHARS).trim();
    }
  }

  if (buffer) chunks.push(buffer);
  return chunks.length ? chunks : [normalized];
}
