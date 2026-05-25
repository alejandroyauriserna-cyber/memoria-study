export function isLowQualityExtractedText(text: string) {
  const trimmed = text.trim();
  if (trimmed.length < 80) {
    return true;
  }

  const words = trimmed.match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  if (words.length < 20) {
    return true;
  }

  const weirdChars = trimmed.match(/[^\p{L}\p{N}\s.,;:!?¿¡()\-—«»""'"]/gu) ?? [];
  return weirdChars.length / trimmed.length > 0.35;
}
