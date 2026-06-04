import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { extractPdfFromBuffer } from "@/lib/pdf/extract";
import { truncateExtractedText } from "@/lib/legal-sources/server";
import type { LegalSourceCategory } from "@/types/legal-sources";

export const runtime = "nodejs";
export const maxDuration = 120;

const BUCKET = "legal-sources";
const VALID_CATEGORIES = new Set<LegalSourceCategory>([
  "normativa",
  "jurisprudencia",
  "doctrina",
  "material_universitario",
]);

function sanitizeFileName(fileName: string): string {
  const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const lastDotIndex = normalized.lastIndexOf(".");
  const nameWithoutExt = lastDotIndex > 0 ? normalized.substring(0, lastDotIndex) : normalized;
  const extension = lastDotIndex > 0 ? normalized.substring(lastDotIndex + 1) : "pdf";

  const sanitizedName = nameWithoutExt.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
  const sanitizedExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
  const finalName = sanitizedName || "archivo";
  const finalExtension = sanitizedExtension ? `.${sanitizedExtension}` : ".pdf";

  return `${finalName}${finalExtension}`;
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const bucketInfo = await admin.storage.getBucket(BUCKET);
  if (bucketInfo.error?.message?.toLowerCase().includes("not found") || !bucketInfo.data) {
    await admin.storage.createBucket(BUCKET, { public: true });
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
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "doctrina") as LegalSourceCategory;
    const author = String(formData.get("author") ?? "").trim() || null;
    const description = String(formData.get("description") ?? "").trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Debes subir un archivo PDF." }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "El título es obligatorio." }, { status: 400 });
    }

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Solo se admiten archivos PDF." }, { status: 400 });
    }

    const admin = createAdminClient();
    await ensureBucket(admin);

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedFileName = sanitizeFileName(file.name);
    const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizedFileName}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      console.error("[legal-sources/upload]", uploadError);
      return NextResponse.json({ error: "No se pudo subir el PDF." }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    let extractedText = "";
    try {
      const extracted = await extractPdfFromBuffer(buffer, sanitizedFileName);
      extractedText = extracted.text;
    } catch {
      extractedText = "";
    }

    const { data: row, error: insertError } = await admin
      .schema("public")
      .from("legal_sources")
      .insert({
        user_id: user.id,
        title,
        category,
        kind: "upload",
        author,
        description,
        file_url: fileUrl,
        file_name: sanitizedFileName,
        extracted_text: extractedText || null,
        enabled: true,
        priority: 1,
      })
      .select("*")
      .single();

    if (insertError || !row) {
      console.error("[legal-sources/upload insert]", insertError);
      return NextResponse.json({ error: "No se pudo registrar la fuente." }, { status: 500 });
    }

    return NextResponse.json({
      source: {
        id: row.id,
        title: row.title,
        category: row.category,
        kind: "upload" as const,
        enabled: row.enabled,
        priority: row.priority,
        author: row.author ?? undefined,
        description: row.description ?? undefined,
        fileUrl: row.file_url ?? undefined,
        fileName: row.file_name ?? undefined,
        extractedText: row.extracted_text ? truncateExtractedText(row.extracted_text) : undefined,
        updatedAt: row.updated_at ?? undefined,
      },
    });
  } catch (caught) {
    console.error("[legal-sources/upload]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al subir fuente." },
      { status: 500 },
    );
  }
}
