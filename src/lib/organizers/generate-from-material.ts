import { generateOrganizerContent } from "@/lib/ai/generate-organizer";
import { downloadMaterialPdf } from "@/lib/organizers/download-material-pdf";
import { extractDocumentFromBuffer } from "@/lib/documents/extract";
import { prepareOrganizerText } from "@/lib/pdf/extract";
import type { StoredOrganizerContent } from "@/lib/ai/organizer-schema";

export const MIN_ORGANIZER_EXTRACTED_TEXT = 120;

type MaterialRow = {
  id: string;
  title: string;
  file_url: string;
  file_name: string | null;
  course_id: string;
  course_name: string;
  cycle_number: number;
  cycle_label: string;
};

export type OrganizerGenerationResult = {
  content: StoredOrganizerContent;
  title: string;
  description: string;
  material: MaterialRow;
  extraction: {
    method: string;
    truncated: boolean;
    charCount: number;
  };
};

export async function generateOrganizerFromMaterial(
  material: MaterialRow,
): Promise<OrganizerGenerationResult> {
  const { buffer, fileName } = await downloadMaterialPdf(material.file_url);

  let extractedText = "";
  let extractionMethod = "unknown";

  try {
    const extraction = await extractDocumentFromBuffer(buffer, material.file_name || fileName);
    extractedText = extraction.text;
    extractionMethod = extraction.method;
  } catch (extractionError) {
    throw new Error(
      extractionError instanceof Error
        ? extractionError.message
        : "No se pudo leer el PDF del material.",
    );
  }

  if (!extractedText || extractedText.trim().length < MIN_ORGANIZER_EXTRACTED_TEXT) {
    throw new Error(
      "No se pudo extraer texto suficiente del material. Si es PDF escaneado verifica GEMINI_API_KEY; si es PowerPoint, sube el .pptx con texto editable.",
    );
  }

  const prepared = prepareOrganizerText(extractedText);
  const content = await generateOrganizerContent({
    sourceName: material.file_name || fileName,
    text: prepared.text,
    materialTitle: material.title,
  });

  return {
    content,
    title: `Organizador IA para ${material.title}`,
    description: `Organizador generado a partir del contenido del PDF "${material.title}".`,
    material,
    extraction: {
      method: extractionMethod,
      truncated: prepared.truncated,
      charCount: prepared.text.length,
    },
  };
}
