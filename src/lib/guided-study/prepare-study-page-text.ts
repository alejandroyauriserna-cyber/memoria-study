const LEGAL_STUDY_PATTERN =
  /\b(acto\s+jur[ií]dico|negocio\s+jur[ií]dico|elemento|requisito|efecto|derecho|obligaci[oó]n|contrato|norma|instituto|doctrina|principio|clase|clasificaci[oó]n|cap[ií]tulo|art[ií]culo|condici[oó]n|modo|plazo|t[ií]tulo|causa|objeto|forma|interpretaci[oó]n|nulidad|anulabilidad|prescripci[oó]n|caducidad|subjetiv|objetiv|accidental|esencial|voluntad|consentimiento|capacidad|vicio|simulaci[oó]n|representaci[oó]n|introducci[oó]n|accidental|esencial|modifican|presupuesto)\b/i;

const BIBLIOGRAPHY_PATTERN =
  /\b(Manuale|Napoli|Mil[aá]n|Madrid|Barcelona|Tecnos|Editorial|edici[oó]n|ISBN|p[aá]g\.|pp\.|vol\.|Tomo|ESj\.|Giuffr[eè]|Giuffre|Dall?Olio|De\s+Palma|Trujillo|Revista\s+de\s+Derecho|Teor[ií]a\s+general\s+del\s+negocio|Il\s+negozio|Manuale\s+di\s+Diritto)\b/i;

const FOOTNOTE_AUTHOR_PATTERN =
  /\(\s*\d+\s*\)\s*(?:[A-ZÀ-Ú][A-Za-zÀ-ú.-]+\s+){0,4}(?:GAZZONI|DIEZ|GALGANO|BETTI|ESPINOZA|CABANELLAS|ALTERINI|GULL[ÓO]N)/i;

const AUTHOR_CITATION_PATTERN =
  /\b(?:Francesco|Luis|Emilio|Antonio)\s+[A-ZÀ-Ú][A-Za-zÀ-ú-]+(?:\s+[A-ZÀ-Ú][A-Za-zÀ-ú-]+)?,?\s+(?:Il|El|Sistema|Teor[ií]a|Manuale|Revista|Derecho)/i;

const PUBLISHER_YEAR_PATTERN =
  /\b\d+\s*ed\.?\s*,\s*(?:Tecnos|Giuffr[eè]|Editorial|Madrid|Barcelona|Napoli|Mil[aá]n)/i;

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function isBibliographicSentence(sentence: string): boolean {
  const trimmed = sentence.trim();
  if (!trimmed) return true;
  if (FOOTNOTE_AUTHOR_PATTERN.test(trimmed)) return true;
  if (AUTHOR_CITATION_PATTERN.test(trimmed)) return true;
  if (PUBLISHER_YEAR_PATTERN.test(trimmed)) return true;
  if (BIBLIOGRAPHY_PATTERN.test(trimmed) && !LEGAL_STUDY_PATTERN.test(trimmed)) return true;
  if (/^\(\d+\)/.test(trimmed)) return true;
  if (/(?:\(\d+\)\s*){2,}/.test(trimmed)) return true;
  if (/\b\d{4}\b/.test(trimmed) && BIBLIOGRAPHY_PATTERN.test(trimmed) && trimmed.length < 220) {
    return true;
  }
  return false;
}

function scoreStudySentence(sentence: string): number {
  const trimmed = sentence.trim();
  if (trimmed.length < 20) return -3;
  if (isBibliographicSentence(trimmed)) return -10;

  let score = 0;
  if (LEGAL_STUDY_PATTERN.test(trimmed)) score += 5;
  if (trimmed.length >= 60) score += 2;
  if (trimmed.length >= 120) score += 1;
  if (/^CAP[ÍI]TULO|^SECCI[ÓO]N|^T[ÍI]TULO|^LIBRO|^INTRODUCCI[ÓO]N/i.test(trimmed)) score += 4;
  if (/^\d+\.\s+[A-ZÁÉÍÓÚ]/.test(trimmed)) score += 2;

  return score;
}

export function scorePageTextQuality(text: string): number {
  const sentences = splitSentences(normalizeWhitespace(text));
  if (!sentences.length) return 0;
  return sentences.reduce((sum, sentence) => sum + Math.max(0, scoreStudySentence(sentence)), 0);
}

export function hasSubstantiveStudyText(text: string): boolean {
  const cleaned = cleanPageTextForStudy(text);
  if (cleaned.length < 120) return false;
  if (looksLikeBibliography(cleaned)) return false;
  const legalHits = cleaned.match(new RegExp(LEGAL_STUDY_PATTERN.source, "gi")) ?? [];
  return legalHits.length >= 2;
}

