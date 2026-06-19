import { MAX_FILE_SIZE } from "@/lib/pdf/constants";

/** Sentencias y resoluciones oficiales pueden ser extensas; mismo techo que Materiales. */
export const JURISPRUDENCE_MAX_FILE_SIZE = MAX_FILE_SIZE;

/** Lotes del ingest inteligente en admin. */
export const JURISPRUDENCE_MAX_BATCH_FILES = 200;

export function jurisprudenceMaxFileSizeMb(): number {
  return Math.round(JURISPRUDENCE_MAX_FILE_SIZE / (1024 * 1024));
}

export function jurisprudenceMaxFileSizeLabel(): string {
  return `${jurisprudenceMaxFileSizeMb()} MB`;
}
