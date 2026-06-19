import JSZip from "jszip";

const MIN_USEFUL_TEXT_LENGTH = 50;

const SUPPLEMENTAL_XML_PATH =
  /^ppt\/(slidelayouts|slidemasters|notesmasters)\/[^/]+\.xml$/i;

const FALLBACK_XML_PATH = /^ppt\/(slides|notesslides|slidelayouts|slidemasters|notesmasters)\/[^/]+\.xml$/i;

function normalizeZipPath(path: string) {
  return path.replace(/\\/g, "/");
}

function decodeXmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function extractTextFromOfficeXml(xml: string) {
  const parts: string[] = [];
  const regex = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
  let match = regex.exec(xml);

  while (match) {
    const segment = decodeXmlEntities((match[1] ?? "").replace(/<[^>]+>/g, "")).trim();
    if (segment) {
      parts.push(segment);
    }
    match = regex.exec(xml);
  }

  return parts.join(" ");
}

function extractDocPropsText(xml: string) {
  const fields: string[] = [];
  const patterns = [
    /<dc:title[^>]*>([\s\S]*?)<\/dc:title>/gi,
    /<dc:subject[^>]*>([\s\S]*?)<\/dc:subject>/gi,
    /<dc:description[^>]*>([\s\S]*?)<\/dc:description>/gi,
    /<cp:keywords[^>]*>([\s\S]*?)<\/cp:keywords>/gi,
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(xml);
    while (match) {
      const value = decodeXmlEntities((match[1] ?? "").replace(/<[^>]+>/g, "")).trim();
      if (value) fields.push(value);
      match = pattern.exec(xml);
    }
  }

  return fields.join(" ");
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function uniqueSegments(segments: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const segment of segments) {
    const normalized = normalizeText(segment);
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    unique.push(normalized);
  }

  return unique;
}

type IndexedText = { index: number; text: string };

function slideIndexFromPath(path: string) {
  const normalized = normalizeZipPath(path);
  const slideMatch = normalized.match(/ppt\/slides\/slide(\d+)\.xml$/i);
  if (slideMatch) {
    return Number.parseInt(slideMatch[1] ?? "0", 10);
  }

  const notesMatch = normalized.match(/ppt\/notesslides\/notesslide(\d+)\.xml$/i);
  if (notesMatch) {
    return Number.parseInt(notesMatch[1] ?? "0", 10);
  }

  return null;
}

async function readIndexedTexts(
  zip: JSZip,
  kind: "slide" | "notes",
): Promise<IndexedText[]> {
  const entries: IndexedText[] = [];

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    const normalized = normalizeZipPath(path);
    const index = slideIndexFromPath(path);
    if (index === null) continue;

    const isSlide = /ppt\/slides\/slide\d+\.xml$/i.test(normalized);
    const isNotes = /ppt\/notesslides\/notesslide\d+\.xml$/i.test(normalized);
    if ((kind === "slide" && !isSlide) || (kind === "notes" && !isNotes)) {
      continue;
    }

    const xml = await file.async("string");
    const text = normalizeText(extractTextFromOfficeXml(xml));
    if (text) {
      entries.push({ index, text });
    }
  }

  return entries.sort((a, b) => a.index - b.index);
}

async function readDocProps(zip: JSZip) {
  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    if (!/docprops\/core\.xml$/i.test(normalizeZipPath(path))) continue;

    const xml = await file.async("string");
    const text = normalizeText(extractDocPropsText(xml));
    if (text) return text;
  }

  return "";
}

async function readSupplementalTexts(zip: JSZip) {
  const segments: string[] = [];

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    const normalized = normalizeZipPath(path);
    if (!SUPPLEMENTAL_XML_PATH.test(normalized)) continue;

    const xml = await file.async("string");
    const text = normalizeText(extractTextFromOfficeXml(xml));
    if (text.length >= 12) {
      segments.push(text);
    }
  }

  return uniqueSegments(segments).join("\n\n");
}

async function readFallbackTexts(zip: JSZip) {
  const segments: string[] = [];

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    const normalized = normalizeZipPath(path);
    if (!FALLBACK_XML_PATH.test(normalized)) continue;

    const xml = await file.async("string");
    const text = normalizeText(extractTextFromOfficeXml(xml));
    if (text.length >= 12) {
      segments.push(text);
    }
  }

  return uniqueSegments(segments).join("\n\n");
}

function buildSlideDocument(slides: IndexedText[], notes: IndexedText[]) {
  const notesBySlide = new Map(notes.map((entry) => [entry.index, entry.text]));
  const sections: string[] = [];

  for (const slide of slides) {
    sections.push(`--- Diapositiva ${slide.index} ---`);
    sections.push(slide.text);

    const speakerNotes = notesBySlide.get(slide.index);
    if (speakerNotes) {
      sections.push(`--- Notas del presentador (diapositiva ${slide.index}) ---`);
      sections.push(speakerNotes);
    }

    sections.push("");
  }

  for (const note of notes) {
    if (slides.some((slide) => slide.index === note.index)) {
      continue;
    }

    sections.push(`--- Notas (diapositiva ${note.index}) ---`);
    sections.push(note.text);
    sections.push("");
  }

  return sections.join("\n").trim();
}

function mergeExtractedParts(parts: string[]) {
  return uniqueSegments(parts.filter(Boolean)).join("\n\n").trim();
}

export async function extractPptxFromBuffer(buffer: Buffer) {
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error(
      "No se pudo leer el archivo PowerPoint. Verifica que sea un .pptx válido (no .ppt antiguo ni PDF renombrado).",
    );
  }

  const slides = await readIndexedTexts(zip, "slide");
  const notes = await readIndexedTexts(zip, "notes");
  const docProps = await readDocProps(zip);
  const supplemental = await readSupplementalTexts(zip);

  let combined = mergeExtractedParts([
    docProps ? `--- Metadatos de la presentación ---\n${docProps}` : "",
    buildSlideDocument(slides, notes),
    supplemental ? `--- Texto adicional de plantillas ---\n${supplemental}` : "",
  ]);

  if (combined.length < MIN_USEFUL_TEXT_LENGTH) {
    const fallback = await readFallbackTexts(zip);
    combined = mergeExtractedParts([
      docProps ? `--- Metadatos de la presentación ---\n${docProps}` : "",
      fallback,
    ]);
  }

  if (combined.length < MIN_USEFUL_TEXT_LENGTH) {
    throw new Error(
      "No se extrajo texto de la presentación. Usa el .pptx original con texto editable; si solo exportaste a PDF o las diapositivas son imágenes, la IA no podrá leerlas.",
    );
  }

  return combined;
}
