import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import {
  buildJurisprudenceDocumentId,
  ensureUniqueJurisprudenceId,
  isJurisprudenceMateria,
  isJurisprudenceTipo,
  parseKeywordsInput,
  sanitizePdfFileName,
} from "@/lib/jurisprudence/build-document-id";
import { jurisprudenceRowToRecord } from "@/lib/jurisprudence/mapper";

export const runtime = "nodejs";
export const maxDuration = 120;

const BUCKET = "jurisprudence-pdfs";

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const bucketInfo = await admin.storage.getBucket(BUCKET);
  if (bucketInfo.error?.message?.toLowerCase().includes("not found") || !bucketInfo.data) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: ["application/pdf"],
    });
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Inicia sesión para aportar sentencias a la biblioteca." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const tipo = String(formData.get("tipo") ?? "").trim();
    const materia = String(formData.get("materia") ?? "").trim();
    const submateria = String(formData.get("submateria") ?? "").trim();
    const yearRaw = String(formData.get("year") ?? "").trim();
    const organo = String(formData.get("organo") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const keywordsRaw = String(formData.get("keywords") ?? "").trim();
    const expediente = String(formData.get("expediente") ?? "").trim() || null;
    const pdfUrlExternal = String(formData.get("pdfUrl") ?? "").trim() || null;

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
    }
    if (!isJurisprudenceTipo(tipo)) {
      return NextResponse.json({ error: "Tipo de resolución inválido." }, { status: 400 });
    }
    if (!isJurisprudenceMateria(materia)) {
      return NextResponse.json({ error: "Materia inválida." }, { status: 400 });
    }
    if (!submateria) {
      return NextResponse.json({ error: "Indica el tema o submateria." }, { status: 400 });
    }
    if (!organo) {
      return NextResponse.json({ error: "Indica el órgano emisor." }, { status: 400 });
    }
    if (!summary || summary.length < 40) {
      return NextResponse.json(
        { error: "Escribe un resumen de al menos 40 caracteres." },
        { status: 400 },
      );
    }

    const year = Number(yearRaw);
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      return NextResponse.json({ error: "Año inválido." }, { status: 400 });
    }

    const hasFile = file instanceof File;
    if (!hasFile && !pdfUrlExternal) {
      return NextResponse.json(
        { error: "Sube un PDF o pega el enlace oficial al documento." },
        { status: 400 },
      );
    }

    if (hasFile) {
      const pdfFile = file as File;
      if (pdfFile.type !== "application/pdf" && !pdfFile.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: "Solo se admiten archivos PDF." }, { status: 400 });
      }
      if (pdfFile.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: "El PDF no puede superar 20 MB." }, { status: 400 });
      }
    }

    const admin = createAdminClient();
    let pdfUrl = pdfUrlExternal ?? "";
    let fileName: string | null = null;

    if (hasFile) {
      await ensureBucket(admin);
      const pdfFile = file as File;
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      fileName = sanitizePdfFileName(pdfFile.name);
      const storagePath = `${user.id}/${crypto.randomUUID()}-${fileName}`;

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

      if (uploadError) {
        return NextResponse.json({ error: "No se pudo subir el PDF." }, { status: 500 });
      }

      const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
      pdfUrl = urlData.publicUrl;
    }

    const baseId = buildJurisprudenceDocumentId(expediente, title);
    let documentId = baseId;

    const keywords = parseKeywordsInput(keywordsRaw);
    if (!keywords.length) {
      keywords.push(submateria.toLowerCase());
    }

    const insertPayload = {
      id: documentId,
      title,
      tipo,
      materia,
      submateria,
      year,
      organo,
      summary,
      keywords,
      pdf_url: pdfUrl,
      expediente,
      source_url: pdfUrlExternal,
      file_name: fileName,
      submitted_by: user.id,
      status: "published" as const,
      is_public: true,
    };

    let { data: row, error: insertError } = await admin
      .from("jurisprudence_documents")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError?.code === "23505") {
      documentId = ensureUniqueJurisprudenceId(baseId, crypto.randomUUID().slice(0, 8));
      const retry = await admin
        .from("jurisprudence_documents")
        .insert({ ...insertPayload, id: documentId })
        .select("*")
        .single();
      row = retry.data;
      insertError = retry.error;
    }

    if (insertError || !row) {
      return NextResponse.json(
        { error: insertError?.message ?? "No se pudo registrar la resolución." },
        { status: 500 },
      );
    }

    const record = jurisprudenceRowToRecord(row);

    return NextResponse.json({
      ok: true,
      document: {
        ...record,
        isCommunityContribution: true,
        status: row.status as string,
      },
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al aportar resolución." },
      { status: 500 },
    );
  }
}
