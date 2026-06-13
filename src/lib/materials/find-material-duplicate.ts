import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeMaterialFileName,
  normalizeMaterialText,
} from "@/lib/materials/normalize-material-text";

export type MaterialDuplicateMatch = {
  id: string;
  title: string;
  reason: "file_hash" | "file_name" | "title";
};

function titleSimilarity(a: string, b: string): number {
  const na = normalizeMaterialText(a);
  const nb = normalizeMaterialText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.92;

  const wordsA = new Set(na.split(" ").filter((word) => word.length > 3));
  const wordsB = new Set(nb.split(" ").filter((word) => word.length > 3));
  if (!wordsA.size || !wordsB.size) return 0;

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap += 1;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export async function findMaterialDuplicate(
  admin: SupabaseClient,
  input: {
    fileHash: string;
    title: string;
    courseId: string;
    fileName: string;
  },
): Promise<MaterialDuplicateMatch | null> {
  const { data: byHash, error: hashError } = await admin
    .from("materials")
    .select("id, title")
    .eq("is_public", true)
    .eq("file_hash", input.fileHash)
    .maybeSingle();

  if (!hashError && byHash) {
    return {
      id: byHash.id as string,
      title: byHash.title as string,
      reason: "file_hash",
    };
  }

  const normalizedFile = normalizeMaterialFileName(input.fileName);
  const { data: courseMaterials } = await admin
    .from("materials")
    .select("id, title, file_name")
    .eq("is_public", true)
    .eq("course_id", input.courseId)
    .order("created_at", { ascending: false })
    .limit(300);

  for (const row of courseMaterials ?? []) {
    if (
      normalizedFile.length >= 3 &&
      normalizeMaterialFileName(String(row.file_name ?? "")) === normalizedFile
    ) {
      return {
        id: row.id as string,
        title: row.title as string,
        reason: "file_name",
      };
    }
  }

  for (const row of courseMaterials ?? []) {
    if (titleSimilarity(input.title, String(row.title ?? "")) >= 0.88) {
      return {
        id: row.id as string,
        title: row.title as string,
        reason: "title",
      };
    }
  }

  return null;
}
