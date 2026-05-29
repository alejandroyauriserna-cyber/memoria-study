import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ organizers: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("organizers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ organizers: data ?? [] });
  } catch (caught) {
    return NextResponse.json({ organizers: [], error: caught instanceof Error ? caught.message : "Error cargando organizadores." }, { status: 500 });
  }
}
