import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { recordToMaterial } from "@/lib/materials/mapper";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ materials: [] });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";
    const favoritesOnly = url.searchParams.get("favorites") === "1";

    const admin = createAdminClient();
    let queryBuilder = admin.from("materials").select("*").eq("is_public", true).order("created_at", { ascending: false });

    if (query) {
      const term = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
      queryBuilder = queryBuilder.or(
        `title.ilike.${term},description.ilike.${term},file_name.ilike.${term},course_name.ilike.${term},material_type.ilike.${term},author_name.ilike.${term}`,
      );
    }

    const { data, error } = await queryBuilder;
    if (error) {
      throw error;
    }

    let favoriteIds = new Set<string>();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: favorites, error: favoritesError } = await admin
        .schema("public")
        .from("favorites")
        .select("material_id")
        .eq("user_id", user.id);

      if (favoritesError) {
        throw favoritesError;
      }

      favoriteIds = new Set((favorites ?? []).map((favorite) => favorite.material_id as string));
    }

    const materials = (data ?? [])
      .map((record) => ({
        ...recordToMaterial(record),
        isFavorite: favoriteIds.has(record.id),
      }))
      .filter((material) => !favoritesOnly || material.isFavorite);

    return NextResponse.json({ materials });
  } catch (caught) {
    return NextResponse.json({
      error: caught instanceof Error ? caught.message : "Error buscando materiales.",
      materials: [],
    }, { status: 500 });
  }
}
