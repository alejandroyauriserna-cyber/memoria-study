/** Español jurídico hablado — ~145 palabras/min a velocidad 1x. */
const WORDS_PER_MINUTE = 145;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateSpeechDurationSec(
  wordCount: number,
  rate: number = 1,
): number {
  if (wordCount <= 0) return 0;
  const base = (wordCount / WORDS_PER_MINUTE) * 60;
  return Math.max(8, Math.round(base / rate));
}

export function formatSpeechDuration(totalSec: number): string {
  if (totalSec < 60) return `${totalSec} s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return s > 0 ? `${m} min ${s} s` : `${m} min`;
}
