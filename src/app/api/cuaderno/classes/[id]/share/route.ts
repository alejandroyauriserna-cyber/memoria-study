import { NextResponse } from "next/server";
import { requireCuadernoUser } from "@/lib/cuaderno/auth";
import {
  disableCuadernoShare,
  enableCuadernoShare,
  listCollaboratorsForClass,
} from "@/lib/cuaderno/share-server";
import { hasSupabaseEnv } from "@/lib/env";
import type { CuadernoSharePermission } from "@/types/cuaderno";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const { id } = await context.params;
    const collaborators = await listCollaboratorsForClass(id, user.id);
    return NextResponse.json({ collaborators });
  } catch (caught) {
    console.error("[cuaderno/share GET]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar colaboradores." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({ error: "Supabase no configurado." }, { status: 503 });
    }

    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as { permission?: CuadernoSharePermission };

    const permission = body.permission === "edit" ? "edit" : "view";
    const result = await enableCuadernoShare(id, user.id, permission);

    return NextResponse.json(result);
  } catch (caught) {
    console.error("[cuaderno/share POST]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo generar el enlace." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCuadernoUser();
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const { id } = await context.params;
    await disableCuadernoShare(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (caught) {
    console.error("[cuaderno/share DELETE]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "No se pudo desactivar." },
      { status: 500 },
    );
  }
}
