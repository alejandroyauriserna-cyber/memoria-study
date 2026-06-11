import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { getJurisprudenceRepository } from "@/lib/jurisprudence/repository";
import {
  parseMateriaParam,
  parseOrganosParam,
  parseTipoParam,
  parseYearsParam,
} from "@/lib/jurisprudence/filters";

export const runtime = "nodejs";

async function loadFavoriteIds(): Promise<string[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jurisprudence_favorites")
    .select("document_id")
    .eq("user_id", user.id);

  if (error) return [];
  return (data ?? []).map((row) => row.document_id as string);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";
    const suggest = url.searchParams.get("suggest") === "1";
    const favoritesOnly = url.searchParams.get("favorites") === "1";
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? (suggest ? 8 : 30))));

    const favoriteIds = favoritesOnly ? await loadFavoriteIds() : undefined;
    const docId = url.searchParams.get("doc")?.trim() || undefined;

    const repo = getJurisprudenceRepository();
    const filterOptions = await repo.getFilterOptions();

    const result = await repo.search({
      query: query || undefined,
      materias: parseMateriaParam(url.searchParams.get("materia")),
      tipos: parseTipoParam(url.searchParams.get("tipo")),
      years: parseYearsParam(url.searchParams.get("year")),
      organos: parseOrganosParam(url.searchParams.get("organo")),
      favoritesOnly,
      favoriteIds,
      limit: suggest ? 6 : limit,
    });

    if (docId && !suggest) {
      const doc = await repo.getById(docId);
      if (doc && !result.items.some((item) => item.id === docId)) {
        result.items = [doc, ...result.items];
        result.total += 1;
      }
    }

    if (suggest) {
      return NextResponse.json({
        suggestions: result.suggestions,
        items: result.items.slice(0, 6),
      });
    }

    return NextResponse.json({
      ...result,
      filterOptions,
    });
  } catch (caught) {
    return NextResponse.json(
      {
        error: caught instanceof Error ? caught.message : "Error buscando jurisprudencia.",
        items: [],
        total: 0,
        facets: { materias: {}, tipos: {}, years: {}, organos: {} },
      },
      { status: 500 },
    );
  }
}
