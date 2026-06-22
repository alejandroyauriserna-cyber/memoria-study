import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { detectStudyDocumentKind } from "@/lib/documents/kinds";
import { verifyMaterialAccess } from "@/lib/materials/verify-access";
import { downloadMaterialPdf } from "@/lib/organizers/download-material-pdf";
import { getPdfPageCount } from "@/lib/guided-study/extract-pages";
import { extractPptxPagesFromBuffer } from "@/lib/pptx/extract";
import { materialFileApiPath } from "@/lib/materials/material-viewer";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

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

    const access = await verifyMaterialAccess(id, user.id);
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason ?? "Sin acceso al material." }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: material, error } = await admin
      .schema("public")
      .from("materials")
      .select("id,title,file_name,file_url")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!material?.file_url) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    const fileName = material.file_name ?? "material";
    const documentKind = detectStudyDocumentKind(fileName) ?? "pdf";
    const { buffer } = await downloadMaterialPdf(material.file_url);

    if (documentKind === "pptx") {
      const pages = await extractPptxPagesFromBuffer(buffer);
      return NextResponse.json({
        id: material.id,
        title: material.title,
        fileName,
        documentKind,
        fileUrl: materialFileApiPath(id),
        totalPages: pages.length,
        pageTexts: pages.map((page) => page.text),
      });
    }

    const totalPages = await getPdfPageCount(buffer);
    return NextResponse.json({
      id: material.id,
      title: material.title,
      fileName,
      documentKind: "pdf",
      fileUrl: materialFileApiPath(id),
      totalPages,
    });
  } catch (caught) {
    console.error("[materials/preview]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo preparar la vista previa." },
      { status: 500 },
    );
  }
}
