import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { getJurisprudenceRepository } from "@/lib/jurisprudence/repository";
import type { JurisprudenceRecord } from "@/types/jurisprudence";

const STOP_WORDS = new Set([
  "para", "como", "este", "esta", "estos", "estas", "sobre", "entre", "desde",
  "hasta", "donde", "cuando", "cual", "cuales", "todo", "toda", "todos", "todas",
  "puede", "pueden", "debe", "deben", "ser", "son", "del", "las", "los", "una", "uno",
  "con", "por", "que", "sus", "ese", "esa", "derecho", "articulo", "articulos",
]);

function extractQueryTerms(text: string, maxTerms = 8): string[] {
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([word]) => word);
}

async function loadFavoriteRecords(userId?: string): Promise<JurisprudenceRecord[]> {
  if (!userId || !hasSupabaseEnv()) return [];

  const admin = createAdminClient();
  const { data: favs } = await admin
    .from("jurisprudence_favorites")
    .select("document_id")
    .eq("user_id", userId)
    .limit(12);

  const ids = (favs ?? []).map((row) => row.document_id as string);
  if (!ids.length) return [];

  const repo = getJurisprudenceRepository();
  const records = await Promise.all(ids.map((id) => repo.getById(id)));
  return records.filter((r): r is JurisprudenceRecord => Boolean(r));
}

export async function findRelevantJurisprudenceForTutor(input: {
  pageText: string;
  chapterTitle?: string;
  customPrompt?: string;
  userId?: string;
  limit?: number;
}): Promise<JurisprudenceRecord[]> {
  const limit = input.limit ?? 6;
  const terms = extractQueryTerms(
    `${input.pageText} ${input.chapterTitle ?? ""} ${input.customPrompt ?? ""}`,
  );

  const repo = getJurisprudenceRepository();
  const query = terms.slice(0, 4).join(" ");

  const [searchResult, favorites] = await Promise.all([
    query
      ? repo.search({ query, limit: limit + 2 })
      : repo.search({ limit: limit + 2 }),
    loadFavoriteRecords(input.userId),
  ]);

  const seen = new Set<string>();
  const merged: JurisprudenceRecord[] = [];

  for (const record of [...favorites, ...searchResult.items]) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    merged.push(record);
    if (merged.length >= limit) break;
  }

  return merged;
}

export function formatJurisprudenceForTutorPrompt(records: JurisprudenceRecord[]): string {
  if (!records.length) {
    return "BIBLIOTECA JURÍDICA (MemoriaStudy): no hay resoluciones indexadas que coincidan con esta página. No cites fallos inventados.";
  }

  const lines = records.map((record, index) => {
    const parts = [
      `${index + 1}. ${record.title} (${record.year})`,
      `   Órgano: ${record.organo} | Materia: ${record.materia} | Tipo: ${record.tipo}`,
      record.expediente ? `   Expediente: ${record.expediente}` : null,
      `   Resumen: ${record.summary.slice(0, 280)}${record.summary.length > 280 ? "…" : ""}`,
      record.pdfUrl ? `   PDF: ${record.pdfUrl}` : null,
    ].filter(Boolean);
    return parts.join("\n");
  });

  return [
    "BIBLIOTECA JURÍDICA (MemoriaStudy) — resoluciones publicadas verificadas por moderadores UNT.",
    "Cita SOLO estas resoluciones cuando el estudiante pida jurisprudencia. No inventes expedientes ni fallos.",
    "",
    ...lines,
  ].join("\n");
}
