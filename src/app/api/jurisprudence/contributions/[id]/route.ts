import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { deleteJurisprudenceContribution } from "@/lib/jurisprudence/delete-contribution";
import type { JurisprudenceDocumentRow } from "@/lib/jurisprudence/mapper";
import {
  getUntAccessDenialMessage,
  isJurisprudenceModerator,
  isUntInstitutionalEmail,
} from "@/lib/jurisprudence/unt-access";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const { id } = await context.params;
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

    const admin = createAdminClient();
    const { data: row, error: fetchError } = await admin
      .from("jurisprudence_documents")
      .select("id, pdf_url, file_name, submitted_by")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Resolución no encontrada." }, { status: 404 });
    }

    const document = row as JurisprudenceDocumentRow;
    const isOwner = document.submitted_by === user.id;
    const isModerator = isJurisprudenceModerator(user.email);

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { error: "Solo puedes retirar tus propios aportes." },
        { status: 403 },
      );
    }

    if (!document.submitted_by && !isModerator) {
      return NextResponse.json(
        { error: "No puedes eliminar entradas del catálogo curado." },
        { status: 403 },
      );
    }

    await deleteJurisprudenceContribution(admin, document);

    return NextResponse.json({ ok: true });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al eliminar aporte." },
      { status: 500 },
    );
  }
}
