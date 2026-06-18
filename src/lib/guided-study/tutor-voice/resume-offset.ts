/**
 * Calcula el texto que falta por narrar según el tiempo transcurrido.
 * Necesario porque muchos guiones caben en un solo utterance y el índice de chunk
 * no indica posición dentro del bloque.
 */

import { estimateSpeechDurationSec } from "@/lib/guided-study/tutor-voice/estimate-duration";
import { normalizeSpeechScript } from "@/lib/guided-study/tutor-voice/speech-chunks";

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Devuelve el guion restante a partir del progreso estimado por tiempo. */
export function sliceScriptByElapsedProgress(
  script: string,
  elapsedSec: number,
  rate: number,
): string {
  const normalized = normalizeSpeechScript(script);
  if (!normalized || elapsedSec <= 0) return normalized;

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return normalized;

  const totalDuration = estimateSpeechDurationSec(words.length, rate);
  if (totalDuration <= 0 || elapsedSec >= totalDuration - 1) return "";

  const ratio = Math.min(0.96, elapsedSec / totalDuration);
  const wordOffset = Math.max(0, Math.floor(words.length * ratio));
  if (wordOffset <= 0) return normalized;

  return words.slice(wordOffset).join(" ");
}

export function estimateRemainingDurationSec(
  script: string,
  elapsedSec: number,
  rate: number,
): number {
  const remaining = sliceScriptByElapsedProgress(script, elapsedSec, rate);
  if (!remaining) return 0;
  return estimateSpeechDurationSec(countWords(remaining), rate);
}
