import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv, env } from "@/lib/env";
import type { JurisprudenceRecord, JurisprudenceSearchFilters } from "@/types/jurisprudence";
import { JURISPRUDENCE_SEED, getJurisprudenceSeedById } from "@/lib/jurisprudence/seed-data";
import {
  getDistinctOrganos,
  getDistinctYears,
  searchJurisprudenceRecords,
} from "@/lib/jurisprudence/search";
import { SupabaseJurisprudenceRepository } from "@/lib/jurisprudence/supabase-jurisprudence-repository";
import type { JurisprudenceRepository } from "@/lib/jurisprudence/repository-types";

export type { JurisprudenceRepository } from "@/lib/jurisprudence/repository-types";

class LocalSeedJurisprudenceRepository implements JurisprudenceRepository {
  async listAll(): Promise<JurisprudenceRecord[]> {
    return [...JURISPRUDENCE_SEED];
  }

  async getById(id: string): Promise<JurisprudenceRecord | null> {
    return getJurisprudenceSeedById(id) ?? null;
  }

  async search(filters: JurisprudenceSearchFilters) {
    return searchJurisprudenceRecords(JURISPRUDENCE_SEED, filters);
  }

  async getFilterOptions() {
    return {
      organos: getDistinctOrganos(JURISPRUDENCE_SEED),
      years: getDistinctYears(JURISPRUDENCE_SEED),
    };
  }
}

let repositoryInstance: JurisprudenceRepository | null = null;

function canUseSupabaseRepository(): boolean {
  return Boolean(hasSupabaseEnv() && env.supabaseServiceRoleKey);
}

export function getJurisprudenceRepository(): JurisprudenceRepository {
  if (!repositoryInstance) {
    repositoryInstance = canUseSupabaseRepository()
      ? new SupabaseJurisprudenceRepository(createAdminClient())
      : new LocalSeedJurisprudenceRepository();
  }
  return repositoryInstance;
}

/** Permite inyectar repositorio en tests. */
export function setJurisprudenceRepository(repo: JurisprudenceRepository): void {
  repositoryInstance = repo;
}

/** Fuerza recrear el singleton (p. ej. tras cambiar env en tests). */
export function resetJurisprudenceRepository(): void {
  repositoryInstance = null;
}

export function getJurisprudenceRepositoryMode(): "supabase" | "local-seed" {
  return canUseSupabaseRepository() ? "supabase" : "local-seed";
}
