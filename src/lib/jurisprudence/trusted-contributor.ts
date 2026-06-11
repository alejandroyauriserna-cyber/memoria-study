import type { SupabaseClient } from "@supabase/supabase-js";
import { readServerEnv } from "@/lib/env/runtime";

const DEFAULT_TRUSTED_THRESHOLD = 3;

export function getTrustedApprovalThreshold(): number {
  const raw = readServerEnv("JURISPRUDENCE_TRUSTED_APPROVALS");
  const parsed = raw ? Number(raw) : DEFAULT_TRUSTED_THRESHOLD;
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_TRUSTED_THRESHOLD;
  return Math.floor(parsed);
}

export async function countPublishedContributionsByUser(
  admin: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("jurisprudence_documents")
    .select("id", { count: "exact", head: true })
    .eq("submitted_by", userId)
    .eq("status", "published");

  if (error) return 0;
  return count ?? 0;
}

export async function isTrustedJurisprudenceContributor(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const approved = await countPublishedContributionsByUser(admin, userId);
  return approved >= getTrustedApprovalThreshold();
}
