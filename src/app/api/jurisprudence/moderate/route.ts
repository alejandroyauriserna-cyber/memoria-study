import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteJurisprudenceContribution } from "@/lib/jurisprudence/delete-contribution";
import { jurisprudenceRowToRecord, type JurisprudenceDocumentRow } from "@/lib/jurisprudence/mapper";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";
import { extractAndStoreJurisprudenceText } from "@/lib/jurisprudence/extract-document-text";

export const runtime = "nodejs";

type ModerateBody = {
  documentId?: string;
  action?: "approve" | "reject" | "delete";
  rejectionReason?: string;
};

export async function POST(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as ModerateBody;
    const documentId = body.documentId?.trim();
    const action = body.action;

    if (!documentId || !action) {
      return NextResponse.json({ error: "Faltan documentId o action." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: row, error: fetchError } = await admin
      .from("jurisprudence_documents")
      .select("*")
      .eq("id", documentId)
      .maybeSingle();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
    }

    const document = row as JurisprudenceDocumentRow;

    if (action === "delete") {
      await deleteJurisprudenceContribution(admin, document);
      return NextResponse.json({ ok: true, deleted: true });
    }

    if (action === "approve") {
      const { data: updated, error } = await admin
        .from("jurisprudence_documents")
        .update({ status: "published", is_public: true, rejection_reason: null })
        .eq("id", documentId)
        .select("*")
        .single();

      if (error || !updated) {
        return NextResponse.json({ error: "No se pudo aprobar el aporte." }, { status: 500 });
      }

      void extractAndStoreJurisprudenceText(admin, updated as JurisprudenceDocumentRow);

      return NextResponse.json({
        ok: true,
        document: jurisprudenceRowToRecord(updated as JurisprudenceDocumentRow),
      });
    }

    if (action === "reject") {
      const rejectionReason = body.rejectionReason?.trim() || "No cumple los criterios de la biblioteca.";
      const { data: updated, error } = await admin
        .from("jurisprudence_documents")
        .update({
          status: "rejected",
          is_public: false,
          rejection_reason: rejectionReason,
        })
        .eq("id", documentId)
        .select("*")
        .single();

      if (error || !updated) {
        return NextResponse.json({ error: "No se pudo rechazar el aporte." }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        document: jurisprudenceRowToRecord(updated as JurisprudenceDocumentRow),
      });
    }

    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error de moderación." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("jurisprudence_documents")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      items: (data as JurisprudenceDocumentRow[]).map(jurisprudenceRowToRecord),
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar pendientes." },
      { status: 500 },
    );
  }
}
