import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ids: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ids: [] });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jurisprudence_favorites")
    .select("document_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message, ids: [] }, { status: 500 });
  }

  return NextResponse.json({
    ids: (data ?? []).map((row) => row.document_id as string),
  });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para guardar resoluciones." }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string };
  const documentId = body.id?.trim();

  if (!documentId) {
    return NextResponse.json({ error: "ID de documento requerido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("jurisprudence_favorites").upsert(
    {
      user_id: user.id,
      document_id: documentId,
    },
    { onConflict: "user_id,document_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para gestionar favoritos." }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string };
  const documentId = body.id?.trim();

  if (!documentId) {
    return NextResponse.json({ error: "ID de documento requerido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("jurisprudence_favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("document_id", documentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
