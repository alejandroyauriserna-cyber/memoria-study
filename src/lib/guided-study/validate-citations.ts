import {
  PERU_LEGAL_ARTICLES,
  type LegalArticleRecord,
  toLegalCitation,
} from "@/lib/guided-study/legal-base";
import type {
  ConceptualNormLink,
  DetectedLegalConcept,
  LegalCitation,
  PageProfessorAnalysis,
} from "@/types/guided-legal-study";

export const NORMATIVE_SAFETY_MESSAGE =
  "No encontré una norma específica vinculada con suficiente certeza. Prefiero no mostrar un artículo antes que proporcionar una referencia incorrecta.";

const NORM_ALIASES: Record<string, string[]> = {
  cc: ["codigo civil", "c.c.", "c.c", "cc"],
  cpp: ["constitucion politica", "constitucion", "cpp"],
  cpc: ["codigo procesal civil", "cpc"],
  cp: ["codigo penal", "cp"],
  ncpp: ["codigo procesal penal", "ncpp", "nuevo codigo procesal penal"],
  lopj: ["ley organica del poder judicial", "lopj"],
};

const TOPIC_ARTICLE_IDS: Record<string, string[]> = {
  "acto juridico": ["cc-art-140"],
  "acto jurídico": ["cc-art-140"],
  "negocio juridico": ["cc-art-140"],
  interpretacion: ["cc-art-168", "cc-art-169"],
  interpretación: ["cc-art-168", "cc-art-169"],
  "declaracion de voluntad": ["cc-art-168", "cc-art-169"],
  "declaración de voluntad": ["cc-art-168", "cc-art-169"],
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractArticleNumber(ref: string): string | null {
  const match = ref.match(/(\d+)/);
  return match ? match[1]! : null;
}

export function normsMatch(candidateNorm: string, baseNorm: string): boolean {
  const a = normalizeText(candidateNorm);
  const b = normalizeText(baseNorm);

  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;

  for (const aliases of Object.values(NORM_ALIASES)) {
    const aHit = aliases.some((alias) => a.includes(alias) || alias.includes(a));
    const bHit = aliases.some((alias) => b.includes(alias) || alias.includes(b));
    if (aHit && bHit) return true;
  }

  return false;
}

export function findInLegalBase(
  norm: string,
  articleRef: string,
  index: LegalArticleRecord[] = PERU_LEGAL_ARTICLES,
): LegalArticleRecord | null {
  const articleNum = extractArticleNumber(articleRef);
  if (!articleNum) return null;

  return (
    index.find((record) => {
      const recordNum = extractArticleNumber(record.article);
      return recordNum === articleNum && normsMatch(norm || record.norm, record.norm);
    }) ?? null
  );
}

function tokenOverlap(fragment: string, officialText: string): number {
  const f = normalizeText(fragment);
  const o = normalizeText(officialText);
  const words = o.split(" ").filter((w) => w.length > 3);
  if (!words.length) return 0;
  return words.filter((w) => f.includes(w)).length;
}

function hasLiteralGrounding(fragment: string, officialText: string, pageText: string): boolean {
  const f = normalizeText(fragment);
  if (!f) return true;

  if (tokenOverlap(fragment, officialText) >= 3) return true;

  const page = normalizeText(pageText);
  const officialWords = officialText
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .slice(0, 8);
  const pageMentionsOfficial = officialWords.filter((w) =>
    page.includes(normalizeText(w)),
  ).length;

  return pageMentionsOfficial >= 2 && tokenOverlap(fragment, pageText) >= 2;
}

export function validateCitationAgainstBase(
  citation: LegalCitation,
  pageText: string,
  index: LegalArticleRecord[] = PERU_LEGAL_ARTICLES,
): LegalCitation | null {
  const normRef = citation.norm || citation.sourceTitle || "";
  const base = findInLegalBase(normRef, citation.article, index);
  if (!base) return null;

  const fragment = citation.fragment ?? citation.text ?? "";
  if (!hasLiteralGrounding(fragment, base.text, pageText)) {
    return null;
  }

  const sourceTitle = base.syncSourceTitle
    ? `${base.syncProvider ?? "LP"} — ${base.syncSourceTitle} (sincronizado ${base.updatedAt})`
    : base.norm;

  return {
    norm: base.norm,
    article: base.article,
    text: base.text,
    fragment: base.text,
    updatedAt: base.updatedAt,
    sourceId: base.syncSourceId ?? base.id,
    sourceTitle,
    confidence: "verified",
    legalBaseId: base.id,
  };
}

function stripArticleNumbers(text: string): string {
  return text
    .replace(/art[íi]culo\s*\d+/gi, "la norma aplicable")
    .replace(/\bart\.\s*\d+/gi, "la norma aplicable")
    .trim();
}

function hasVerifiedArticleFor(text: string, verified: LegalCitation[]): boolean {
  const num = extractArticleNumber(text);
  if (!num) return false;
  return verified.some((c) => extractArticleNumber(c.article) === num);
}

function buildDetectedConcepts(analysis: PageProfessorAnalysis): DetectedLegalConcept[] {
  const fromCards = analysis.conceptCards.map((card, index) => ({
    id: card.id || `concept-${index}`,
    term: card.concept,
    type: "definicion" as const,
    summary: card.explanation.slice(0, 180),
    essential: card.essential,
  }));

  const fromKey = analysis.keyLearning
    .filter((item) => !fromCards.some((c) => normalizeText(c.term) === normalizeText(item.label)))
    .map((item, index) => ({
      id: item.id || `kl-concept-${index}`,
      term: item.label,
      type: "teoria" as const,
      summary: item.label,
      essential: item.essential,
    }));

  return [...fromCards, ...fromKey].slice(0, 12);
}

function scoreArticleForPage(article: LegalArticleRecord, pageText: string): number {
  const page = normalizeText(pageText);
  let score = 0;

  for (const kw of article.keywords) {
    const n = normalizeText(kw);
    if (n.length >= 4 && page.includes(n)) score += 4;
  }

  for (const [topic, ids] of Object.entries(TOPIC_ARTICLE_IDS)) {
    if (!ids.includes(article.id)) continue;
    if (page.includes(normalizeText(topic))) score += 8;
  }

  return score;
}

export function suggestVerifiedArticlesFromPage(
  pageText: string,
  limit = 4,
  index: LegalArticleRecord[] = PERU_LEGAL_ARTICLES,
): LegalCitation[] {
  if (!pageText.trim()) return [];

  const scored = index.map((article) => ({
    article,
    score: scoreArticleForPage(article, pageText),
  }))
    .filter((item) => item.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ article }) => ({
    ...toLegalCitation(article),
    fragment: article.text,
    sourceId: article.syncSourceId ?? article.id,
    sourceTitle: article.syncSourceTitle
      ? `${article.syncProvider ?? "LP"} — ${article.syncSourceTitle}`
      : article.norm,
    confidence: "verified",
    legalBaseId: article.id,
  }));
}

