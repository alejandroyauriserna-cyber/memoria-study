import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("jurisprudence_reports")
      .select("id, document_id, reporter_id, reason, status, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const documentIds = [...new Set((data ?? []).map((r) => r.document_id as string))];
    let titles: Record<string, string> = {};

    if (documentIds.length) {
      const { data: docs } = await admin
        .from("jurisprudence_documents")
        .select("id, title")
        .in("id", documentIds);
      titles = Object.fromEntries((docs ?? []).map((d) => [d.id as string, d.title as string]));
    }

    return NextResponse.json({
      items: (data ?? []).map((row) => ({
        id: row.id as string,
        documentId: row.document_id as string,
        documentTitle: titles[row.document_id as string] ?? row.document_id,
        reporterId: row.reporter_id as string,
        reason: row.reason as string,
        createdAt: row.created_at as string,
      })),
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar reportes." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as { reportId?: string };
    const reportId = body.reportId?.trim();
    if (!reportId) {
      return NextResponse.json({ error: "Falta reportId." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("jurisprudence_reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", reportId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al resolver reporte." },
      { status: 500 },
    );
  }
}
