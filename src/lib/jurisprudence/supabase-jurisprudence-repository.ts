import type { SupabaseClient } from "@supabase/supabase-js";
import type { JurisprudenceRecord, JurisprudenceSearchFilters } from "@/types/jurisprudence";
import {
  jurisprudenceRowToRecord,
  type JurisprudenceDocumentRow,
} from "@/lib/jurisprudence/mapper";
import {
  getDistinctOrganos,
  getDistinctYears,
  searchJurisprudenceRecords,
} from "@/lib/jurisprudence/search";
import { hasUsableJurisprudencePdfUrl } from "@/lib/jurisprudence/pdf-url";
import type { JurisprudenceRepository } from "@/lib/jurisprudence/repository-types";

function browsableRecords(records: JurisprudenceRecord[]): JurisprudenceRecord[] {
  return records.filter((record) => hasUsableJurisprudencePdfUrl(record.pdfUrl));
}

/**
 * Repositorio fase 2 — lee desde `public.jurisprudence_documents`.
 * Los filtros estructurados se aplican en SQL; el scoring de texto reutiliza `search.ts`.
 */
export class SupabaseJurisprudenceRepository implements JurisprudenceRepository {
  constructor(private readonly admin: SupabaseClient) {}

  async listAll(): Promise<JurisprudenceRecord[]> {
    const { data, error } = await this.admin
      .from("jurisprudence_documents")
      .select("*")
      .eq("is_public", true)
      .eq("status", "published")
      .order("year", { ascending: false });

    if (error) throw new Error(error.message);
    return browsableRecords(
      (data as JurisprudenceDocumentRow[]).map(jurisprudenceRowToRecord),
    );
  }

  async getById(id: string): Promise<JurisprudenceRecord | null> {
    const { data, error } = await this.admin
      .from("jurisprudence_documents")
      .select("*")
      .eq("id", id)
      .eq("is_public", true)
      .eq("status", "published")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return jurisprudenceRowToRecord(data as JurisprudenceDocumentRow);
  }

  async search(filters: JurisprudenceSearchFilters) {
    if (filters.favoritesOnly && !filters.favoriteIds?.length) {
      return searchJurisprudenceRecords([], filters);
    }

    let query = this.admin
      .from("jurisprudence_documents")
      .select("*")
      .eq("is_public", true)
      .eq("status", "published");

    if (filters.materias?.length) {
      query = query.in("materia", filters.materias);
    }
    if (filters.tipos?.length) {
      query = query.in("tipo", filters.tipos);
    }
    if (filters.years?.length) {
      query = query.in("year", filters.years);
    }
    if (filters.organos?.length) {
      query = query.in("organo", filters.organos);
    }
    if (filters.favoritesOnly && filters.favoriteIds?.length) {
      query = query.in("id", filters.favoriteIds);
    }

    const textQuery = filters.query?.trim();
    if (textQuery) {
      query = query.textSearch("search_vector", textQuery, {
        config: "spanish",
        type: "websearch",
      });
    }

    const { data, error } = await query.order("year", { ascending: false });

    if (error) throw new Error(error.message);

    const catalog = browsableRecords(
      (data as JurisprudenceDocumentRow[]).map(jurisprudenceRowToRecord),
    );
    return searchJurisprudenceRecords(catalog, filters);
  }

  async getFilterOptions() {
    const catalog = await this.listAll();
    return {
      organos: getDistinctOrganos(catalog),
      years: getDistinctYears(catalog),
    };
  }
}
