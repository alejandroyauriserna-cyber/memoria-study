import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteMaterialById } from "@/lib/materials/delete-material";
import { requireJurisprudenceModerator } from "@/lib/jurisprudence/require-moderator";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await requireJurisprudenceModerator();
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Material inválido." }, { status: 400 });
    }

    const admin = createAdminClient();
    const result = await deleteMaterialById(admin, id);

    if (!result.found) {
      return NextResponse.json({ error: "Material no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (caught) {
    console.error("[materials/delete]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo eliminar el material." },
      { status: 500 },
    );
  }
}
