import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizePdfFileName } from "@/lib/jurisprudence/build-document-id";
import { ingestItemToReview } from "@/lib/jurisprudence/process-ingest-item";
import type { IngestItemRow } from "@/lib/jurisprudence/process-ingest-item";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

export const runtime = "nodejs";
export const maxDuration = 300;

const BUCKET = "jurisprudence-pdfs";
const MAX_FILES = 200;
const MAX_FILE_BYTES = 20 * 1024 * 1024;

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const bucketInfo = await admin.storage.getBucket(BUCKET);
  if (bucketInfo.error?.message?.toLowerCase().includes("not found") || !bucketInfo.data) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_BYTES,
      allowedMimeTypes: ["application/pdf"],
    });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const admin = createAdminClient();

    if (batchId) {
      const { data: batch, error: batchError } = await admin
        .from("jurisprudence_ingest_batches")
        .select("*")
        .eq("id", batchId)
        .single();

      if (batchError || !batch) {
        return NextResponse.json({ error: "Lote no encontrado." }, { status: 404 });
      }

      const { data: items } = await admin
        .from("jurisprudence_ingest_items")
        .select("*")
        .eq("batch_id", batchId)
        .order("created_at", { ascending: true });

      return NextResponse.json({
        batch: {
          id: batch.id,
          label: batch.label,
          status: batch.status,
          totalCount: batch.total_count,
          processedCount: batch.processed_count,
          publishedCount: batch.published_count,
          createdAt: batch.created_at,
        },
        items: (items ?? []).map((row) => ingestItemToReview(row as IngestItemRow)),
      });
    }

    const { data: batches } = await admin
      .from("jurisprudence_ingest_batches")
      .select("id, label, status, total_count, processed_count, published_count, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      batches: (batches ?? []).map((b) => ({
        id: b.id,
        label: b.label,
        status: b.status,
        totalCount: b.total_count,
        processedCount: b.processed_count,
        publishedCount: b.published_count,
        createdAt: b.created_at,
      })),
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar ingesta." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const label = String(formData.get("label") ?? "").trim() || null;
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "Sube al menos un PDF." }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Máximo ${MAX_FILES} archivos por lote.` }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: `${file.name} supera 20 MB.` }, { status: 400 });
      }
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json({ error: `${file.name} no es PDF.` }, { status: 400 });
      }
    }

    const admin = createAdminClient();
    await ensureBucket(admin);

    const { data: batch, error: batchError } = await admin
      .from("jurisprudence_ingest_batches")
      .insert({
        created_by: auth.user.id,
        label,
        status: "uploading",
        total_count: files.length,
      })
      .select("id")
      .single();

    if (batchError || !batch) {
      return NextResponse.json({ error: "No se pudo crear el lote." }, { status: 500 });
    }

    const batchId = batch.id as string;
    const uploaded: string[] = [];
    const failed: string[] = [];

    for (const file of files) {
      const fileName = sanitizePdfFileName(file.name);
      const storagePath = `ingest/${batchId}/${crypto.randomUUID()}-${fileName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

      if (uploadError) {
        failed.push(file.name);
        continue;
      }

      const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

      const { error: itemError } = await admin.from("jurisprudence_ingest_items").insert({
        batch_id: batchId,
        file_name: fileName,
        storage_path: storagePath,
        pdf_url: urlData.publicUrl,
        status: "queued",
      });

      if (itemError) {
        failed.push(file.name);
      } else {
        uploaded.push(fileName);
      }
    }

    await admin
      .from("jurisprudence_ingest_batches")
      .update({
        status: uploaded.length ? "review" : "failed",
        total_count: uploaded.length,
      })
      .eq("id", batchId);

    return NextResponse.json({
      batchId,
      uploaded: uploaded.length,
      failed: failed.length,
      failedFiles: failed,
    });
  } catch (caught) {
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al subir PDFs." },
      { status: 500 },
    );
  }
}
