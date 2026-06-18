import type { JurisprudenceMateria, JurisprudenceTipo } from "@/types/jurisprudence";

export type IngestBatchStatus = "uploading" | "processing" | "review" | "completed" | "failed";

export type IngestItemStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "ready"
  | "low_confidence"
  | "duplicate"
  | "failed"
  | "approved"
  | "published";

export type JurisprudenceSuggestedMetadata = {
  title: string;
  tipo: JurisprudenceTipo;
  numeroDocumento?: string;
  year: number;
  organo: string;
  sala?: string;
  distritoJudicial?: string;
  materia: JurisprudenceMateria;
  submateria: string;
  keywords: string[];
  asuntoPrincipal?: string;
  summary: string;
  expediente?: string;
};

export type JurisprudenceFieldConfidence = {
  title?: number;
  tipo?: number;
  numeroDocumento?: number;
  year?: number;
  organo?: number;
  sala?: number;
  distritoJudicial?: number;
  materia?: number;
  submateria?: number;
  keywords?: number;
  asuntoPrincipal?: number;
  summary?: number;
  expediente?: number;
};

export type IngestReviewItem = {
  id: string;
  batchId: string;
  fileName: string;
  pdfUrl?: string;
  status: IngestItemStatus;
  suggested?: JurisprudenceSuggestedMetadata;
  confidence?: JurisprudenceFieldConfidence;
  duplicateOf?: string;
  errorMessage?: string;
  documentId?: string;
  overallConfidence: number;
  needsReview: boolean;
};

export type IngestBatchSummary = {
  id: string;
  label?: string;
  status: IngestBatchStatus;
  totalCount: number;
  processedCount: number;
  publishedCount: number;
  createdAt: string;
};

export const INGEST_HIGH_CONFIDENCE = 0.85;
export const INGEST_LOW_CONFIDENCE = 0.7;
