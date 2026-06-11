import type { JurisprudenceRecord, JurisprudenceSearchFilters } from "@/types/jurisprudence";
import type { searchJurisprudenceRecords } from "@/lib/jurisprudence/search";

export type JurisprudenceRepository = {
  listAll(): Promise<JurisprudenceRecord[]>;
  getById(id: string): Promise<JurisprudenceRecord | null>;
  search(filters: JurisprudenceSearchFilters): Promise<ReturnType<typeof searchJurisprudenceRecords>>;
  getFilterOptions(): Promise<{ organos: string[]; years: number[] }>;
};
