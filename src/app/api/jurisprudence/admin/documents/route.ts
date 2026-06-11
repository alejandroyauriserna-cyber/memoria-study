import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jurisprudenceRowToRecord, type JurisprudenceDocumentRow } from "@/lib/jurisprudence/mapper";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

export const runtime = "nodejs";

const VALID_STATUS = new Set(["pending", "published", "rejected", "all"]);

export async function GET(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    const admin = createAdminClient();
    let query = admin
      .from("jurisprudence_documents")
      .select("*")
      .not("submitted_by", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: (data as JurisprudenceDocumentRow[]).map(jurisprudenceRowToRecord),
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar documentos." },
      { status: 500 },
    );
  }
}
