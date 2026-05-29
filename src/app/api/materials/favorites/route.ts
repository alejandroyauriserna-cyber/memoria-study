import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { recordToMaterial } from "@/lib/materials/mapper";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ materials: [] });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ materials: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("material_favorites")
      .select("material_id, materials(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const materials = (data ?? [])
      .map((item: any) => item.materials)
      .filter(Boolean)
      .map((record: any) => ({
        ...recordToMaterial(record),
        isFavorite: true,
      }));

    return NextResponse.json({ materials });
  } catch (caught) {
    return NextResponse.json({ materials: [], error: caught instanceof Error ? caught.message : "Error cargando favoritos." }, { status: 500 });
  }
}
