import type { LegalArticleRecord } from "@/lib/guided-study/legal-base";
import { extractArticleNumber } from "@/lib/guided-study/validate-citations";

function normKey(norm: string): string {
  return norm
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function articleKey(article: LegalArticleRecord): string {
  const num = extractArticleNumber(article.article);
  if (!num) return article.id;
  return `${normKey(article.norm)}::${num.toLowerCase()}`;
}

/** Combina artículos sincronizados desde URL. Sin fallback estático no verificado. */
export function mergeNormativeIndex(
  staticArticles: LegalArticleRecord[] = [],
  urlArticles: LegalArticleRecord[] = [],
): LegalArticleRecord[] {
  const map = new Map<string, LegalArticleRecord>();

  for (const article of staticArticles) {
    map.set(articleKey(article), article);
  }

  for (const article of urlArticles) {
    map.set(articleKey(article), article);
  }

  return [...map.values()];
}

export function articlesFromEnabledUrlSources(
  sources: Array<{
    id: string;
    title: string;
    enabled: boolean;
    kind: string;
    sourceUrl?: string;
    lastSyncedAt?: string;
    parsedArticles?: LegalArticleRecord[];
  }>,
): LegalArticleRecord[] {
  const articles: LegalArticleRecord[] = [];

  for (const source of sources) {
    if (source.kind !== "url" || !source.enabled || !source.parsedArticles?.length) continue;

    for (const article of source.parsedArticles) {
      articles.push({
        ...article,
        syncSourceId: source.id,
        syncSourceTitle: source.title,
        syncSourceUrl: source.sourceUrl,
        updatedAt: source.lastSyncedAt ?? article.updatedAt,
      });
    }
  }

  return articles;
}
