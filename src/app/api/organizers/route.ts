import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ organizers: [] });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ organizers: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("organizers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ organizers: data ?? [] });
  } catch (caught) {
    return NextResponse.json({ organizers: [], error: caught instanceof Error ? caught.message : "Error cargando organizadores." }, { status: 500 });
  }
}
