import type { JurisprudenceRecord } from "@/types/jurisprudence";
import type {
  JurisprudenceMateria,
  JurisprudenceTipo,
} from "@/types/jurisprudence";

/** Fila de `public.jurisprudence_documents` en Supabase. */
export type JurisprudenceDocumentRow = {
  id: string;
  title: string;
  tipo: JurisprudenceTipo;
  materia: JurisprudenceMateria;
  submateria: string;
  year: number;
  organo: string;
  summary: string;
  keywords: string[] | null;
  pdf_url: string;
  expediente: string | null;
  source_url?: string | null;
  is_public?: boolean | null;
  submitted_by?: string | null;
  status?: "published" | "pending" | "rejected" | null;
  rejection_reason?: string | null;
  file_name?: string | null;
  extracted_text?: string | null;
  sala?: string | null;
  distrito_judicial?: string | null;
  asunto_principal?: string | null;
  numero_documento?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function jurisprudenceRowToRecord(row: JurisprudenceDocumentRow): JurisprudenceRecord {
  return {
    id: row.id,
    title: row.title,
    tipo: row.tipo,
    materia: row.materia,
    submateria: row.submateria,
    year: row.year,
    organo: row.organo,
    summary: row.summary,
    keywords: row.keywords ?? [],
    pdfUrl: row.pdf_url,
    expediente: row.expediente ?? undefined,
    sala: row.sala ?? undefined,
    distritoJudicial: row.distrito_judicial ?? undefined,
    asuntoPrincipal: row.asunto_principal ?? undefined,
    numeroDocumento: row.numero_documento ?? undefined,
    isCommunityContribution: Boolean(row.submitted_by),
    submittedBy: row.submitted_by ?? undefined,
    status: row.status ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    embeddingReady: Boolean(row.extracted_text && row.extracted_text.length > 200),
  };
}

export function jurisprudenceRecordToRow(
  record: JurisprudenceRecord,
): Omit<JurisprudenceDocumentRow, "created_at" | "updated_at"> {
  return {
    id: record.id,
    title: record.title,
    tipo: record.tipo,
    materia: record.materia,
    submateria: record.submateria,
    year: record.year,
    organo: record.organo,
    summary: record.summary,
    keywords: record.keywords,
    pdf_url: record.pdfUrl,
    expediente: record.expediente ?? null,
    is_public: true,
  };
}