function stripFootnoteCluster(text: string): string {
  let cleaned = text;

  const cutPatterns = [
    /\(\s*1\s*\)\s+[A-ZÀ-Ú]/,
    PUBLISHER_YEAR_PATTERN,
    AUTHOR_CITATION_PATTERN,
    /\bRevista de Derecho\b/i,
    /\bFrancesco\s+GALGANO\b/i,
    /\bLuis\s+DIEZ-PICAZO\b/i,
  ];

  for (const pattern of cutPatterns) {
    const match = cleaned.match(pattern);
    if (match?.index != null && match.index > 100) {
      cleaned = cleaned.slice(0, match.index).trim();
      break;
    }
  }

  return cleaned;
}

/** Extrae el bloque principal (capítulo / introducción) antes de bibliografía. */
export function extractMainBodyBlock(raw: string): string {
  const normalized = normalizeWhitespace(raw);
  if (!normalized) return "";

  const anchorPatterns = [
    /CAP[ÍI]TULO\s+[IVXLCDM\d]+[^.]{0,140}/i,
    /\bINTRODUCCI[ÓO]N\b/i,
    /\b\d+\.\s+[A-ZÁÉÍÓÚ][A-Za-zÁ-ú\s]{4,40}/,
  ];

  let start = 0;
  for (const pattern of anchorPatterns) {
    const match = normalized.match(pattern);
    if (match?.index != null && match.index < normalized.length * 0.75) {
      start = match.index;
      break;
    }
  }

  return stripFootnoteCluster(normalized.slice(start));
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;:])\s+(?=[A-ZÁÉÍÓÚ¿(0-9])|(?<=\.)\s+(?=CAP[ÍI]TULO)/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 15);
}

export function looksLikeBibliography(text: string): boolean {
  const sample = text.slice(0, 1400);
  if (!sample.trim()) return false;

  if (isBibliographicSentence(sample)) return true;

  const sentences = splitSentences(sample);
  if (!sentences.length) return BIBLIOGRAPHY_PATTERN.test(sample);

  const bibCount = sentences.filter((sentence) => isBibliographicSentence(sentence)).length;
  const legalCount = sentences.filter((sentence) => LEGAL_STUDY_PATTERN.test(sentence)).length;

  if (bibCount >= 2 && legalCount === 0) return true;
  if (bibCount >= sentences.length * 0.6) return true;
  if (BIBLIOGRAPHY_PATTERN.test(sample) && legalCount <= 1 && sample.length < 500) return true;

  return false;
}

export function cleanPageTextForStudy(raw: string): string {
  const body = extractMainBodyBlock(raw);
  const normalized = normalizeWhitespace(body || raw);
  if (!normalized) return "";

  const sentences = splitSentences(stripFootnoteCluster(normalized));
  if (!sentences.length) {
    const fallback = stripFootnoteCluster(normalized);
    return looksLikeBibliography(fallback) ? "" : fallback.slice(0, 4000);
  }

  const kept = sentences.filter((sentence) => scoreStudySentence(sentence) >= 1);
  let result = normalizeWhitespace(kept.join(" "));

  if (result.length < 180) {
    const relaxed = sentences.filter((sentence) => scoreStudySentence(sentence) >= 0);
    result = normalizeWhitespace(relaxed.join(" "));
  }

  if (!result || looksLikeBibliography(result)) {
    const best = sentences
      .filter((sentence) => scoreStudySentence(sentence) >= 2)
      .slice(0, 10);
    result = normalizeWhitespace(best.join(" "));
  }

  if (looksLikeBibliography(result)) {
    return "";
  }

  return result.slice(0, 4000);
}

export function extractStudyTopicHint(text: string): string | undefined {
  const body = extractMainBodyBlock(text) || text;
  const chapter = body.match(/CAP[ÍI]TULO\s+[IVXLCDM\d]+[^.]{0,120}/i)?.[0];
  if (chapter) return chapter.trim();

  const section = body.match(/(?:SECCI[ÓO]N|T[ÍI]TULO)\s+[A-ZÁÉÍÓÚ\d]+[^.]{0,80}/i)?.[0];
  if (section) return section.trim();

  const intro = body.match(/INTRODUCCI[ÓO]N/i)?.[0];
  if (intro) return intro.trim();

  const legal = body.match(
    /(?:elementos accidentales|acto\s+jur[ií]dico|condici[oó]n|modo|plazo|t[ií]tulo)[^.]{10,90}/i,
  )?.[0];
  return legal?.trim();
}

export function pickBestPageText(...candidates: string[]): string {
  let best = "";
  let bestScore = -1;

  for (const candidate of candidates) {
    const cleaned = cleanPageTextForStudy(candidate);
    const score = scorePageTextQuality(cleaned);
    if (score > bestScore) {
      bestScore = score;
      best = cleaned;
    }
  }

  return best;
}
