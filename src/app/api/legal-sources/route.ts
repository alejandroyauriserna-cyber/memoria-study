import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import {
  loadUserLegalSourceSettings,
  saveUserLegalSourceSettings,
} from "@/lib/legal-sources/server";
import { mergeWithDefaultSources } from "@/lib/legal-sources/defaults";
import type { LegalSourcesSettings } from "@/types/legal-sources";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasSupabaseEnv()) {
      return NextResponse.json({
        strictMode: false,
        strictNormativeMode: true,
        sources: mergeWithDefaultSources([]),
        synced: false,
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const settings = await loadUserLegalSourceSettings(user.id);
    return NextResponse.json({
      ...(settings ?? {
        strictMode: false,
        strictNormativeMode: true,
        wizardCompleted: false,
        sources: mergeWithDefaultSources([]),
      }),
      synced: true,
    });
  } catch (caught) {
    console.error("[legal-sources GET]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al cargar fuentes." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
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

    const body = (await request.json()) as LegalSourcesSettings;
    if (!body || !Array.isArray(body.sources)) {
      return NextResponse.json({ error: "Configuración inválida." }, { status: 400 });
    }

    await saveUserLegalSourceSettings(user.id, body);
    return NextResponse.json({ ok: true });
  } catch (caught) {
    console.error("[legal-sources PUT]", caught);
    return NextResponse.json(
      { error: caught instanceof Error ? caught.message : "Error al guardar fuentes." },
      { status: 500 },
    );
  }
}
