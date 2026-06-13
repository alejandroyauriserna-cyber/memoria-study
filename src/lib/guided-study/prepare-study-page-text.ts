const LEGAL_STUDY_PATTERN =
  /\b(acto\s+jur[ií]dico|negocio\s+jur[ií]dico|elemento|requisito|efecto|derecho|obligaci[oó]n|contrato|norma|instituto|doctrina|principio|clase|clasificaci[oó]n|cap[ií]tulo|art[ií]culo|condici[oó]n|modo|plazo|t[ií]tulo|causa|objeto|forma|interpretaci[oó]n|nulidad|anulabilidad|prescripci[oó]n|caducidad|subjetiv|objetiv|accidental|esencial|voluntad|consentimiento|capacidad|vicio|simulaci[oó]n|representaci[oó]n)\b/i;

const BIBLIOGRAPHY_PATTERN =
  /\b(Manuale|Napoli|Mil[aá]n|Editorial|edici[oó]n|ISBN|p[aá]g\.|pp\.|vol\.|Tomo|ESj\.|Giuffr[eè]|Giuffre|Dall?Olio|De\s+Palma|Trujillo|Lima\s+\d{4})\b/i;

const FOOTNOTE_AUTHOR_PATTERN =
  /\(\s*\d+\s*\)\s*(?:[A-ZÀ-Ú][A-Za-zÀ-ú.-]+\s+){1,4}(?:GAZZONI|DIEZ|GALGANO|BETTI|ESPINOZA|CABANELLAS|ALTERINI)/i;

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function scoreStudySentence(sentence: string): number {
  const trimmed = sentence.trim();
  if (trimmed.length < 20) return -3;

  let score = 0;
  if (LEGAL_STUDY_PATTERN.test(trimmed)) score += 5;
  if (trimmed.length >= 60) score += 2;
  if (trimmed.length >= 120) score += 1;
  if (/^CAP[ÍI]TULO|^SECCI[ÓO]N|^T[ÍI]TULO|^LIBRO/i.test(trimmed)) score += 4;
  if (BIBLIOGRAPHY_PATTERN.test(trimmed)) score -= 8;
  if (FOOTNOTE_AUTHOR_PATTERN.test(trimmed)) score -= 8;
  if (/^\(\d+\)/.test(trimmed)) score -= 6;
  if (/(?:\(\d+\)\s*){2,}/.test(trimmed)) score -= 5;
  if (/^\d+\s*[A-ZÀ-Ú]{2,}/.test(trimmed) && BIBLIOGRAPHY_PATTERN.test(trimmed)) score -= 4;

  return score;
}

function stripFootnoteCluster(text: string): string {
  let cleaned = text;

  const clusterMatch = cleaned.match(/\(\s*1\s*\)\s+[A-ZÀ-Ú]/);
  if (clusterMatch?.index != null && clusterMatch.index > 120) {
    cleaned = cleaned.slice(0, clusterMatch.index).trim();
  }

  const numberedFootnotes = cleaned.match(/\(\s*\d+\s*\)/g) ?? [];
  if (numberedFootnotes.length >= 3) {
    const lastFootnotePos = cleaned.lastIndexOf(numberedFootnotes[numberedFootnotes.length - 1]!);
    const tail = cleaned.slice(lastFootnotePos);
    if (BIBLIOGRAPHY_PATTERN.test(tail) || FOOTNOTE_AUTHOR_PATTERN.test(tail)) {
      const firstTailFootnote = cleaned.search(/\(\s*\d+\s*\)\s+[A-ZÀ-Ú]/);
      if (firstTailFootnote > 120) {
        cleaned = cleaned.slice(0, firstTailFootnote).trim();
      }
    }
  }

  return cleaned;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;:])\s+(?=[A-ZÁÉÍÓÚ¿(0-9])|(?<=\.)\s+(?=CAP[ÍI]TULO)/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 15);
}

export function looksLikeBibliography(text: string): boolean {
  const sample = text.slice(0, 1200);
  if (!sample.trim()) return false;

  const footnoteMarkers = (sample.match(/\(\d+\)/g) ?? []).length;
  const legalHits = (sample.match(new RegExp(LEGAL_STUDY_PATTERN.source, "gi")) ?? []).length;
  const bibHits = BIBLIOGRAPHY_PATTERN.test(sample) || FOOTNOTE_AUTHOR_PATTERN.test(sample);

  return bibHits && footnoteMarkers >= 2 && legalHits <= 1;
}

export function cleanPageTextForStudy(raw: string): string {
  const normalized = normalizeWhitespace(raw);
  if (!normalized) return "";

  let text = stripFootnoteCluster(normalized);
  const sentences = splitSentences(text);

  if (!sentences.length) {
    return text.slice(0, 4000);
  }

  const kept = sentences.filter((sentence) => scoreStudySentence(sentence) >= 0);
  let result = normalizeWhitespace(kept.join(" "));

  if (result.length < 180) {
    const relaxed = sentences.filter((sentence) => scoreStudySentence(sentence) >= -2);
    result = normalizeWhitespace(relaxed.join(" "));
  }

  if (!result || looksLikeBibliography(result)) {
    const best = [...sentences]
      .sort((a, b) => scoreStudySentence(b) - scoreStudySentence(a))
      .slice(0, 8)
      .filter((sentence) => scoreStudySentence(sentence) >= 1);

    result = normalizeWhitespace(best.join(" "));
  }

  if (!result) {
    result = text.slice(0, 4000);
  }

  return result;
}

export function extractStudyTopicHint(text: string): string | undefined {
  const cleaned = cleanPageTextForStudy(text);
  const chapter = cleaned.match(/CAP[ÍI]TULO\s+[IVXLCDM\d]+[^.]{0,100}/i)?.[0];
  if (chapter) return chapter.trim();

  const section = cleaned.match(/(?:SECCI[ÓO]N|T[ÍI]TULO)\s+[A-ZÁÉÍÓÚ\d]+[^.]{0,80}/i)?.[0];
  if (section) return section.trim();

  const legal = cleaned.match(
    /(?:elementos|acto\s+jur[ií]dico|condici[oó]n|modo|plazo|t[ií]tulo)[^.]{10,90}/i,
  )?.[0];
  return legal?.trim();
}
