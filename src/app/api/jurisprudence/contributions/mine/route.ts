import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { jurisprudenceRowToRecord, type JurisprudenceDocumentRow } from "@/lib/jurisprudence/mapper";
import { isUntInstitutionalEmail } from "@/lib/jurisprudence/unt-access";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ items: [] });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !isUntInstitutionalEmail(user.email)) {
      return NextResponse.json({ items: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("jurisprudence_documents")
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: (data as JurisprudenceDocumentRow[]).map(jurisprudenceRowToRecord),
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar tus aportes." },
      { status: 500 },
    );
  }
}
