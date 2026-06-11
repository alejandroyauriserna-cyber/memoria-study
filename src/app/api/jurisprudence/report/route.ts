import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { getUntAccessDenialMessage, isUntInstitutionalEmail } from "@/lib/jurisprudence/unt-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    if (!isUntInstitutionalEmail(user.email)) {
      return NextResponse.json({ error: getUntAccessDenialMessage() }, { status: 403 });
    }

    const body = (await request.json()) as { documentId?: string; reason?: string };
    const documentId = body.documentId?.trim();
    const reason = body.reason?.trim() ?? "";

    if (!documentId) {
      return NextResponse.json({ error: "Falta el documento." }, { status: 400 });
    }
    if (reason.length < 10) {
      return NextResponse.json(
        { error: "Describe el problema en al menos 10 caracteres." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: doc } = await admin
      .from("jurisprudence_documents")
      .select("id")
      .eq("id", documentId)
      .eq("status", "published")
      .maybeSingle();

    if (!doc) {
      return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
    }

    const { error } = await admin.from("jurisprudence_reports").insert({
      document_id: documentId,
      reporter_id: user.id,
      reason,
    });

    if (error) {
      return NextResponse.json({ error: "No se pudo enviar el reporte." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al reportar." },
      { status: 500 },
    );
  }
}
