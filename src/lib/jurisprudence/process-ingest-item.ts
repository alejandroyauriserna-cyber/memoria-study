import type { SupabaseClient } from "@supabase/supabase-js";
import { extractPdfFromBuffer, prepareTextForGeneration } from "@/lib/pdf/extract";
import {
  extractJurisprudenceMetadataWithAi,
  computeOverallConfidence,
  itemNeedsReview,
} from "@/lib/jurisprudence/ai-extract-metadata";
import {
  buildJurisprudenceDocumentId,
  ensureUniqueJurisprudenceId,
} from "@/lib/jurisprudence/build-document-id";
import { findJurisprudenceDuplicates } from "@/lib/jurisprudence/find-duplicates";
import type {
  IngestItemStatus,
  JurisprudenceFieldConfidence,
  JurisprudenceSuggestedMetadata,
} from "@/types/jurisprudence-ingest";
import { INGEST_HIGH_CONFIDENCE } from "@/types/jurisprudence-ingest";

const BUCKET = "jurisprudence-pdfs";
const MAX_STORED_CHARS = 120_000;

export type IngestItemRow = {
  id: string;
  batch_id: string;
  file_name: string;
  storage_path: string;
  pdf_url: string | null;
  status: IngestItemStatus;
  extracted_text: string | null;
  suggested: JurisprudenceSuggestedMetadata | null;
  confidence: JurisprudenceFieldConfidence | null;
  duplicate_of: string | null;
  error_message: string | null;
  document_id: string | null;
};

export async function downloadIngestPdf(
  admin: SupabaseClient,
  storagePath: string,
): Promise<Buffer | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(storagePath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function processIngestItem(
  admin: SupabaseClient,
  item: IngestItemRow,
): Promise<IngestItemStatus> {
  await admin
    .from("jurisprudence_ingest_items")
    .update({ status: "extracting", error_message: null })
    .eq("id", item.id);

  const buffer = await downloadIngestPdf(admin, item.storage_path);
  if (!buffer) {
    await admin
      .from("jurisprudence_ingest_items")
      .update({ status: "failed", error_message: "No se pudo leer el PDF." })
      .eq("id", item.id);
    return "failed";
  }

  let extractedText: string;
  try {
    const { text } = await extractPdfFromBuffer(buffer, item.file_name);
    extractedText = prepareTextForGeneration(text, MAX_STORED_CHARS).text;
  } catch {
    await admin
      .from("jurisprudence_ingest_items")
      .update({ status: "failed", error_message: "Extracción de texto fallida." })
      .eq("id", item.id);
    return "failed";
  }

  if (extractedText.length < 80) {
    await admin
      .from("jurisprudence_ingest_items")
      .update({
        status: "failed",
        extracted_text: extractedText,
        error_message: "Texto insuficiente — PDF escaneado o vacío.",
      })
      .eq("id", item.id);
    return "failed";
  }

  await admin
    .from("jurisprudence_ingest_items")
    .update({ status: "analyzing", extracted_text: extractedText })
    .eq("id", item.id);

  try {
    const { suggested, confidence } = await extractJurisprudenceMetadataWithAi({
      extractedText,
      fileName: item.file_name,
    });

    const duplicate = await findJurisprudenceDuplicates(admin, {
      title: suggested.title,
      expediente: suggested.expediente ?? null,
    });

    if (duplicate) {
      await admin
        .from("jurisprudence_ingest_items")
        .update({
          status: "duplicate",
          suggested,
          confidence,
          duplicate_of: duplicate.id,
          error_message: `Duplicado de ${duplicate.id}`,
        })
        .eq("id", item.id);
      return "duplicate";
    }

    const needsReview = itemNeedsReview(confidence, INGEST_HIGH_CONFIDENCE);
    const status: IngestItemStatus = needsReview ? "low_confidence" : "ready";

    await admin
      .from("jurisprudence_ingest_items")
      .update({
        status,
        suggested,
        confidence,
        duplicate_of: null,
        error_message: null,
      })
      .eq("id", item.id);

    return status;
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Error de análisis IA.";
    await admin
      .from("jurisprudence_ingest_items")
      .update({
        status: "failed",
        extracted_text: extractedText,
        error_message: message,
      })
      .eq("id", item.id);
    return "failed";
  }
}

export async function publishIngestItem(
  admin: SupabaseClient,
  item: IngestItemRow,
  moderatorUserId: string,
  publish: boolean,
): Promise<{ documentId: string } | { error: string }> {
  const suggested = item.suggested;
  if (!suggested) return { error: "Sin metadatos sugeridos." };

  const duplicate = await findJurisprudenceDuplicates(admin, {
    title: suggested.title,
    expediente: suggested.expediente ?? null,
  });
  if (duplicate) {
    return { error: `Duplicado: ${duplicate.id}` };
  }

  const baseId = buildJurisprudenceDocumentId(suggested.expediente ?? null, suggested.title);
  let documentId = baseId;

  const pdfUrl =
    item.pdf_url ??
    (item.storage_path
      ? admin.storage.from(BUCKET).getPublicUrl(item.storage_path).data.publicUrl
      : "");

  const payload = {
    id: documentId,
    title: suggested.title,
    tipo: suggested.tipo,
    materia: suggested.materia,
    submateria: suggested.submateria,
    year: suggested.year,
    organo: suggested.organo,
    summary: suggested.summary,
    keywords: suggested.keywords,
    pdf_url: pdfUrl,
    expediente: suggested.expediente ?? null,
    source_url: pdfUrl,
    file_name: item.file_name,
    sala: suggested.sala ?? null,
    distrito_judicial: suggested.distritoJudicial ?? null,
    asunto_principal: suggested.asuntoPrincipal ?? null,
    numero_documento: suggested.numeroDocumento ?? null,
    extracted_text: item.extracted_text,
    submitted_by: moderatorUserId,
    status: publish ? "published" : "pending",
    is_public: publish,
  };

  let { data, error } = await admin.from("jurisprudence_documents").insert(payload).select("id").single();

  if (error?.code === "23505") {
    documentId = ensureUniqueJurisprudenceId(baseId, crypto.randomUUID().slice(0, 8));
    const retry = await admin
      .from("jurisprudence_documents")
      .insert({ ...payload, id: documentId })
      .select("id")
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error || !data) {
    return { error: error?.message ?? "No se pudo publicar." };
  }

  await admin
    .from("jurisprudence_ingest_items")
    .update({
      status: publish ? "published" : "approved",
      document_id: data.id as string,
    })
    .eq("id", item.id);

  return { documentId: data.id as string };
}

export function ingestItemToReview(item: IngestItemRow) {
  const overall = computeOverallConfidence(item.confidence ?? undefined);
  return {
    id: item.id,
    batchId: item.batch_id,
    fileName: item.file_name,
    pdfUrl: item.pdf_url ?? undefined,
    status: item.status,
    suggested: item.suggested ?? undefined,
    confidence: item.confidence ?? undefined,
    duplicateOf: item.duplicate_of ?? undefined,
    errorMessage: item.error_message ?? undefined,
    documentId: item.document_id ?? undefined,
    overallConfidence: Math.round(overall * 100),
    needsReview: itemNeedsReview(item.confidence ?? undefined, INGEST_HIGH_CONFIDENCE),
  };
}
