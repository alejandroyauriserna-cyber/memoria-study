import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeExpediente, normalizeJurisprudenceText } from "@/lib/jurisprudence/normalize-text";

export type DuplicateMatch = {
  id: string;
  title: string;
  expediente?: string;
  reason: "expediente" | "title";
};

function titleSimilarity(a: string, b: string): number {
  const na = normalizeJurisprudenceText(a);
  const nb = normalizeJurisprudenceText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.92;
  const wordsA = new Set(na.split(" ").filter((w) => w.length > 3));
  const wordsB = new Set(nb.split(" ").filter((w) => w.length > 3));
  if (!wordsA.size || !wordsB.size) return 0;
  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap += 1;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export async function findJurisprudenceDuplicates(
  admin: SupabaseClient,
  input: { title: string; expediente?: string | null },
): Promise<DuplicateMatch | null> {
  const normalizedExpediente = normalizeExpediente(input.expediente);

  if (normalizedExpediente) {
    const { data: byExpediente } = await admin
      .from("jurisprudence_documents")
      .select("id, title, expediente, status")
      .ilike("expediente", normalizedExpediente)
      .neq("status", "rejected")
      .limit(1)
      .maybeSingle();

    if (byExpediente) {
      return {
        id: byExpediente.id as string,
        title: byExpediente.title as string,
        expediente: (byExpediente.expediente as string | null) ?? undefined,
        reason: "expediente",
      };
    }
  }

  const { data: candidates } = await admin
    .from("jurisprudence_documents")
    .select("id, title, expediente, status")
    .neq("status", "rejected")
    .order("created_at", { ascending: false })
    .limit(200);

  for (const row of candidates ?? []) {
    const similarity = titleSimilarity(input.title, row.title as string);
    if (similarity >= 0.85) {
      return {
        id: row.id as string,
        title: row.title as string,
        expediente: (row.expediente as string | null) ?? undefined,
        reason: "title",
      };
    }
  }

  return null;
}
