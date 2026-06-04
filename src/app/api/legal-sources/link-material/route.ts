import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { downloadMaterialPdf } from "@/lib/organizers/download-material-pdf";
import { extractPdfFromBuffer } from "@/lib/pdf/extract";
import { truncateExtractedText } from "@/lib/legal-sources/server";
import type { LegalSourceCategory } from "@/types/legal-sources";

export const runtime = "nodejs";
export const maxDuration = 120;

const VALID_CATEGORIES = new Set<LegalSourceCategory>([
  "normativa",
  "jurisprudencia",
  "doctrina",
  "material_universitario",
]);

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

    const body = (await request.json()) as {
      materialId?: string;
      category?: LegalSourceCategory;
    };

    if (!body.materialId) {
      return NextResponse.json({ error: "Falta materialId." }, { status: 400 });
    }

    const category = body.category ?? "material_universitario";
    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: existing } = await admin
      .schema("public")
      .from("legal_sources")
      .select("id")
      .eq("user_id", user.id)
      .eq("material_id", body.materialId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Este material ya está vinculado como fuente." }, { status: 409 });
    }

    const { data: material, error: materialError } = await admin
      .schema("public")
      .from("materials")
      .select("id, title, file_name, file_url, author_name")
      .eq("id", body.materialId)
      .maybeSingle();

    if (materialError || !material?.file_url) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    let extractedText = "";
    try {
      const { buffer } = await downloadMaterialPdf(material.file_url);
      const extracted = await extractPdfFromBuffer(buffer, material.file_name ?? "material.pdf");
      extractedText = extracted.text;
    } catch {
      extractedText = "";
    }

    const { data: row, error: insertError } = await admin
      .schema("public")
      .from("legal_sources")
      .insert({
        user_id: user.id,
        title: material.title,
        category,
        kind: "material",
        author: material.author_name,
        description: `Material de biblioteca: ${material.title}`,
        file_url: material.file_url,
        file_name: material.file_name,
        material_id: material.id,
        extracted_text: extractedText || null,
        enabled: true,
        priority: 1,
      })
      .select("*")
      .single();

    if (insertError || !row) {
      console.error("[legal-sources/link-material]", insertError);
      return NextResponse.json({ error: "No se pudo vincular el material." }, { status: 500 });
    }

    return NextResponse.json({
      source: {
        id: row.id,
        title: row.title,
        category: row.category,
        kind: "material" as const,
        enabled: row.enabled,
        priority: row.priority,
        author: row.author ?? undefined,
        description: row.description ?? undefined,
        fileUrl: row.file_url ?? undefined,
        fileName: row.file_name ?? undefined,
        materialId: row.material_id ?? undefined,
        extractedText: row.extracted_text ? truncateExtractedText(row.extracted_text) : undefined,
        updatedAt: row.updated_at ?? undefined,
      },
    });
  } catch (caught) {
    console.error("[legal-sources/link-material]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al vincular material." },
      { status: 500 },
    );
  }
}
