import type { LegalArticleRecord } from "@/lib/guided-study/legal-base";

const ARTICLE_HEADER =
  /(?:^|\n)\s*(?:#{1,6}\s*)?Art[ií]culo\s+([\d]+(?:-[A-Za-z])?|[IVXLCDM]+)\.?\s*(?:°|\.|-)?\s*(?:\[([^\]]+)\]|[-–—]\s*([^\n*]+?))?(?:\*)?\s*(?:\n|$)/gi;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function htmlToPlainText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  );
}

function cleanArticleBody(body: string): string {
  return body
    .replace(/^\*\s.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();
}

function articleLabel(number: string, title?: string): string {
  const normalized = number.match(/^\d/) ? number : number.toUpperCase();
  if (title?.trim()) {
    return `Artículo ${normalized} — ${title.trim()}`;
  }
  return `Artículo ${normalized}`;
}

function keywordsFromText(title: string, text: string): string[] {
  const combined = `${title} ${text}`.toLowerCase();
  const words = combined
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\W+/)
    .filter((w) => w.length >= 5);
  return [...new Set(words)].slice(0, 8);
}

type ParsedBlock = {
  number: string;
  title: string;
  text: string;
};

export function parseLpLegalArticles(
  htmlOrText: string,
  meta: {
    norm: string;
    normShort: string;
    sourceId: string;
    sourceUrl: string;
    syncedAt: string;
  },
): LegalArticleRecord[] {
  const plain = htmlOrText.includes("<") ? htmlToPlainText(htmlOrText) : htmlOrText;
  const blocks: ParsedBlock[] = [];

  ARTICLE_HEADER.lastIndex = 0;
  const matches = [...plain.matchAll(new RegExp(ARTICLE_HEADER.source, "gi"))];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]!;
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : plain.length;
    const rawBody = plain.slice(start, end);
    const body = cleanArticleBody(rawBody);

    if (body.length < 15) continue;

    const bracketTitle = match[2]?.trim();
    const dashTitle = match[3]?.trim()?.replace(/\*$/, "").trim();
    const title = bracketTitle || dashTitle || "";

    blocks.push({
      number: match[1]!.trim(),
      title,
      text: body.slice(0, 4000),
    });
  }

  const byNumber = new Map<string, ParsedBlock>();
  for (const block of blocks) {
    const existing = byNumber.get(block.number);
    if (!existing || block.text.length > existing.text.length) {
      byNumber.set(block.number, block);
    }
  }

  return [...byNumber.values()].map((block) => {
    const article = articleLabel(block.number, block.title);
    return {
      id: `${meta.sourceId}-art-${block.number.toLowerCase()}`,
      norm: meta.norm,
      normShort: meta.normShort,
      article,
      title: block.title || article,
      text: block.text,
      keywords: keywordsFromText(block.title, block.text),
      updatedAt: meta.syncedAt,
      syncSourceId: meta.sourceId,
      syncSourceUrl: meta.sourceUrl,
      syncProvider: "LP Derecho",
    };
  });
}

export function buildExtractedSummary(articles: LegalArticleRecord[], maxChars = 14_000): string {
  let output = "";
  for (const article of articles) {
    const chunk = `[${article.normShort} ${article.article}] ${article.text.slice(0, 500)}\n\n`;
    if (output.length + chunk.length > maxChars) break;
    output += chunk;
  }
  return output.trim();
}

function articleNumberKey(article: LegalArticleRecord): string {
  const fromId = article.id.match(/-art-(.+)$/i);
  if (fromId?.[1]) {
    return fromId[1].toLowerCase();
  }

  // Must anchor after "Artículo" — [IVXLCDM]+ with /i also matches c/l/d/m inside the word.
  const match = article.article.match(/Art[ií]culo\s+(\d+(?:-[A-Za-z])?|[IVXLCDM]+)/i);
  return match?.[1] ? match[1].toLowerCase() : article.id;
}

/** Fusiona artículos de varias URLs LP (continuaciones, partes). */
export function mergeLegalArticleRecords(chunks: LegalArticleRecord[][]): LegalArticleRecord[] {
  const byKey = new Map<string, LegalArticleRecord>();

  for (const articles of chunks) {
    for (const article of articles) {
      const key = articleNumberKey(article);
      const existing = byKey.get(key);
      if (!existing || article.text.length > existing.text.length) {
        byKey.set(key, article);
      }
    }
  }

  return [...byKey.values()];
}
