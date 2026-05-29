import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    const admin = createAdminClient();
    let queryBuilder = admin.from("materials").select("*").eq("is_public", true).order("created_at", { ascending: false });

    if (query) {
      const term = `%${query.replace(/%/g, "\\%")}%`;
      queryBuilder = queryBuilder.or(
        `title.ilike.${term},description.ilike.${term},course_name.ilike.${term},material_type.ilike.${term},author_name.ilike.${term}`,
      );
    }

    const { data, error } = await queryBuilder;
    if (error) {
      throw error;
    }

    const materials = (data ?? []).map((record) => recordToMaterial(record));
    return NextResponse.json({ materials });
  } catch (caught) {
    return NextResponse.json({
      error: caught instanceof Error ? caught.message : "Error buscando materiales.",
      materials: [],
    }, { status: 500 });
  }
}
