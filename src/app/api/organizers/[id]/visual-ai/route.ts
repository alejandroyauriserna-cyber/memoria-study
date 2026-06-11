import { NextResponse } from "next/server";
import {
  parseVisualAiFormatFromBody,
  runVisualAiGeneration,
} from "@/lib/organizers/run-visual-ai-generation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePremiumFeature } from "@/lib/billing/require-premium-api";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const premiumBlock = requirePremiumFeature("gemini-infographic");
    if (premiumBlock) return premiumBlock;

    const { id } = await context.params;

    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase no está configurado." }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const formatId = parseVisualAiFormatFromBody(body);
    if (!formatId) {
      return NextResponse.json({ error: "Formato visual no válido." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: organizer, error: organizerError } = await admin
      .from("organizers")
      .select("id,user_id,content")
      .eq("id", id)
      .maybeSingle();

    if (organizerError) throw organizerError;

    if (!organizer) {
      return NextResponse.json({ error: "Organizador no encontrado." }, { status: 404 });
    }

    if (organizer.user_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para generar recursos visuales." }, { status: 403 });
    }

    const { output, diagnostics, mergedContent, warning, userNotice, usedFallback } =
      await runVisualAiGeneration({
        organizerId: id,
        formatId,
        rawContent: organizer.content,
        userId: user.id,
      });

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("organizers")
      .update({ content: mergedContent, updated_at: now })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      organizer: updated,
      visualAiOutput: output,
      formatId,
      usedFallback,
      warning,
      userNotice: userNotice ?? warning ?? null,
      imageDiagnostics: diagnostics ?? null,
    });
  } catch (caught) {
    console.error("[organizers/visual-ai]", caught);

    return NextResponse.json(
      { error: "Ocurrió un error al generar el recurso visual. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