export function processNormativeAnalysis(
  analysis: PageProfessorAnalysis,
  pageText: string,
  options: { strictNormativeMode: boolean; normativeIndex?: LegalArticleRecord[] },
): PageProfessorAnalysis {
  const index = options.normativeIndex ?? PERU_LEGAL_ARTICLES;
  const verified: LegalCitation[] = [];
  const seen = new Set<string>();

  for (const citation of analysis.citations) {
    const validated = validateCitationAgainstBase(citation, pageText, index);
    if (!validated || seen.has(validated.legalBaseId!)) continue;
    seen.add(validated.legalBaseId!);
    verified.push(validated);
  }

  if (!options.strictNormativeMode) {
    for (const suggested of suggestVerifiedArticlesFromPage(pageText, 4, index)) {
      if (seen.has(suggested.legalBaseId!)) continue;
      seen.add(suggested.legalBaseId!);
      verified.push(suggested);
    }
  }

  const conceptualNormLinks: ConceptualNormLink[] = [];

  for (const card of analysis.conceptCards) {
    if (!card.peruLaw?.trim()) continue;
    if (hasVerifiedArticleFor(card.peruLaw, verified)) continue;

    conceptualNormLinks.push({
      label: card.concept,
      note: stripArticleNumbers(card.peruLaw),
      confidence: "conceptual",
    });
  }

  const sanitizedCards = analysis.conceptCards.map((card) => ({
    ...card,
    peruLaw: card.peruLaw
      ? hasVerifiedArticleFor(card.peruLaw, verified)
        ? card.peruLaw
        : stripArticleNumbers(card.peruLaw)
      : undefined,
  }));

  return {
    ...analysis,
    conceptCards: sanitizedCards,
    citations: verified,
    detectedConcepts: buildDetectedConcepts(analysis),
    conceptualNormLinks,
    normativeNotice:
      verified.length === 0 ? NORMATIVE_SAFETY_MESSAGE : undefined,
  };
}
