import type { SupabaseClient } from "@supabase/supabase-js";
import type { JurisprudenceDocumentRow } from "@/lib/jurisprudence/mapper";

const BUCKET = "jurisprudence-pdfs";

export function jurisprudencePdfStoragePathFromUrl(pdfUrl: string | null | undefined): string | null {
  const url = pdfUrl?.trim();
  if (!url) return null;

  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}

export async function deleteJurisprudenceContribution(
  admin: SupabaseClient,
  row: Pick<JurisprudenceDocumentRow, "id" | "pdf_url" | "file_name">,
): Promise<void> {
  const storagePath = jurisprudencePdfStoragePathFromUrl(row.pdf_url);
  if (storagePath) {
    await admin.storage.from(BUCKET).remove([storagePath]);
  }

  const { error } = await admin.from("jurisprudence_documents").delete().eq("id", row.id);
  if (error) throw new Error(error.message);
}
