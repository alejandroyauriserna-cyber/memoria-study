export function formatBytesShort(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatCompressionDelta(originalBytes: number, finalBytes: number): string {
  const saved = originalBytes - finalBytes;
  if (saved <= 0) return formatBytesShort(finalBytes);
  const pct = Math.round((saved / originalBytes) * 100);
  return `${formatBytesShort(originalBytes)} → ${formatBytesShort(finalBytes)} (−${pct}%)`;
}
