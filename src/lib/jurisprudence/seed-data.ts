import type { JurisprudenceRecord } from "@/types/jurisprudence";

/**
 * Fase 1 fallback local — vacío a propósito.
 * El catálogo vive en Supabase (`jurisprudence_documents`).
 * Solo entradas con PDF o enlace oficial real (aportes comunitarios o curación manual).
 */
export const JURISPRUDENCE_SEED: JurisprudenceRecord[] = [];

export function getJurisprudenceSeedById(id: string): JurisprudenceRecord | undefined {
  return JURISPRUDENCE_SEED.find((record) => record.id === id);
}
