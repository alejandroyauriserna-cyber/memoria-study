import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";
import { studyDocumentContentType } from "@/lib/documents/kinds";
import { verifyMaterialAccess } from "@/lib/materials/verify-access";
import { downloadMaterialPdf } from "@/lib/organizers/download-material-pdf";
import { sanitizeMaterialFileName } from "@/lib/materials/sanitize-file-name";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
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
      .select("file_url,file_name")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!material?.file_url) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    const { buffer } = await downloadMaterialPdf(material.file_url);
    const fileName = sanitizeMaterialFileName(material.file_name ?? "material");
    const contentType = studyDocumentContentType(fileName);
    const disposition =
      new URL(request.url).searchParams.get("disposition") === "attachment"
        ? "attachment"
        : "inline";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (caught) {
    console.error("[materials/file]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo cargar el archivo." },
      { status: 500 },
    );
  }
}
