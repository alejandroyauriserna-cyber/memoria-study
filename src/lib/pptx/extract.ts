import JSZip from "jszip";

const SLIDE_PATH = /^ppt\/slides\/slide(\d+)\.xml$/i;
const NOTES_PATH = /^ppt\/notesSlides\/notesSlide(\d+)\.xml$/i;
const MIN_USEFUL_TEXT_LENGTH = 50;

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
  const regex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
  let match = regex.exec(xml);

  while (match) {
    const segment = decodeXmlEntities(match[1] ?? "").trim();
    if (segment) {
      parts.push(segment);
    }
    match = regex.exec(xml);
  }

  return parts.join(" ");
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

type IndexedText = { index: number; text: string };

async function readIndexedTexts(
  zip: JSZip,
  pattern: RegExp,
): Promise<IndexedText[]> {
  const entries: IndexedText[] = [];

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    const match = path.match(pattern);
    if (!match) continue;

    const xml = await file.async("string");
    const text = normalizeText(extractTextFromOfficeXml(xml));
    if (text) {
      entries.push({ index: Number.parseInt(match[1] ?? "0", 10), text });
    }
  }

  return entries.sort((a, b) => a.index - b.index);
}

export async function extractPptxFromBuffer(buffer: Buffer) {
  let zip: JSZip;

  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    throw new Error(
      "No se pudo leer el archivo PowerPoint. Verifica que sea un .pptx válido.",
    );
  }

  const slides = await readIndexedTexts(zip, SLIDE_PATH);
  const notes = await readIndexedTexts(zip, NOTES_PATH);
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

  const combined = sections.join("\n").trim();

  if (combined.length < MIN_USEFUL_TEXT_LENGTH) {
    throw new Error(
      "No se extrajo texto de la presentación. Asegúrate de que las diapositivas tengan texto editable y no solo imágenes.",
    );
  }

  return combined;
}
