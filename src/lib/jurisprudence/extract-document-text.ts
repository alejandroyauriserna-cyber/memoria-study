import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPdfFromBuffer, prepareTextForGeneration } from "@/lib/pdf/extract";
import type { JurisprudenceDocumentRow } from "@/lib/jurisprudence/mapper";

const MAX_STORED_CHARS = 120_000;

export async function extractAndStoreJurisprudenceText(
  admin: SupabaseClient,
  document: JurisprudenceDocumentRow,
): Promise<{ extracted: boolean; chars: number }> {
  if (document.extracted_text && document.extracted_text.length > 100) {
    return { extracted: true, chars: document.extracted_text.length };
  }

  if (!document.pdf_url?.trim()) {
    return { extracted: false, chars: 0 };
  }

  let buffer: Buffer;
  try {
    const response = await fetch(document.pdf_url, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) return { extracted: false, chars: 0 };
    buffer = Buffer.from(await response.arrayBuffer());
  } catch {
    return { extracted: false, chars: 0 };
  }

  const fileName = document.file_name ?? `${document.id}.pdf`;

  try {
    const { text } = await extractPdfFromBuffer(buffer, fileName);
    const prepared = prepareTextForGeneration(text, MAX_STORED_CHARS);
    const { error } = await admin
      .from("jurisprudence_documents")
      .update({ extracted_text: prepared.text })
      .eq("id", document.id);

    if (error) return { extracted: false, chars: 0 };
    return { extracted: true, chars: prepared.text.length };
  } catch {
    return { extracted: false, chars: 0 };
  }
}
