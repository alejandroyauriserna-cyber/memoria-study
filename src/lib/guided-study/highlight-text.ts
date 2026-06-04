/** Encuentra posición de una frase en el texto de la página (tolerante a espacios). */
export function findPhraseInPageText(
  pageText: string,
  phrase: string,
): { start: number; end: number; matched: string } | null {
  if (!phrase.trim() || !pageText.trim()) return null;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const normPage = normalize(pageText);
  const normPhrase = normalize(phrase);

  const idx = normPage.indexOf(normPhrase);
  if (idx >= 0) {
    const matched = mapNormalizedSliceToOriginal(pageText, idx, normPhrase.length);
    if (matched) return matched;
  }

  const words = normPhrase.split(" ").filter((w) => w.length > 3);
  if (words.length >= 2) {
    const partial = words.slice(0, Math.min(4, words.length)).join(" ");
    const partialIdx = normPage.indexOf(partial);
    if (partialIdx >= 0) {
      const matched = mapNormalizedSliceToOriginal(pageText, partialIdx, partial.length);
      if (matched) return matched;
    }
  }

  return null;
}

function mapNormalizedSliceToOriginal(
  original: string,
  normStart: number,
  normLength: number,
): { start: number; end: number; matched: string } | null {
  const normalizeWithMap = (s: string) => {
    let norm = "";
    const starts: number[] = [];
    let inSpace = false;

    for (let i = 0; i < s.length; i++) {
      const ch = s[i]!;
      const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (/\s/.test(base)) {
        if (!inSpace && norm.length > 0) {
          norm += " ";
          starts.push(i);
          inSpace = true;
        }
        continue;
      }
      inSpace = false;
      for (const c of base) {
        norm += c;
        starts.push(i);
      }
    }

    return { norm: norm.trim(), starts };
  };

  const { norm, starts } = normalizeWithMap(original);
  const trimmedOffset = original.length - original.trimStart().length;
  const startIdx = normStart;
  const endIdx = normStart + normLength;

  if (startIdx < 0 || endIdx > norm.length || !starts[startIdx]) {
    return null;
  }

  const start = starts[startIdx] ?? trimmedOffset;
  const endChar = starts[Math.min(endIdx, starts.length - 1)] ?? original.length;
  const end = Math.min(original.length, endChar + 1);

  return { start, end, matched: original.slice(start, end) };
}

export function buildHighlightedSegments(
  pageText: string,
  highlights: Array<{ id: string; phrase: string; category: string }>,
): Array<
  | { type: "text"; content: string }
  | { type: "highlight"; content: string; id: string; category: string }
> {
  if (!pageText.trim()) {
    return [{ type: "text", content: pageText }];
  }

  type Match = { start: number; end: number; id: string; category: string; content: string };
  const matches: Match[] = [];

  for (const h of highlights) {
    const pos = findPhraseInPageText(pageText, h.phrase);
    if (pos) {
      matches.push({
        start: pos.start,
        end: pos.end,
        id: h.id,
        category: h.category,
        content: pos.matched,
      });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const merged: Match[] = [];
  for (const m of matches) {
    const last = merged[merged.length - 1];
    if (last && m.start < last.end) continue;
    merged.push(m);
  }

  if (!merged.length) {
    return [{ type: "text", content: pageText }];
  }

  const segments: Array<
    | { type: "text"; content: string }
    | { type: "highlight"; content: string; id: string; category: string }
  > = [];

  let cursor = 0;

  for (const m of merged) {
    if (m.start > cursor) {
      segments.push({ type: "text", content: pageText.slice(cursor, m.start) });
    }
    segments.push({
      type: "highlight",
      content: m.content,
      id: m.id,
      category: m.category,
    });
    cursor = m.end;
  }

  if (cursor < pageText.length) {
    segments.push({ type: "text", content: pageText.slice(cursor) });
  }

  return segments;
}
