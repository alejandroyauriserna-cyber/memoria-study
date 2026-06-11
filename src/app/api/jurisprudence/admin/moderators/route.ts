import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateModeratorCache } from "@/lib/jurisprudence/moderator-emails";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

export const runtime = "nodejs";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function GET() {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("jurisprudence_moderators")
      .select("email, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al listar moderadores." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as { email?: string };
    const email = normalizeEmail(body.email ?? "");
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("jurisprudence_moderators").upsert({ email });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateModeratorCache();
    return NextResponse.json({ ok: true, email });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al añadir moderador." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get("email") ?? "");
    if (!email) {
      return NextResponse.json({ error: "Falta el correo." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from("jurisprudence_moderators").delete().eq("email", email);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateModeratorCache();
    return NextResponse.json({ ok: true });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al quitar moderador." },
      { status: 500 },
    );
  }
}
